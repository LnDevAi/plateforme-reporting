<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class CourseEnrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'user_id',
        'enrolled_at',
        'started_at',
        'completed_at',
        'status',
        'progress_percentage',
        'current_module_id',
        'current_lesson_id',
        'time_spent_minutes',
        'last_accessed_at',
        'completion_certificate_id',
        'metadata',
    ];

    protected $casts = [
        'enrolled_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'last_accessed_at' => 'datetime',
        'metadata' => 'array',
    ];

    /**
     * Statuts d'inscription
     */
    const STATUS_ENROLLED = 'enrolled';
    const STATUS_ACTIVE = 'active';
    const STATUS_COMPLETED = 'completed';
    const STATUS_DROPPED = 'dropped';
    const STATUS_SUSPENDED = 'suspended';

    const STATUSES = [
        self::STATUS_ENROLLED => 'Inscrit',
        self::STATUS_ACTIVE => 'En cours',
        self::STATUS_COMPLETED => 'Terminé',
        self::STATUS_DROPPED => 'Abandonné',
        self::STATUS_SUSPENDED => 'Suspendu',
    ];

    /**
     * Relations
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function currentModule(): BelongsTo
    {
        return $this->belongsTo(CourseModule::class, 'current_module_id');
    }

    public function currentLesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class, 'current_lesson_id');
    }

    public function progressRecords(): HasMany
    {
        return $this->hasMany(LearningProgress::class);
    }

    public function certificate(): BelongsTo
    {
        return $this->belongsTo(CourseCertificate::class, 'completion_certificate_id');
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', [self::STATUS_ENROLLED, self::STATUS_ACTIVE]);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', self::STATUS_ACTIVE)
                    ->where('progress_percentage', '>', 0)
                    ->where('progress_percentage', '<', 100);
    }

    /**
     * Accesseurs
     */
    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    public function getFormattedTimeSpentAttribute(): string
    {
        $hours = floor($this->time_spent_minutes / 60);
        $minutes = $this->time_spent_minutes % 60;
        
        if ($hours > 0) {
            return sprintf('%dh %dmin', $hours, $minutes);
        }
        
        return sprintf('%dmin', $minutes);
    }

    public function getEstimatedCompletionAttribute(): ?Carbon
    {
        if ($this->status === self::STATUS_COMPLETED) {
            return null;
        }

        if (!$this->started_at || $this->progress_percentage <= 0) {
            return null;
        }

        $totalDurationMinutes = $this->course->duration_hours * 60;
        $remainingMinutes = $totalDurationMinutes - $this->time_spent_minutes;
        
        if ($remainingMinutes <= 0) {
            return now();
        }

        // Calculer la vitesse d'apprentissage moyenne
        $daysStudied = max(1, $this->started_at->diffInDays(now()));
        $averageMinutesPerDay = $this->time_spent_minutes / $daysStudied;
        
        if ($averageMinutesPerDay <= 0) {
            return null;
        }

        $estimatedDaysRemaining = ceil($remainingMinutes / $averageMinutesPerDay);
        
        return now()->addDays($estimatedDaysRemaining);
    }

    /**
     * Méthodes utilitaires
     */

    /**
     * Démarre le cours
     */
    public function start(): self
    {
        if ($this->status === self::STATUS_ENROLLED) {
            $this->update([
                'status' => self::STATUS_ACTIVE,
                'started_at' => now(),
                'last_accessed_at' => now(),
            ]);
        }

        return $this;
    }

    /**
     * Met à jour la progression
     */
    public function updateProgress(): self
    {
        $progress = $this->calculateProgress();
        
        $this->update([
            'progress_percentage' => $progress,
            'last_accessed_at' => now(),
        ]);

        // Marquer comme terminé si 100%
        if ($progress >= 100 && $this->status !== self::STATUS_COMPLETED) {
            $this->complete();
        }

        return $this;
    }

    /**
     * Calcule la progression basée sur les leçons complétées
     */
    public function calculateProgress(): int
    {
        $totalLessons = $this->course->modules()
                                   ->withCount('lessons')
                                   ->get()
                                   ->sum('lessons_count');

        if ($totalLessons === 0) {
            return 0;
        }

        $completedLessons = $this->progressRecords()
                                ->where('status', 'completed')
                                ->count();

        return min(100, round(($completedLessons / $totalLessons) * 100));
    }

    /**
     * Marque le cours comme terminé
     */
    public function complete(): self
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'completed_at' => now(),
            'progress_percentage' => 100,
        ]);

        // Générer le certificat si éligible
        if ($this->course->certification_available && !$this->completion_certificate_id) {
            $certificate = $this->generateCertificate();
            $this->update(['completion_certificate_id' => $certificate->id]);
        }

        return $this;
    }

    /**
     * Abandonne le cours
     */
    public function drop(string $reason = null): self
    {
        $metadata = $this->metadata ?? [];
        $metadata['drop_reason'] = $reason;
        $metadata['dropped_at'] = now()->toISOString();

        $this->update([
            'status' => self::STATUS_DROPPED,
            'metadata' => $metadata,
        ]);

        return $this;
    }

    /**
     * Suspend l'inscription
     */
    public function suspend(string $reason = null): self
    {
        $metadata = $this->metadata ?? [];
        $metadata['suspension_reason'] = $reason;
        $metadata['suspended_at'] = now()->toISOString();

        $this->update([
            'status' => self::STATUS_SUSPENDED,
            'metadata' => $metadata,
        ]);

        return $this;
    }

    /**
     * Enregistre le temps passé
     */
    public function addTimeSpent(int $minutes): self
    {
        $this->increment('time_spent_minutes', $minutes);
        $this->update(['last_accessed_at' => now()]);

        return $this;
    }

    /**
     * Met à jour la position actuelle
     */
    public function updateCurrentPosition(int $moduleId, int $lessonId = null): self
    {
        $this->update([
            'current_module_id' => $moduleId,
            'current_lesson_id' => $lessonId,
            'last_accessed_at' => now(),
        ]);

        return $this;
    }

    /**
     * Génère un certificat de completion
     */
    protected function generateCertificate(): CourseCertificate
    {
        return CourseCertificate::create([
            'course_id' => $this->course_id,
            'user_id' => $this->user_id,
            'enrollment_id' => $this->id,
            'certificate_number' => $this->generateCertificateNumber(),
            'issued_at' => now(),
            'expires_at' => $this->course->certification_validity_months 
                          ? now()->addMonths($this->course->certification_validity_months)
                          : null,
            'issuing_body' => $this->course->certification_body,
            'status' => 'issued',
            'verification_code' => $this->generateVerificationCode(),
        ]);
    }

    /**
     * Génère un numéro de certificat unique
     */
    protected function generateCertificateNumber(): string
    {
        $courseCode = strtoupper(substr($this->course->code, 0, 6));
        $year = now()->year;
        $sequence = str_pad($this->id, 6, '0', STR_PAD_LEFT);
        
        return "{$courseCode}-{$year}-{$sequence}";
    }

    /**
     * Génère un code de vérification
     */
    protected function generateVerificationCode(): string
    {
        return strtoupper(bin2hex(random_bytes(8)));
    }

    /**
     * Obtient les statistiques de progression
     */
    public function getProgressStats(): array
    {
        $totalModules = $this->course->modules()->count();
        $completedModules = $this->progressRecords()
                                ->whereHas('lesson.module')
                                ->groupBy('lesson.module_id')
                                ->havingRaw('AVG(CASE WHEN status = "completed" THEN 1 ELSE 0 END) = 1')
                                ->count();

        $totalLessons = $this->course->modules()
                                   ->withCount('lessons')
                                   ->get()
                                   ->sum('lessons_count');
        
        $completedLessons = $this->progressRecords()
                                ->where('status', 'completed')
                                ->count();

        return [
            'overall_progress' => $this->progress_percentage,
            'modules' => [
                'total' => $totalModules,
                'completed' => $completedModules,
                'percentage' => $totalModules > 0 ? round(($completedModules / $totalModules) * 100) : 0
            ],
            'lessons' => [
                'total' => $totalLessons,
                'completed' => $completedLessons,
                'percentage' => $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100) : 0
            ],
            'time_spent' => [
                'minutes' => $this->time_spent_minutes,
                'formatted' => $this->formatted_time_spent,
                'course_duration_minutes' => $this->course->duration_hours * 60,
                'completion_rate' => $this->course->duration_hours > 0 
                                   ? min(100, round(($this->time_spent_minutes / ($this->course->duration_hours * 60)) * 100))
                                   : 0
            ],
            'estimated_completion' => $this->estimated_completion?->toISOString(),
        ];
    }

    /**
     * Vérifie si l'utilisateur peut reprendre le cours
     */
    public function canResume(): bool
    {
        return in_array($this->status, [self::STATUS_ENROLLED, self::STATUS_ACTIVE]) &&
               $this->progress_percentage < 100;
    }

    /**
     * Vérifie si l'inscription est éligible pour un certificat
     */
    public function isEligibleForCertificate(): bool
    {
        return $this->status === self::STATUS_COMPLETED &&
               $this->course->certification_available &&
               !$this->completion_certificate_id;
    }
}