<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DocumentComment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'document_version_id',
        'user_id',
        'parent_id',
        'content',
        'selection_start',
        'selection_end',
        'selection_text',
        'comment_type',
        'priority',
        'is_resolved',
        'resolved_by',
        'resolved_at',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'is_resolved' => 'boolean',
        'resolved_at' => 'datetime',
        'selection_start' => 'integer',
        'selection_end' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
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
     * Relation avec le commentaire parent
     */
    public function parent()
    {
        return $this->belongsTo(DocumentComment::class, 'parent_id');
    }

    /**
     * Relation avec les réponses
     */
    public function replies()
    {
        return $this->hasMany(DocumentComment::class, 'parent_id');
    }

    /**
     * Relation avec l'utilisateur qui a résolu
     */
    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    /**
     * Scope pour les commentaires non résolus
     */
    public function scopeUnresolved($query)
    {
        return $query->where('is_resolved', false);
    }

    /**
     * Scope pour les commentaires principaux (pas de réponses)
     */
    public function scopeMain($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Scope par type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('comment_type', $type);
    }

    /**
     * Scope par priorité
     */
    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    /**
     * Marquer comme résolu
     */
    public function resolve($userId, $note = null)
    {
        $this->update([
            'is_resolved' => true,
            'resolved_by' => $userId,
            'resolved_at' => now(),
            'metadata' => array_merge($this->metadata ?? [], [
                'resolution_note' => $note
            ])
        ]);
    }

    /**
     * Rouvrir le commentaire
     */
    public function reopen()
    {
        $this->update([
            'is_resolved' => false,
            'resolved_by' => null,
            'resolved_at' => null,
        ]);
    }

    /**
     * Obtenir le thread complet
     */
    public function getThreadAttribute()
    {
        return static::where('parent_id', $this->id)
                    ->orWhere('id', $this->id)
                    ->with('user')
                    ->orderBy('created_at')
                    ->get();
    }
}