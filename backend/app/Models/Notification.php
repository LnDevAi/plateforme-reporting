<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'data',
        'read_at',
        'email_sent_at',
        'priority',
        'related_type',
        'related_id',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
        'email_sent_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relation avec l'utilisateur
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation polymorphe avec l'entité liée
     */
    public function related()
    {
        return $this->morphTo();
    }

    /**
     * Scope pour les notifications non lues
     */
    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    /**
     * Scope pour les notifications par priorité
     */
    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    /**
     * Scope pour les notifications par type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Marquer comme lue
     */
    public function markAsRead()
    {
        $this->update(['read_at' => now()]);
    }

    /**
     * Marquer comme envoyée par email
     */
    public function markAsEmailSent()
    {
        $this->update(['email_sent_at' => now()]);
    }

    /**
     * Vérifier si la notification est lue
     */
    public function isRead()
    {
        return !is_null($this->read_at);
    }

    /**
     * Vérifier si l'email a été envoyé
     */
    public function isEmailSent()
    {
        return !is_null($this->email_sent_at);
    }
}