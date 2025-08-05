<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class Session extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'entity_id',
        'type',
        'title',
        'description',
        'agenda',
        'session_number',
        'financial_year',
        'scheduled_at',
        'start_time',
        'end_time',
        'timezone',
        'location',
        'meeting_link',
        'meeting_id',
        'meeting_password',
        'status',
        'is_public',
        'recording_enabled',
        'recording_url',
        'recording_duration',
        'quorum_required',
        'quorum_achieved',
        'president_id',
        'secretary_id',
        'created_by',
        'metadata',
        'legal_requirements',
        'compliance_checklist',
    ];

    protected $casts = [
        'agenda' => 'array',
        'scheduled_at' => 'datetime',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'is_public' => 'boolean',
        'recording_enabled' => 'boolean',
        'quorum_required' => 'integer',
        'quorum_achieved' => 'integer',
        'recording_duration' => 'integer',
        'metadata' => 'array',
        'legal_requirements' => 'array',
        'compliance_checklist' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Types de sessions disponibles
     */
    const SESSION_TYPES = [
        'conseil_administration' => 'Conseil d\'Administration',
        'assemblee_generale' => 'Assemblée Générale',
        'session_budgetaire' => 'Session Budgétaire',
        'comite_audit' => 'Comité d\'Audit',
        'commission_technique' => 'Commission Technique',
        'reunion_direction' => 'Réunion Direction',
    ];

    /**
     * Statuts possibles des sessions
     */
    const STATUS_SCHEDULED = 'scheduled';
    const STATUS_LIVE = 'live';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_POSTPONED = 'postponed';

    /**
     * Relation avec l'entité propriétaire
     */
    public function entity()
    {
        return $this->belongsTo(StateEntity::class, 'entity_id');
    }

    /**
     * Relation avec le président de séance
     */
    public function president()
    {
        return $this->belongsTo(User::class, 'president_id');
    }

    /**
     * Relation avec le secrétaire de séance
     */
    public function secretary()
    {
        return $this->belongsTo(User::class, 'secretary_id');
    }

    /**
     * Relation avec le créateur
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relation avec les participants
     */
    public function participants()
    {
        return $this->hasMany(SessionParticipant::class);
    }

    /**
     * Relation avec les documents de session
     */
    public function documents()
    {
        return $this->hasMany(SessionDocument::class);
    }

    /**
     * Relation avec les votes
     */
    public function votes()
    {
        return $this->hasMany(SessionVote::class);
    }

    /**
     * Relation avec les décisions
     */
    public function decisions()
    {
        return $this->hasMany(SessionDecision::class);
    }

    /**
     * Relation avec les process-verbaux
     */
    public function minutes()
    {
        return $this->hasMany(SessionMinutes::class);
    }

    /**
     * Relation avec les points d'ordre du jour
     */
    public function agendaItems()
    {
        return $this->hasMany(SessionAgendaItem::class)->orderBy('order');
    }

    /**
     * Relation avec les interventions/commentaires
     */
    public function interventions()
    {
        return $this->hasMany(SessionIntervention::class)->orderBy('created_at');
    }

    /**
     * Scope pour les sessions actives
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', [self::STATUS_SCHEDULED, self::STATUS_LIVE]);
    }

    /**
     * Scope pour les sessions par type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope pour les sessions d'une entité
     */
    public function scopeForEntity($query, $entityId)
    {
        return $query->where('entity_id', $entityId);
    }

    /**
     * Scope pour les sessions publiques
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    /**
     * Scope pour les sessions programmées dans une période
     */
    public function scopeScheduledBetween($query, $start, $end)
    {
        return $query->whereBetween('scheduled_at', [$start, $end]);
    }

    /**
     * Vérifier si la session est en cours
     */
    public function isLive()
    {
        return $this->status === self::STATUS_LIVE;
    }

    /**
     * Vérifier si la session est terminée
     */
    public function isCompleted()
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Vérifier si la session peut démarrer
     */
    public function canStart()
    {
        return $this->status === self::STATUS_SCHEDULED 
               && $this->scheduled_at <= now()
               && $this->hasQuorum();
    }

    /**
     * Vérifier si le quorum est atteint
     */
    public function hasQuorum()
    {
        $presentParticipants = $this->participants()
                                   ->where('status', 'present')
                                   ->where('has_voting_rights', true)
                                   ->count();
        
        return $presentParticipants >= $this->quorum_required;
    }

    /**
     * Démarrer la session
     */
    public function start()
    {
        if (!$this->canStart()) {
            throw new \Exception('Impossible de démarrer la session. Vérifiez le quorum et l\'heure programmée.');
        }

        $this->update([
            'status' => self::STATUS_LIVE,
            'start_time' => now(),
        ]);

        // Enregistrer l'événement
        $this->logSessionEvent('session_started', [
            'quorum_achieved' => $this->participants()->where('status', 'present')->count(),
            'started_by' => auth()->id(),
        ]);

        // Notifier les participants
        $this->notifyParticipants('session_started');

        return $this;
    }

    /**
     * Terminer la session
     */
    public function complete()
    {
        if (!$this->isLive()) {
            throw new \Exception('Seule une session en cours peut être terminée.');
        }

        $this->update([
            'status' => self::STATUS_COMPLETED,
            'end_time' => now(),
        ]);

        // Calculer la durée d'enregistrement si applicable
        if ($this->recording_enabled && $this->start_time) {
            $this->update([
                'recording_duration' => $this->start_time->diffInMinutes(now())
            ]);
        }

        // Générer automatiquement le procès-verbal
        $this->generateMinutes();

        // Enregistrer l'événement
        $this->logSessionEvent('session_completed', [
            'duration_minutes' => $this->start_time ? $this->start_time->diffInMinutes(now()) : 0,
            'completed_by' => auth()->id(),
        ]);

        // Notifier les participants
        $this->notifyParticipants('session_completed');

        return $this;
    }

    /**
     * Annuler la session
     */
    public function cancel($reason = null)
    {
        if ($this->isCompleted()) {
            throw new \Exception('Impossible d\'annuler une session terminée.');
        }

        $this->update([
            'status' => self::STATUS_CANCELLED,
            'metadata' => array_merge($this->metadata ?? [], [
                'cancellation_reason' => $reason,
                'cancelled_at' => now()->toISOString(),
                'cancelled_by' => auth()->id(),
            ])
        ]);

        // Enregistrer l'événement
        $this->logSessionEvent('session_cancelled', [
            'reason' => $reason,
            'cancelled_by' => auth()->id(),
        ]);

        // Notifier les participants
        $this->notifyParticipants('session_cancelled', ['reason' => $reason]);

        return $this;
    }

    /**
     * Reporter la session
     */
    public function postpone($newDate, $reason = null)
    {
        if ($this->isLive() || $this->isCompleted()) {
            throw new \Exception('Impossible de reporter une session en cours ou terminée.');
        }

        $oldDate = $this->scheduled_at;

        $this->update([
            'status' => self::STATUS_POSTPONED,
            'scheduled_at' => Carbon::parse($newDate),
            'metadata' => array_merge($this->metadata ?? [], [
                'postponement_reason' => $reason,
                'original_date' => $oldDate->toISOString(),
                'postponed_at' => now()->toISOString(),
                'postponed_by' => auth()->id(),
            ])
        ]);

        // Enregistrer l'événement
        $this->logSessionEvent('session_postponed', [
            'old_date' => $oldDate,
            'new_date' => $newDate,
            'reason' => $reason,
            'postponed_by' => auth()->id(),
        ]);

        // Notifier les participants
        $this->notifyParticipants('session_postponed', [
            'old_date' => $oldDate->format('d/m/Y H:i'),
            'new_date' => Carbon::parse($newDate)->format('d/m/Y H:i'),
            'reason' => $reason
        ]);

        return $this;
    }

    /**
     * Ajouter un participant
     */
    public function addParticipant($userId, $role = 'member', $hasVotingRights = true)
    {
        return $this->participants()->create([
            'user_id' => $userId,
            'role' => $role,
            'has_voting_rights' => $hasVotingRights,
            'status' => 'invited',
            'invited_at' => now(),
            'invited_by' => auth()->id(),
        ]);
    }

    /**
     * Obtenir le statut de conformité légale
     */
    public function getLegalComplianceStatus()
    {
        $requirements = $this->legal_requirements ?? [];
        $checklist = $this->compliance_checklist ?? [];

        $totalRequirements = count($requirements);
        $completedRequirements = count(array_filter($checklist, fn($item) => $item['completed'] ?? false));

        return [
            'total_requirements' => $totalRequirements,
            'completed_requirements' => $completedRequirements,
            'compliance_rate' => $totalRequirements > 0 ? round(($completedRequirements / $totalRequirements) * 100, 2) : 100,
            'is_compliant' => $completedRequirements >= $totalRequirements,
            'missing_requirements' => array_filter($requirements, function($req, $index) use ($checklist) {
                return !($checklist[$index]['completed'] ?? false);
            }, ARRAY_FILTER_USE_BOTH)
        ];
    }

    /**
     * Obtenir les statistiques de participation
     */
    public function getParticipationStats()
    {
        $totalInvited = $this->participants()->count();
        $totalPresent = $this->participants()->where('status', 'present')->count();
        $totalAbsent = $this->participants()->where('status', 'absent')->count();
        $totalWithVotingRights = $this->participants()->where('has_voting_rights', true)->count();
        $presentWithVotingRights = $this->participants()
                                       ->where('status', 'present')
                                       ->where('has_voting_rights', true)
                                       ->count();

        return [
            'total_invited' => $totalInvited,
            'total_present' => $totalPresent,
            'total_absent' => $totalAbsent,
            'attendance_rate' => $totalInvited > 0 ? round(($totalPresent / $totalInvited) * 100, 2) : 0,
            'total_voting_rights' => $totalWithVotingRights,
            'present_voting_rights' => $presentWithVotingRights,
            'quorum_required' => $this->quorum_required,
            'quorum_achieved' => $presentWithVotingRights >= $this->quorum_required,
            'quorum_percentage' => $this->quorum_required > 0 ? round(($presentWithVotingRights / $this->quorum_required) * 100, 2) : 0,
        ];
    }

    /**
     * Obtenir les métriques de la session
     */
    public function getSessionMetrics()
    {
        $duration = $this->start_time && $this->end_time 
                   ? $this->start_time->diffInMinutes($this->end_time) 
                   : 0;

        return [
            'duration_minutes' => $duration,
            'agenda_items_count' => $this->agendaItems()->count(),
            'agenda_items_completed' => $this->agendaItems()->where('status', 'completed')->count(),
            'votes_count' => $this->votes()->count(),
            'decisions_count' => $this->decisions()->count(),
            'documents_count' => $this->documents()->count(),
            'interventions_count' => $this->interventions()->count(),
            'participation_stats' => $this->getParticipationStats(),
            'compliance_status' => $this->getLegalComplianceStatus(),
        ];
    }

    /**
     * Enregistrer un événement de session
     */
    private function logSessionEvent($eventType, $data = [])
    {
        // Utiliser le système d'audit trail existant
        DocumentChange::create([
            'document_version_id' => null, // Pas lié à un document spécifique
            'user_id' => auth()->id(),
            'change_type' => $eventType,
            'description' => $this->getEventDescription($eventType),
            'old_value' => null,
            'new_value' => json_encode($data),
            'field_changed' => 'session_status',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => array_merge($data, [
                'session_id' => $this->id,
                'session_type' => $this->type,
                'entity_id' => $this->entity_id,
            ])
        ]);
    }

    /**
     * Obtenir la description d'un événement
     */
    private function getEventDescription($eventType)
    {
        $descriptions = [
            'session_started' => 'Session démarrée',
            'session_completed' => 'Session terminée',
            'session_cancelled' => 'Session annulée',
            'session_postponed' => 'Session reportée',
            'participant_joined' => 'Participant rejoint',
            'participant_left' => 'Participant quitté',
            'vote_opened' => 'Vote ouvert',
            'vote_closed' => 'Vote fermé',
            'decision_made' => 'Décision prise',
        ];

        return $descriptions[$eventType] ?? $eventType;
    }

    /**
     * Notifier les participants
     */
    private function notifyParticipants($eventType, $data = [])
    {
        // Utiliser le service de notification existant
        $participants = $this->participants()->with('user')->get();
        
        foreach ($participants as $participant) {
            if ($participant->user) {
                // Créer une notification pour chaque participant
                // (Utiliser le système de notification existant)
            }
        }
    }

    /**
     * Générer automatiquement le procès-verbal
     */
    private function generateMinutes()
    {
        // Utiliser le service de template existant pour générer le PV
        return SessionMinutes::generateForSession($this);
    }

    /**
     * Obtenir la liste des exigences légales selon le type de session
     */
    public static function getLegalRequirementsForType($sessionType, $entityType = null)
    {
        $requirements = [
            'conseil_administration' => [
                'Convocation envoyée 8 jours avant la session',
                'Quorum d\'au moins 50% des membres',
                'Ordre du jour communiqué avec la convocation',
                'Procès-verbal de la session précédente approuvé',
                'Présence du secrétaire de séance',
                'Documents financiers à disposition',
            ],
            'assemblee_generale' => [
                'Convocation envoyée 15 jours avant l\'assemblée',
                'Quorum d\'au moins 66% des actionnaires',
                'Publication de l\'avis dans un journal officiel',
                'États financiers certifiés disponibles',
                'Rapport d\'activités présenté',
                'Rapport des commissaires aux comptes',
                'Quitus de gestion du conseil d\'administration',
            ],
            'session_budgetaire' => [
                'Budget prévisionnel préparé',
                'Analyse des écarts exercice précédent',
                'Projections financières validées',
                'Conformité aux directives UEMOA',
                'Approbation des investissements majeurs',
            ],
        ];

        return $requirements[$sessionType] ?? [];
    }

    /**
     * Créer une session avec configuration par défaut selon le type
     */
    public static function createWithDefaults($entityId, $type, $data = [])
    {
        $defaults = [
            'conseil_administration' => [
                'quorum_required' => 3, // 50% d'un CA typique de 6 membres
                'is_public' => false,
                'recording_enabled' => true,
                'legal_requirements' => self::getLegalRequirementsForType('conseil_administration'),
            ],
            'assemblee_generale' => [
                'quorum_required' => 5, // Selon statuts de l'EPE
                'is_public' => true,
                'recording_enabled' => true,
                'legal_requirements' => self::getLegalRequirementsForType('assemblee_generale'),
            ],
            'session_budgetaire' => [
                'quorum_required' => 4,
                'is_public' => false,
                'recording_enabled' => true,
                'legal_requirements' => self::getLegalRequirementsForType('session_budgetaire'),
            ],
        ];

        $sessionData = array_merge(
            $defaults[$type] ?? [],
            $data,
            [
                'entity_id' => $entityId,
                'type' => $type,
                'status' => self::STATUS_SCHEDULED,
                'created_by' => auth()->id(),
            ]
        );

        return self::create($sessionData);
    }
}