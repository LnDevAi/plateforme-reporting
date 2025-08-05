<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ReportSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_id',
        'name',
        'description',
        'frequency',
        'frequency_config',
        'time',
        'timezone',
        'is_active',
        'parameters',
        'recipients',
        'export_format',
        'last_run_at',
        'next_run_at',
        'created_by',
    ];

    protected $casts = [
        'frequency_config' => 'array',
        'parameters' => 'array',
        'recipients' => 'array',
        'is_active' => 'boolean',
        'last_run_at' => 'datetime',
        'next_run_at' => 'datetime',
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
     * Relation avec l'utilisateur créateur
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relation avec les exécutions planifiées
     */
    public function executions()
    {
        return $this->hasMany(ReportExecution::class, 'schedule_id');
    }

    /**
     * Scope pour les planifications actives
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope pour les planifications à exécuter
     */
    public function scopeDue($query)
    {
        return $query->active()
                    ->where('next_run_at', '<=', now())
                    ->whereNotNull('next_run_at');
    }

    /**
     * Scope par fréquence
     */
    public function scopeByFrequency($query, $frequency)
    {
        return $query->where('frequency', $frequency);
    }

    /**
     * Calculer la prochaine exécution
     */
    public function calculateNextRun()
    {
        if (!$this->is_active) {
            $this->update(['next_run_at' => null]);
            return null;
        }

        $now = Carbon::now($this->timezone ?? config('app.timezone'));
        $nextRun = null;

        switch ($this->frequency) {
            case 'hourly':
                $nextRun = $now->addHour()->startOfHour();
                break;

            case 'daily':
                $time = Carbon::createFromFormat('H:i', $this->time, $this->timezone);
                $nextRun = $now->copy()->setTime($time->hour, $time->minute);
                if ($nextRun <= $now) {
                    $nextRun->addDay();
                }
                break;

            case 'weekly':
                $config = $this->frequency_config;
                $dayOfWeek = $config['day_of_week'] ?? 1; // Lundi par défaut
                $time = Carbon::createFromFormat('H:i', $this->time, $this->timezone);
                
                $nextRun = $now->copy()->next($dayOfWeek)->setTime($time->hour, $time->minute);
                if ($nextRun <= $now) {
                    $nextRun->addWeek();
                }
                break;

            case 'monthly':
                $config = $this->frequency_config;
                $dayOfMonth = $config['day_of_month'] ?? 1;
                $time = Carbon::createFromFormat('H:i', $this->time, $this->timezone);
                
                $nextRun = $now->copy()->day($dayOfMonth)->setTime($time->hour, $time->minute);
                if ($nextRun <= $now) {
                    $nextRun->addMonth();
                }
                break;

            case 'quarterly':
                $config = $this->frequency_config;
                $month = $config['month'] ?? 1; // Premier mois du trimestre
                $day = $config['day'] ?? 1;
                $time = Carbon::createFromFormat('H:i', $this->time, $this->timezone);
                
                $nextRun = $now->copy()->month($month)->day($day)->setTime($time->hour, $time->minute);
                while ($nextRun <= $now) {
                    $nextRun->addMonths(3);
                }
                break;

            case 'yearly':
                $config = $this->frequency_config;
                $month = $config['month'] ?? 1;
                $day = $config['day'] ?? 1;
                $time = Carbon::createFromFormat('H:i', $this->time, $this->timezone);
                
                $nextRun = $now->copy()->month($month)->day($day)->setTime($time->hour, $time->minute);
                if ($nextRun <= $now) {
                    $nextRun->addYear();
                }
                break;

            case 'custom':
                // Pour les planifications personnalisées (cron-like)
                $cronExpression = $this->frequency_config['cron'] ?? null;
                if ($cronExpression) {
                    // Ici, on pourrait utiliser une bibliothèque comme cron-expression
                    // Pour la simplicité, on va juste programmer pour dans une heure
                    $nextRun = $now->addHour();
                }
                break;
        }

        if ($nextRun) {
            $this->update(['next_run_at' => $nextRun]);
        }

        return $nextRun;
    }

    /**
     * Marquer comme exécuté
     */
    public function markAsExecuted()
    {
        $this->update([
            'last_run_at' => now(),
        ]);
        
        // Calculer la prochaine exécution
        $this->calculateNextRun();
    }

    /**
     * Vérifier si la planification est due
     */
    public function isDue()
    {
        return $this->is_active && 
               $this->next_run_at && 
               $this->next_run_at <= now();
    }

    /**
     * Obtenir la description de la fréquence
     */
    public function getFrequencyDescriptionAttribute()
    {
        $descriptions = [
            'hourly' => 'Toutes les heures',
            'daily' => 'Tous les jours à ' . $this->time,
            'weekly' => 'Chaque semaine',
            'monthly' => 'Chaque mois',
            'quarterly' => 'Chaque trimestre',
            'yearly' => 'Chaque année',
            'custom' => 'Planification personnalisée',
        ];

        return $descriptions[$this->frequency] ?? 'Fréquence inconnue';
    }
}