<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportExecution extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_id',
        'executed_by',
        'status',
        'parameters_used',
        'execution_time',
        'records_count',
        'file_path',
        'file_type',
        'error_message',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'parameters_used' => 'array',
        'execution_time' => 'decimal:2',
        'records_count' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relation avec le rapport
     */
    public function report()
    {
        return $this->belongsTo(Report::class);
    }

    /**
     * Relation avec l'utilisateur qui a exécuté le rapport
     */
    public function executor()
    {
        return $this->belongsTo(User::class, 'executed_by');
    }

    /**
     * Scope pour les exécutions réussies
     */
    public function scopeSuccessful($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope pour les exécutions en erreur
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope pour les exécutions en cours
     */
    public function scopeRunning($query)
    {
        return $query->where('status', 'running');
    }

    /**
     * Vérifier si l'exécution est terminée
     */
    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    /**
     * Vérifier si l'exécution a échoué
     */
    public function hasFailed()
    {
        return $this->status === 'failed';
    }

    /**
     * Calculer la durée d'exécution
     */
    public function getDurationAttribute()
    {
        if ($this->started_at && $this->completed_at) {
            return $this->completed_at->diffInSeconds($this->started_at);
        }
        return null;
    }
}