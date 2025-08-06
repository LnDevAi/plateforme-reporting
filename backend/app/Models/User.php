<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'department',
        'is_active',
        'country_id',
        'phone',
        'organization',
        'position',
        'preferred_language',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
    ];

    /**
     * Relation avec les rapports créés par l'utilisateur
     */
    public function reports()
    {
        return $this->hasMany(Report::class, 'created_by');
    }

    /**
     * Relation avec les exécutions de rapports
     */
    public function reportExecutions()
    {
        return $this->hasMany(ReportExecution::class, 'executed_by');
    }

    /**
     * Vérifier si l'utilisateur est administrateur
     */
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    /**
     * Vérifier si l'utilisateur peut créer des rapports
     */
    public function canCreateReports()
    {
        return in_array($this->role, ['admin', 'manager', 'analyst']);
    }

    /**
     * Relation avec le pays
     */
    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    /**
     * Obtient la langue préférée de l'utilisateur ou celle de son pays
     */
    public function getPreferredLanguage(): string
    {
        return $this->preferred_language ?? $this->country?->getPrimaryBusinessLanguage() ?? 'fr';
    }

    /**
     * Vérifie si l'utilisateur peut accéder aux features UEMOA
     */
    public function canAccessUemoaFeatures(): bool
    {
        return $this->country?->is_uemoa_member ?? false;
    }

    /**
     * Vérifie si l'utilisateur peut accéder aux features OHADA
     */
    public function canAccessOhadaFeatures(): bool
    {
        return $this->country?->is_ohada_member ?? false;
    }
}