<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DocumentVersion extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'report_id',
        'version_number',
        'title',
        'description',
        'content',
        'content_type',
        'status',
        'file_path',
        'file_size',
        'checksum',
        'created_by',
        'updated_by',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'is_current',
        'lock_user_id',
        'locked_at',
        'lock_expires_at',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'approved_at' => 'datetime',
        'locked_at' => 'datetime',
        'lock_expires_at' => 'datetime',
        'is_current' => 'boolean',
        'file_size' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Relation avec le rapport
     */
    public function report()
    {
        return $this->belongsTo(Report::class);
    }

    /**
     * Relation avec l'utilisateur créateur
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relation avec l'utilisateur modificateur
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Relation avec l'utilisateur approbateur
     */
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Relation avec l'utilisateur qui verrouille
     */
    public function lockUser()
    {
        return $this->belongsTo(User::class, 'lock_user_id');
    }

    /**
     * Relation avec les commentaires
     */
    public function comments()
    {
        return $this->hasMany(DocumentComment::class);
    }

    /**
     * Relation avec les changements
     */
    public function changes()
    {
        return $this->hasMany(DocumentChange::class);
    }

    /**
     * Relation avec les collaborateurs
     */
    public function collaborators()
    {
        return $this->belongsToMany(User::class, 'document_collaborators')
                    ->withPivot(['permission_level', 'invited_by', 'invited_at'])
                    ->withTimestamps();
    }

    /**
     * Scope pour la version actuelle
     */
    public function scopeCurrent($query)
    {
        return $query->where('is_current', true);
    }

    /**
     * Scope par statut
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope pour les documents verrouillés
     */
    public function scopeLocked($query)
    {
        return $query->whereNotNull('lock_user_id')
                    ->where('lock_expires_at', '>', now());
    }

    /**
     * Scope pour les documents approuvés
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved')
                    ->whereNotNull('approved_by');
    }

    /**
     * Vérifier si le document est verrouillé
     */
    public function isLocked()
    {
        return $this->lock_user_id && $this->lock_expires_at && $this->lock_expires_at > now();
    }

    /**
     * Vérifier si l'utilisateur peut modifier
     */
    public function canEdit($userId)
    {
        // Si le document est verrouillé par quelqu'un d'autre
        if ($this->isLocked() && $this->lock_user_id !== $userId) {
            return false;
        }

        // Si le document est approuvé, seuls les admins peuvent le modifier
        if ($this->status === 'approved' && !$this->userIsAdmin($userId)) {
            return false;
        }

        // Vérifier les permissions de collaboration
        return $this->hasEditPermission($userId);
    }

    /**
     * Vérifier les permissions d'édition
     */
    public function hasEditPermission($userId)
    {
        // Le créateur peut toujours éditer
        if ($this->created_by === $userId) {
            return true;
        }

        // Vérifier les collaborateurs
        $collaborator = $this->collaborators()->where('user_id', $userId)->first();
        if ($collaborator) {
            return in_array($collaborator->pivot->permission_level, ['edit', 'admin']);
        }

        return false;
    }

    /**
     * Verrouiller le document
     */
    public function lock($userId, $duration = 30)
    {
        $this->update([
            'lock_user_id' => $userId,
            'locked_at' => now(),
            'lock_expires_at' => now()->addMinutes($duration),
        ]);
    }

    /**
     * Déverrouiller le document
     */
    public function unlock()
    {
        $this->update([
            'lock_user_id' => null,
            'locked_at' => null,
            'lock_expires_at' => null,
        ]);
    }

    /**
     * Créer une nouvelle version
     */
    public function createNewVersion($data, $userId)
    {
        // Marquer la version actuelle comme non-actuelle
        $this->update(['is_current' => false]);

        // Créer la nouvelle version
        $newVersion = static::create([
            'report_id' => $this->report_id,
            'version_number' => $this->getNextVersionNumber(),
            'title' => $data['title'] ?? $this->title,
            'description' => $data['description'] ?? '',
            'content' => $data['content'],
            'content_type' => $data['content_type'] ?? $this->content_type,
            'status' => 'draft',
            'created_by' => $userId,
            'updated_by' => $userId,
            'is_current' => true,
            'metadata' => array_merge($this->metadata ?? [], $data['metadata'] ?? []),
        ]);

        // Enregistrer le changement
        $newVersion->changes()->create([
            'user_id' => $userId,
            'change_type' => 'version_created',
            'description' => 'Nouvelle version créée',
            'old_value' => $this->version_number,
            'new_value' => $newVersion->version_number,
        ]);

        return $newVersion;
    }

    /**
     * Obtenir le prochain numéro de version
     */
    protected function getNextVersionNumber()
    {
        $lastVersion = static::where('report_id', $this->report_id)
                            ->orderBy('version_number', 'desc')
                            ->first();

        if (!$lastVersion) {
            return '1.0';
        }

        $parts = explode('.', $lastVersion->version_number);
        $major = intval($parts[0]);
        $minor = intval($parts[1] ?? 0);

        // Si c'est un changement majeur (approuvé → draft), incrémenter major
        if ($this->status === 'approved') {
            return ($major + 1) . '.0';
        }

        // Sinon, incrémenter minor
        return $major . '.' . ($minor + 1);
    }

    /**
     * Approuver le document
     */
    public function approve($userId, $comment = null)
    {
        $this->update([
            'status' => 'approved',
            'approved_by' => $userId,
            'approved_at' => now(),
        ]);

        // Enregistrer le changement
        $this->changes()->create([
            'user_id' => $userId,
            'change_type' => 'approved',
            'description' => 'Document approuvé' . ($comment ? ": $comment" : ''),
            'old_value' => 'pending_approval',
            'new_value' => 'approved',
        ]);

        // Déverrouiller si nécessaire
        if ($this->isLocked()) {
            $this->unlock();
        }
    }

    /**
     * Rejeter le document
     */
    public function reject($userId, $reason)
    {
        $this->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
            'updated_by' => $userId,
        ]);

        // Enregistrer le changement
        $this->changes()->create([
            'user_id' => $userId,
            'change_type' => 'rejected',
            'description' => "Document rejeté: $reason",
            'old_value' => $this->getOriginal('status'),
            'new_value' => 'rejected',
        ]);
    }

    /**
     * Soumettre pour approbation
     */
    public function submitForApproval($userId)
    {
        $this->update([
            'status' => 'pending_approval',
            'updated_by' => $userId,
        ]);

        // Enregistrer le changement
        $this->changes()->create([
            'user_id' => $userId,
            'change_type' => 'submitted_for_approval',
            'description' => 'Document soumis pour approbation',
            'old_value' => 'draft',
            'new_value' => 'pending_approval',
        ]);
    }

    /**
     * Obtenir l'historique des changements
     */
    public function getChangeHistory()
    {
        return $this->changes()
                    ->with('user')
                    ->orderBy('created_at', 'desc')
                    ->get();
    }

    /**
     * Vérifier si l'utilisateur est admin
     */
    protected function userIsAdmin($userId)
    {
        $user = User::find($userId);
        return $user && $user->isAdmin();
    }

    /**
     * Obtenir les métriques de collaboration
     */
    public function getCollaborationMetrics()
    {
        return [
            'total_collaborators' => $this->collaborators()->count(),
            'total_comments' => $this->comments()->count(),
            'total_changes' => $this->changes()->count(),
            'last_modified' => $this->updated_at,
            'lock_status' => $this->isLocked() ? 'locked' : 'unlocked',
            'approval_status' => $this->status,
        ];
    }
}