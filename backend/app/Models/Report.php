<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Report extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'type',
        'category',
        'query',
        'parameters',
        'filters',
        'visualization_config',
        'schedule',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'parameters' => 'array',
        'filters' => 'array',
        'visualization_config' => 'array',
        'schedule' => 'array',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Relation avec l'utilisateur créateur
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relation avec l'utilisateur qui a fait la dernière modification
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Relation avec les exécutions du rapport
     */
    public function executions()
    {
        return $this->hasMany(ReportExecution::class);
    }

    /**
     * Relation avec les données du rapport
     */
    public function data()
    {
        return $this->hasMany(ReportData::class);
    }

    /**
     * Obtenir la dernière exécution du rapport
     */
    public function lastExecution()
    {
        return $this->hasOne(ReportExecution::class)->latest();
    }

    /**
     * Scope pour les rapports actifs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope pour filtrer par catégorie
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope pour filtrer par type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }
}