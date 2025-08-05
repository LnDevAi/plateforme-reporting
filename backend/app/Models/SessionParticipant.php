<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SessionParticipant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'session_id',
        'user_id',
        'role',
        'has_voting_rights',
        'status',
        'joined_at',
        'left_at',
        'connection_time',
        'invited_at',
        'invited_by',
        'response_status',
        'response_at',
        'delegate_user_id',
        'proxy_document',
        'attendance_note',
        'metadata',
    ];

    protected $casts = [
        'has_voting_rights' => 'boolean',
        'joined_at' => 'datetime',
        'left_at' => 'datetime',
        'invited_at' => 'datetime',
        'response_at' => 'datetime',
        'connection_time' => 'integer', // en minutes
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Rôles des participants
     */
    const ROLES = [
        'president' => 'Président de Séance',
        'secretary' => 'Secrétaire de Séance',
        'member' => 'Membre',
        'observer' => 'Observateur',
        'guest' => 'Invité',
        'expert' => 'Expert',
        'auditor' => 'Auditeur',
    ];

    /**
     * Statuts de participation
     */
    const STATUS_INVITED = 'invited';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_DECLINED = 'declined';
    const STATUS_PRESENT = 'present';
    const STATUS_ABSENT = 'absent';
    const STATUS_LEFT_EARLY = 'left_early';

    /**
     * Statuts de réponse à l'invitation
     */
    const RESPONSE_PENDING = 'pending';
    const RESPONSE_ACCEPTED = 'accepted';
    const RESPONSE_DECLINED = 'declined';
    const RESPONSE_TENTATIVE = 'tentative';

    /**
     * Relation avec la session
     */
    public function session()
    {
        return $this->belongsTo(Session::class);
    }

    /**
     * Relation avec l'utilisateur participant
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec l'utilisateur qui a invité
     */
    public function inviter()
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /**
     * Relation avec le délégué (en cas de procuration)
     */
    public function delegate()
    {
        return $this->belongsTo(User::class, 'delegate_user_id');
    }

    /**
     * Relation avec les votes du participant
     */
    public function votes()
    {
        return $this->hasMany(SessionVoteResponse::class, 'participant_id');
    }

    /**
     * Relation avec les interventions du participant
     */
    public function interventions()
    {
        return $this->hasMany(SessionIntervention::class, 'participant_id');
    }

    /**
     * Scope pour les participants présents
     */
    public function scopePresent($query)
    {
        return $query->where('status', self::STATUS_PRESENT);
    }

    /**
     * Scope pour les participants avec droit de vote
     */
    public function scopeWithVotingRights($query)
    {
        return $query->where('has_voting_rights', true);
    }

    /**
     * Scope pour les participants confirmés
     */
    public function scopeConfirmed($query)
    {
        return $query->where('response_status', self::RESPONSE_ACCEPTED);
    }

    /**
     * Scope par rôle
     */
    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Marquer le participant comme présent
     */
    public function markAsPresent()
    {
        $this->update([
            'status' => self::STATUS_PRESENT,
            'joined_at' => now(),
        ]);

        // Enregistrer l'événement
        $this->logParticipantEvent('participant_joined');

        return $this;
    }

    /**
     * Marquer le participant comme absent
     */
    public function markAsAbsent($note = null)
    {
        $this->update([
            'status' => self::STATUS_ABSENT,
            'attendance_note' => $note,
        ]);

        // Enregistrer l'événement
        $this->logParticipantEvent('participant_absent', ['note' => $note]);

        return $this;
    }

    /**
     * Marquer la sortie du participant
     */
    public function markAsLeft($note = null)
    {
        if (!$this->joined_at) {
            throw new \Exception('Le participant n\'était pas présent.');
        }

        $connectionDuration = $this->joined_at->diffInMinutes(now());

        $this->update([
            'status' => self::STATUS_LEFT_EARLY,
            'left_at' => now(),
            'connection_time' => $connectionDuration,
            'attendance_note' => $note,
        ]);

        // Enregistrer l'événement
        $this->logParticipantEvent('participant_left', [
            'duration_minutes' => $connectionDuration,
            'note' => $note
        ]);

        return $this;
    }

    /**
     * Répondre à l'invitation
     */
    public function respondToInvitation($response, $note = null)
    {
        if (!in_array($response, [
            self::RESPONSE_ACCEPTED, 
            self::RESPONSE_DECLINED, 
            self::RESPONSE_TENTATIVE
        ])) {
            throw new \Exception('Réponse d\'invitation invalide.');
        }

        $this->update([
            'response_status' => $response,
            'response_at' => now(),
            'attendance_note' => $note,
        ]);

        // Mettre à jour le statut selon la réponse
        $newStatus = match($response) {
            self::RESPONSE_ACCEPTED => self::STATUS_CONFIRMED,
            self::RESPONSE_DECLINED => self::STATUS_DECLINED,
            self::RESPONSE_TENTATIVE => self::STATUS_INVITED,
            default => $this->status,
        };

        if ($newStatus !== $this->status) {
            $this->update(['status' => $newStatus]);
        }

        // Enregistrer l'événement
        $this->logParticipantEvent('invitation_response', [
            'response' => $response,
            'note' => $note
        ]);

        return $this;
    }

    /**
     * Déléguer les droits de vote
     */
    public function delegateVotingRights($delegateUserId, $proxyDocument = null)
    {
        if (!$this->has_voting_rights) {
            throw new \Exception('Ce participant n\'a pas de droits de vote à déléguer.');
        }

        // Vérifier que le délégué est également participant
        $delegateParticipant = $this->session->participants()
                                   ->where('user_id', $delegateUserId)
                                   ->first();

        if (!$delegateParticipant) {
            throw new \Exception('Le délégué doit également être participant à la session.');
        }

        $this->update([
            'delegate_user_id' => $delegateUserId,
            'proxy_document' => $proxyDocument,
            'metadata' => array_merge($this->metadata ?? [], [
                'delegation_created_at' => now()->toISOString(),
                'delegation_created_by' => auth()->id(),
            ])
        ]);

        // Enregistrer l'événement
        $this->logParticipantEvent('voting_rights_delegated', [
            'delegate_user_id' => $delegateUserId,
            'delegate_name' => $delegateParticipant->user->name,
        ]);

        return $this;
    }

    /**
     * Révoquer la délégation
     */
    public function revokeDelegation()
    {
        if (!$this->delegate_user_id) {
            throw new \Exception('Aucune délégation active à révoquer.');
        }

        $delegateName = $this->delegate?->name;

        $this->update([
            'delegate_user_id' => null,
            'proxy_document' => null,
            'metadata' => array_merge($this->metadata ?? [], [
                'delegation_revoked_at' => now()->toISOString(),
                'delegation_revoked_by' => auth()->id(),
            ])
        ]);

        // Enregistrer l'événement
        $this->logParticipantEvent('voting_rights_revoked', [
            'previous_delegate' => $delegateName,
        ]);

        return $this;
    }

    /**
     * Vérifier si le participant peut voter
     */
    public function canVote()
    {
        return $this->has_voting_rights 
               && $this->status === self::STATUS_PRESENT
               && !$this->delegate_user_id; // Pas de délégation active
    }

    /**
     * Obtenir les droits de vote effectifs (y compris délégations reçues)
     */
    public function getEffectiveVotingRights()
    {
        $rights = [];

        // Droits propres
        if ($this->canVote()) {
            $rights[] = [
                'type' => 'own',
                'participant_id' => $this->id,
                'user_name' => $this->user->name,
                'role' => $this->role,
            ];
        }

        // Droits délégués reçus
        $delegatedRights = $this->session->participants()
                               ->where('delegate_user_id', $this->user_id)
                               ->where('status', '!=', self::STATUS_ABSENT)
                               ->with('user')
                               ->get();

        foreach ($delegatedRights as $delegation) {
            if ($delegation->has_voting_rights) {
                $rights[] = [
                    'type' => 'delegated',
                    'participant_id' => $delegation->id,
                    'user_name' => $delegation->user->name,
                    'role' => $delegation->role,
                    'proxy_document' => $delegation->proxy_document,
                ];
            }
        }

        return $rights;
    }

    /**
     * Obtenir les statistiques de participation
     */
    public function getParticipationStats()
    {
        $totalMinutes = 0;
        
        if ($this->joined_at) {
            $endTime = $this->left_at ?? ($this->session->end_time ?? now());
            $totalMinutes = $this->joined_at->diffInMinutes($endTime);
        }

        $sessionDuration = 0;
        if ($this->session->start_time && $this->session->end_time) {
            $sessionDuration = $this->session->start_time->diffInMinutes($this->session->end_time);
        }

        return [
            'attendance_status' => $this->status,
            'response_status' => $this->response_status,
            'connection_time_minutes' => $totalMinutes,
            'attendance_rate' => $sessionDuration > 0 ? round(($totalMinutes / $sessionDuration) * 100, 2) : 0,
            'joined_at' => $this->joined_at,
            'left_at' => $this->left_at,
            'has_voting_rights' => $this->has_voting_rights,
            'is_delegated' => !is_null($this->delegate_user_id),
            'delegate_name' => $this->delegate?->name,
            'votes_cast' => $this->votes()->count(),
            'interventions_count' => $this->interventions()->count(),
        ];
    }

    /**
     * Enregistrer un événement de participant
     */
    private function logParticipantEvent($eventType, $data = [])
    {
        DocumentChange::create([
            'document_version_id' => null,
            'user_id' => $this->user_id,
            'change_type' => $eventType,
            'description' => $this->getEventDescription($eventType),
            'old_value' => null,
            'new_value' => json_encode($data),
            'field_changed' => 'participant_status',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => array_merge($data, [
                'session_id' => $this->session_id,
                'participant_id' => $this->id,
                'user_name' => $this->user->name,
                'role' => $this->role,
            ])
        ]);
    }

    /**
     * Obtenir la description d'un événement de participant
     */
    private function getEventDescription($eventType)
    {
        $descriptions = [
            'participant_joined' => 'Participant rejoint la session',
            'participant_left' => 'Participant quitté la session',
            'participant_absent' => 'Participant marqué absent',
            'invitation_response' => 'Réponse à l\'invitation',
            'voting_rights_delegated' => 'Droits de vote délégués',
            'voting_rights_revoked' => 'Délégation révoquée',
        ];

        return $descriptions[$eventType] ?? $eventType;
    }

    /**
     * Envoyer une invitation par email
     */
    public function sendInvitation()
    {
        // Utiliser le service de notification existant
        // pour envoyer l'invitation par email
        
        return $this;
    }

    /**
     * Envoyer un rappel
     */
    public function sendReminder()
    {
        if ($this->response_status !== self::RESPONSE_PENDING) {
            return $this; // Pas besoin de rappel si déjà répondu
        }

        // Logique d'envoi de rappel
        
        return $this;
    }

    /**
     * Obtenir le résumé de participation pour le procès-verbal
     */
    public function getMinutesSummary()
    {
        $summary = [
            'name' => $this->user->name,
            'role' => self::ROLES[$this->role] ?? $this->role,
            'status' => $this->getStatusLabel(),
            'voting_rights' => $this->has_voting_rights,
        ];

        if ($this->delegate_user_id) {
            $summary['delegate'] = $this->delegate->name;
            $summary['proxy_note'] = 'Droits délégués à ' . $this->delegate->name;
        }

        if ($this->attendance_note) {
            $summary['note'] = $this->attendance_note;
        }

        return $summary;
    }

    /**
     * Obtenir le libellé du statut
     */
    public function getStatusLabel()
    {
        $labels = [
            self::STATUS_INVITED => 'Invité',
            self::STATUS_CONFIRMED => 'Confirmé',
            self::STATUS_DECLINED => 'Décliné',
            self::STATUS_PRESENT => 'Présent',
            self::STATUS_ABSENT => 'Absent',
            self::STATUS_LEFT_EARLY => 'Parti avant la fin',
        ];

        return $labels[$this->status] ?? $this->status;
    }
}