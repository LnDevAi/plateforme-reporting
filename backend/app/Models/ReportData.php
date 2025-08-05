<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportData extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_id',
        'execution_id',
        'data',
        'metadata',
        'row_number',
        'created_at',
    ];

    protected $casts = [
        'data' => 'array',
        'metadata' => 'array',
        'row_number' => 'integer',
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
     * Relation avec l'exécution du rapport
     */
    public function execution()
    {
        return $this->belongsTo(ReportExecution::class, 'execution_id');
    }

    /**
     * Scope pour ordonner par numéro de ligne
     */
    public function scopeOrderedByRow($query)
    {
        return $query->orderBy('row_number');
    }

    /**
     * Scope pour filtrer par exécution
     */
    public function scopeForExecution($query, $executionId)
    {
        return $query->where('execution_id', $executionId);
    }
}