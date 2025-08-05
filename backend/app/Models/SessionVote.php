<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Crypt;
use Carbon\Carbon;

class SessionVote extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'session_id',
        'title',
        'description',
        'question',
        'type',
        'voting_method',
        'is_secret',
        'is_anonymous',
        'majority_required',
        'quorum_required',
        'started_at',
        'ends_at',
        'closed_at',
        'status',
        'options',
        'results',
        'result_summary',
        'created_by',
        'closed_by',
        'metadata',
        'security_hash',
        'blockchain_record',
    ];

    protected $casts = [
        'is_secret' => 'boolean',
        'is_anonymous' => 'boolean',
        'started_at' => 'datetime',
        'ends_at' => 'datetime',
        'closed_at' => 'datetime',
        'options' => 'array',
        'results' => 'array',
        'result_summary' => 'array',
        'metadata' => 'array',
        'majority_required' => 'decimal:2',
        'quorum_required' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Types de votes
     */
    const TYPE_SIMPLE = 'simple'; // Oui/Non
    const TYPE_MULTIPLE_CHOICE = 'multiple_choice'; // Choix multiples
    const TYPE_RANKING = 'ranking'; // Classement
    const TYPE_APPROVAL = 'approval'; // Approbation multiple
    const TYPE_ELECTION = 'election'; // Élection

    /**
     * Méthodes de vote
     */
    const METHOD_OPEN = 'open'; // Vote à main levée (visible)
    const METHOD_SECRET = 'secret'; // Vote secret
    const METHOD_ANONYMOUS = 'anonymous'; // Vote anonyme complet

    /**
     * Statuts des votes
     */
    const STATUS_DRAFT = 'draft';
    const STATUS_OPEN = 'open';
    const STATUS_CLOSED = 'closed';
    const STATUS_CANCELLED = 'cancelled';

    /**
     * Relation avec la session
     */
    public function session()
    {
        return $this->belongsTo(Session::class);
    }

    /**
     * Relation avec le créateur
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relation avec celui qui a fermé le vote
     */
    public function closer()
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    /**
     * Relation avec les réponses de vote
     */
    public function responses()
    {
        return $this->hasMany(SessionVoteResponse::class, 'vote_id');
    }

    /**
     * Scope pour les votes actifs
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_OPEN);
    }

    /**
     * Scope pour les votes terminés
     */
    public function scopeClosed($query)
    {
        return $query->where('status', self::STATUS_CLOSED);
    }

    /**
     * Scope par type de vote
     */
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Vérifier si le vote est ouvert
     */
    public function isOpen()
    {
        return $this->status === self::STATUS_OPEN 
               && $this->started_at <= now()
               && ($this->ends_at === null || $this->ends_at > now());
    }

    /**
     * Vérifier si le vote est terminé
     */
    public function isClosed()
    {
        return $this->status === self::STATUS_CLOSED;
    }

    /**
     * Vérifier si le vote peut démarrer
     */
    public function canStart()
    {
        return $this->status === self::STATUS_DRAFT
               && $this->session->isLive()
               && $this->hasRequiredQuorum();
    }

    /**
     * Vérifier si le quorum est atteint
     */
    public function hasRequiredQuorum()
    {
        $eligibleVoters = $this->getEligibleVoters()->count();
        return $eligibleVoters >= $this->quorum_required;
    }

    /**
     * Obtenir les votants éligibles
     */
    public function getEligibleVoters()
    {
        return $this->session->participants()
                   ->present()
                   ->withVotingRights();
    }

    /**
     * Démarrer le vote
     */
    public function start()
    {
        if (!$this->canStart()) {
            throw new \Exception('Impossible de démarrer le vote. Vérifiez le quorum et le statut de la session.');
        }

        $this->update([
            'status' => self::STATUS_OPEN,
            'started_at' => now(),
            'security_hash' => $this->generateSecurityHash(),
        ]);

        // Enregistrer l'événement
        $this->logVoteEvent('vote_opened', [
            'eligible_voters' => $this->getEligibleVoters()->count(),
            'opened_by' => auth()->id(),
        ]);

        // Notifier les participants éligibles
        $this->notifyEligibleVoters('vote_opened');

        return $this;
    }

    /**
     * Fermer le vote
     */
    public function close($reason = null)
    {
        if (!$this->isOpen()) {
            throw new \Exception('Seul un vote ouvert peut être fermé.');
        }

        // Calculer les résultats
        $results = $this->calculateResults();

        $this->update([
            'status' => self::STATUS_CLOSED,
            'closed_at' => now(),
            'closed_by' => auth()->id(),
            'results' => $results['detailed'],
            'result_summary' => $results['summary'],
            'metadata' => array_merge($this->metadata ?? [], [
                'closure_reason' => $reason,
                'final_hash' => $this->generateFinalHash(),
            ])
        ]);

        // Enregistrer l'événement
        $this->logVoteEvent('vote_closed', [
            'total_responses' => $this->responses()->count(),
            'results_summary' => $results['summary'],
            'closed_by' => auth()->id(),
            'reason' => $reason,
        ]);

        // Notifier les participants
        $this->notifyParticipants('vote_closed', $results['summary']);

        return $this;
    }

    /**
     * Enregistrer un vote
     */
    public function castVote($participantId, $voteData, $voteOnBehalfOf = null)
    {
        if (!$this->isOpen()) {
            throw new \Exception('Le vote n\'est pas ouvert.');
        }

        $participant = $this->session->participants()->findOrFail($participantId);

        if (!$participant->canVote()) {
            throw new \Exception('Ce participant ne peut pas voter.');
        }

        // Vérifier si déjà voté (sauf si vote modifiable)
        $existingVote = $this->responses()
                            ->where('participant_id', $participantId)
                            ->where('vote_on_behalf_of', $voteOnBehalfOf)
                            ->first();

        if ($existingVote && !$this->isVoteModifiable()) {
            throw new \Exception('Ce participant a déjà voté.');
        }

        // Valider les données de vote
        $this->validateVoteData($voteData);

        // Chiffrer le vote si secret
        $encryptedVote = $this->is_secret ? Crypt::encrypt($voteData) : $voteData;

        // Créer ou mettre à jour la réponse
        $response = $existingVote ?: new SessionVoteResponse();
        
        $response->fill([
            'vote_id' => $this->id,
            'participant_id' => $participantId,
            'vote_data' => $encryptedVote,
            'vote_on_behalf_of' => $voteOnBehalfOf,
            'is_secret' => $this->is_secret,
            'cast_at' => now(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'security_token' => $this->generateVoteSecurityToken($participantId, $voteData),
        ]);

        $response->save();

        // Enregistrer l'événement (sans révéler le contenu du vote)
        $this->logVoteEvent('vote_cast', [
            'participant_id' => $participantId,
            'participant_name' => $participant->user->name,
            'vote_on_behalf_of' => $voteOnBehalfOf,
            'vote_hash' => hash('sha256', serialize($voteData)),
        ]);

        return $response;
    }

    /**
     * Calculer les résultats du vote
     */
    public function calculateResults()
    {
        $responses = $this->responses()->with('participant.user')->get();
        $totalVotes = $responses->count();
        $eligibleVoters = $this->getEligibleVoters()->count();

        $results = [
            'detailed' => [],
            'summary' => [
                'total_eligible' => $eligibleVoters,
                'total_votes' => $totalVotes,
                'participation_rate' => $eligibleVoters > 0 ? round(($totalVotes / $eligibleVoters) * 100, 2) : 0,
                'quorum_achieved' => $totalVotes >= $this->quorum_required,
                'outcome' => 'pending',
                'winner' => null,
                'majority_achieved' => false,
            ]
        ];

        switch ($this->type) {
            case self::TYPE_SIMPLE:
                $results = $this->calculateSimpleVoteResults($responses, $results);
                break;
            case self::TYPE_MULTIPLE_CHOICE:
                $results = $this->calculateMultipleChoiceResults($responses, $results);
                break;
            case self::TYPE_ELECTION:
                $results = $this->calculateElectionResults($responses, $results);
                break;
            case self::TYPE_RANKING:
                $results = $this->calculateRankingResults($responses, $results);
                break;
            case self::TYPE_APPROVAL:
                $results = $this->calculateApprovalResults($responses, $results);
                break;
        }

        return $results;
    }

    /**
     * Calculer les résultats d'un vote simple (Oui/Non)
     */
    private function calculateSimpleVoteResults($responses, $results)
    {
        $votes = ['oui' => 0, 'non' => 0, 'abstention' => 0];

        foreach ($responses as $response) {
            $voteData = $this->is_secret ? Crypt::decrypt($response->vote_data) : $response->vote_data;
            $choice = strtolower($voteData['choice'] ?? 'abstention');
            
            if (isset($votes[$choice])) {
                $votes[$choice]++;
            }
        }

        $totalValidVotes = $votes['oui'] + $votes['non'];
        $majorityThreshold = $totalValidVotes * ($this->majority_required / 100);

        $results['detailed'] = $votes;
        $results['summary']['majority_achieved'] = $votes['oui'] > $majorityThreshold;
        $results['summary']['outcome'] = $votes['oui'] > $majorityThreshold ? 'adopted' : 'rejected';
        $results['summary']['winning_percentage'] = $totalValidVotes > 0 
            ? round(($votes['oui'] / $totalValidVotes) * 100, 2) 
            : 0;

        return $results;
    }

    /**
     * Calculer les résultats d'un vote à choix multiples
     */
    private function calculateMultipleChoiceResults($responses, $results)
    {
        $votes = [];
        
        // Initialiser les compteurs pour chaque option
        foreach ($this->options as $option) {
            $votes[$option['id']] = [
                'label' => $option['label'],
                'count' => 0,
                'percentage' => 0,
            ];
        }

        foreach ($responses as $response) {
            $voteData = $this->is_secret ? Crypt::decrypt($response->vote_data) : $response->vote_data;
            $choice = $voteData['choice'] ?? null;
            
            if ($choice && isset($votes[$choice])) {
                $votes[$choice]['count']++;
            }
        }

        $totalVotes = $results['summary']['total_votes'];
        
        // Calculer les pourcentages
        foreach ($votes as $optionId => &$vote) {
            $vote['percentage'] = $totalVotes > 0 
                ? round(($vote['count'] / $totalVotes) * 100, 2) 
                : 0;
        }

        // Déterminer le gagnant
        $winner = collect($votes)->sortByDesc('count')->first();
        $majorityThreshold = $totalVotes * ($this->majority_required / 100);

        $results['detailed'] = $votes;
        $results['summary']['winner'] = $winner['label'] ?? null;
        $results['summary']['majority_achieved'] = ($winner['count'] ?? 0) > $majorityThreshold;
        $results['summary']['outcome'] = $results['summary']['majority_achieved'] ? 'decided' : 'no_majority';
        $results['summary']['winning_percentage'] = $winner['percentage'] ?? 0;

        return $results;
    }

    /**
     * Valider les données de vote
     */
    private function validateVoteData($voteData)
    {
        switch ($this->type) {
            case self::TYPE_SIMPLE:
                if (!isset($voteData['choice']) || !in_array(strtolower($voteData['choice']), ['oui', 'non', 'abstention'])) {
                    throw new \Exception('Choix de vote invalide pour un vote simple.');
                }
                break;
                
            case self::TYPE_MULTIPLE_CHOICE:
                if (!isset($voteData['choice'])) {
                    throw new \Exception('Aucun choix spécifié.');
                }
                $validOptions = collect($this->options)->pluck('id')->toArray();
                if (!in_array($voteData['choice'], $validOptions)) {
                    throw new \Exception('Choix invalide.');
                }
                break;
        }
    }

    /**
     * Vérifier si le vote est modifiable après soumission
     */
    private function isVoteModifiable()
    {
        // Logique pour déterminer si on peut modifier un vote
        // Par défaut, les votes ne sont pas modifiables
        return false;
    }

    /**
     * Générer un hash de sécurité pour le vote
     */
    private function generateSecurityHash()
    {
        return hash('sha256', serialize([
            'vote_id' => $this->id,
            'session_id' => $this->session_id,
            'started_at' => $this->started_at,
            'options' => $this->options,
            'random' => random_bytes(32),
        ]));
    }

    /**
     * Générer un hash final pour l'intégrité
     */
    private function generateFinalHash()
    {
        $allVotes = $this->responses()->get()->map(function($response) {
            return hash('sha256', $response->security_token);
        })->sort()->values()->toArray();

        return hash('sha256', serialize([
            'vote_id' => $this->id,
            'closed_at' => $this->closed_at,
            'all_vote_hashes' => $allVotes,
            'results' => $this->results,
        ]));
    }

    /**
     * Générer un token de sécurité pour un vote individuel
     */
    private function generateVoteSecurityToken($participantId, $voteData)
    {
        return hash('sha256', serialize([
            'vote_id' => $this->id,
            'participant_id' => $participantId,
            'vote_data' => $voteData,
            'timestamp' => now()->timestamp,
            'ip' => request()->ip(),
        ]));
    }

    /**
     * Obtenir les statistiques du vote
     */
    public function getVoteStatistics()
    {
        $eligibleVoters = $this->getEligibleVoters()->count();
        $totalResponses = $this->responses()->count();
        
        return [
            'eligible_voters' => $eligibleVoters,
            'total_responses' => $totalResponses,
            'participation_rate' => $eligibleVoters > 0 ? round(($totalResponses / $eligibleVoters) * 100, 2) : 0,
            'quorum_required' => $this->quorum_required,
            'quorum_achieved' => $totalResponses >= $this->quorum_required,
            'majority_required' => $this->majority_required,
            'is_open' => $this->isOpen(),
            'is_closed' => $this->isClosed(),
            'time_remaining' => $this->ends_at ? now()->diffInMinutes($this->ends_at, false) : null,
            'duration_minutes' => $this->started_at && $this->closed_at 
                ? $this->started_at->diffInMinutes($this->closed_at) 
                : null,
        ];
    }

    /**
     * Vérifier l'intégrité du vote
     */
    public function verifyIntegrity()
    {
        if (!$this->isClosed()) {
            return ['valid' => false, 'reason' => 'Vote non fermé'];
        }

        // Recalculer le hash final
        $calculatedHash = $this->generateFinalHash();
        $storedHash = $this->metadata['final_hash'] ?? null;

        if ($calculatedHash !== $storedHash) {
            return ['valid' => false, 'reason' => 'Hash de sécurité invalide'];
        }

        // Vérifier chaque vote individuel
        $invalidVotes = $this->responses()->get()->filter(function($response) {
            $expectedToken = $this->generateVoteSecurityToken(
                $response->participant_id,
                $this->is_secret ? Crypt::decrypt($response->vote_data) : $response->vote_data
            );
            return $expectedToken !== $response->security_token;
        });

        if ($invalidVotes->count() > 0) {
            return [
                'valid' => false, 
                'reason' => 'Votes individuels corrompus',
                'corrupted_votes' => $invalidVotes->count()
            ];
        }

        return ['valid' => true, 'verified_at' => now()];
    }

    /**
     * Enregistrer un événement de vote
     */
    private function logVoteEvent($eventType, $data = [])
    {
        DocumentChange::create([
            'document_version_id' => null,
            'user_id' => auth()->id(),
            'change_type' => $eventType,
            'description' => $this->getVoteEventDescription($eventType),
            'old_value' => null,
            'new_value' => json_encode($data),
            'field_changed' => 'vote_status',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => array_merge($data, [
                'vote_id' => $this->id,
                'session_id' => $this->session_id,
                'vote_title' => $this->title,
                'vote_type' => $this->type,
            ])
        ]);
    }

    /**
     * Obtenir la description d'un événement de vote
     */
    private function getVoteEventDescription($eventType)
    {
        $descriptions = [
            'vote_opened' => 'Vote ouvert',
            'vote_closed' => 'Vote fermé',
            'vote_cast' => 'Vote exprimé',
            'vote_cancelled' => 'Vote annulé',
        ];

        return $descriptions[$eventType] ?? $eventType;
    }

    /**
     * Notifier les votants éligibles
     */
    private function notifyEligibleVoters($eventType)
    {
        $eligibleVoters = $this->getEligibleVoters()->with('user')->get();
        
        foreach ($eligibleVoters as $participant) {
            if ($participant->user) {
                // Utiliser le système de notification existant
            }
        }
    }

    /**
     * Notifier tous les participants
     */
    private function notifyParticipants($eventType, $data = [])
    {
        $participants = $this->session->participants()->with('user')->get();
        
        foreach ($participants as $participant) {
            if ($participant->user) {
                // Utiliser le système de notification existant
            }
        }
    }

    /**
     * Créer un vote simple (Oui/Non/Abstention)
     */
    public static function createSimpleVote($sessionId, $title, $question, $options = [])
    {
        return self::create(array_merge([
            'session_id' => $sessionId,
            'title' => $title,
            'question' => $question,
            'type' => self::TYPE_SIMPLE,
            'voting_method' => self::METHOD_OPEN,
            'is_secret' => false,
            'is_anonymous' => false,
            'majority_required' => 50.0,
            'status' => self::STATUS_DRAFT,
            'created_by' => auth()->id(),
            'options' => [
                ['id' => 'oui', 'label' => 'Oui'],
                ['id' => 'non', 'label' => 'Non'],
                ['id' => 'abstention', 'label' => 'Abstention'],
            ],
        ], $options));
    }

    /**
     * Créer un vote à choix multiples
     */
    public static function createMultipleChoiceVote($sessionId, $title, $question, $choices, $options = [])
    {
        $formattedChoices = [];
        foreach ($choices as $index => $choice) {
            $formattedChoices[] = [
                'id' => is_array($choice) ? $choice['id'] : $index,
                'label' => is_array($choice) ? $choice['label'] : $choice,
            ];
        }

        return self::create(array_merge([
            'session_id' => $sessionId,
            'title' => $title,
            'question' => $question,
            'type' => self::TYPE_MULTIPLE_CHOICE,
            'voting_method' => self::METHOD_OPEN,
            'is_secret' => false,
            'is_anonymous' => false,
            'majority_required' => 50.0,
            'status' => self::STATUS_DRAFT,
            'created_by' => auth()->id(),
            'options' => $formattedChoices,
        ], $options));
    }

    // Méthodes supplémentaires pour autres types de calculs...
    private function calculateElectionResults($responses, $results) { return $results; }
    private function calculateRankingResults($responses, $results) { return $results; }
    private function calculateApprovalResults($responses, $results) { return $results; }
}