<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentChange extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_version_id',
        'user_id',
        'change_type',
        'description',
        'old_value',
        'new_value',
        'field_changed',
        'change_size',
        'ip_address',
        'user_agent',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'change_size' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relation avec la version du document
     */
    public function documentVersion()
    {
        return $this->belongsTo(DocumentVersion::class);
    }

    /**
     * Relation avec l'utilisateur
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope par type de changement
     */
    public function scopeByType($query, $type)
    {
        return $query->where('change_type', $type);
    }

    /**
     * Scope pour les changements de contenu
     */
    public function scopeContentChanges($query)
    {
        return $query->whereIn('change_type', ['content_updated', 'content_added', 'content_deleted']);
    }

    /**
     * Scope pour les changements de statut
     */
    public function scopeStatusChanges($query)
    {
        return $query->whereIn('change_type', ['approved', 'rejected', 'submitted_for_approval', 'draft_created']);
    }

    /**
     * Scope pour les changements de collaboration
     */
    public function scopeCollaborationChanges($query)
    {
        return $query->whereIn('change_type', ['collaborator_added', 'collaborator_removed', 'permission_changed']);
    }

    /**
     * Obtenir la description formatée du changement
     */
    public function getFormattedDescriptionAttribute()
    {
        $descriptions = [
            'content_updated' => 'Contenu modifié',
            'content_added' => 'Contenu ajouté',
            'content_deleted' => 'Contenu supprimé',
            'approved' => 'Document approuvé',
            'rejected' => 'Document rejeté',
            'submitted_for_approval' => 'Soumis pour approbation',
            'version_created' => 'Nouvelle version créée',
            'collaborator_added' => 'Collaborateur ajouté',
            'collaborator_removed' => 'Collaborateur supprimé',
            'permission_changed' => 'Permissions modifiées',
            'locked' => 'Document verrouillé',
            'unlocked' => 'Document déverrouillé',
            'comment_added' => 'Commentaire ajouté',
            'comment_resolved' => 'Commentaire résolu',
        ];

        return $descriptions[$this->change_type] ?? $this->description;
    }

    /**
     * Obtenir l'icône du changement
     */
    public function getChangeIconAttribute()
    {
        $icons = [
            'content_updated' => 'edit',
            'content_added' => 'plus',
            'content_deleted' => 'minus',
            'approved' => 'check-circle',
            'rejected' => 'times-circle',
            'submitted_for_approval' => 'arrow-up',
            'version_created' => 'code-branch',
            'collaborator_added' => 'user-plus',
            'collaborator_removed' => 'user-minus',
            'permission_changed' => 'key',
            'locked' => 'lock',
            'unlocked' => 'unlock',
            'comment_added' => 'comment',
            'comment_resolved' => 'comment-check',
        ];

        return $icons[$this->change_type] ?? 'info';
    }

    /**
     * Obtenir la couleur du changement
     */
    public function getChangeColorAttribute()
    {
        $colors = [
            'content_updated' => 'blue',
            'content_added' => 'green',
            'content_deleted' => 'red',
            'approved' => 'green',
            'rejected' => 'red',
            'submitted_for_approval' => 'orange',
            'version_created' => 'purple',
            'collaborator_added' => 'blue',
            'collaborator_removed' => 'red',
            'permission_changed' => 'orange',
            'locked' => 'red',
            'unlocked' => 'green',
            'comment_added' => 'blue',
            'comment_resolved' => 'green',
        ];

        return $colors[$this->change_type] ?? 'gray';
    }

    /**
     * Créer un changement de contenu
     */
    public static function createContentChange($documentVersionId, $userId, $oldContent, $newContent, $description = null)
    {
        $changeSize = strlen($newContent) - strlen($oldContent);
        
        return static::create([
            'document_version_id' => $documentVersionId,
            'user_id' => $userId,
            'change_type' => 'content_updated',
            'description' => $description ?? 'Contenu du document modifié',
            'old_value' => $oldContent,
            'new_value' => $newContent,
            'field_changed' => 'content',
            'change_size' => $changeSize,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Créer un changement de statut
     */
    public static function createStatusChange($documentVersionId, $userId, $oldStatus, $newStatus, $description = null)
    {
        return static::create([
            'document_version_id' => $documentVersionId,
            'user_id' => $userId,
            'change_type' => $newStatus,
            'description' => $description ?? "Statut changé de $oldStatus à $newStatus",
            'old_value' => $oldStatus,
            'new_value' => $newStatus,
            'field_changed' => 'status',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Créer un changement de collaboration
     */
    public static function createCollaborationChange($documentVersionId, $userId, $type, $description, $metadata = [])
    {
        return static::create([
            'document_version_id' => $documentVersionId,
            'user_id' => $userId,
            'change_type' => $type,
            'description' => $description,
            'field_changed' => 'collaboration',
            'metadata' => $metadata,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}