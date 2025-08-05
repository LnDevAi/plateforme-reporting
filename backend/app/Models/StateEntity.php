<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StateEntity extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'type',
        'sector',
        'status',
        'description',
        'technical_ministry_id',
        'financial_ministry_id',
        'director_general',
        'board_president',
        'headquarters_address',
        'contact_email',
        'contact_phone',
        'website',
        'establishment_date',
        'capital_amount',
        'employee_count',
        'annual_revenue',
        'is_active',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'establishment_date' => 'date',
        'capital_amount' => 'decimal:2',
        'annual_revenue' => 'decimal:2',
        'employee_count' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Relation avec le ministère de tutelle technique
     */
    public function technicalMinistry()
    {
        return $this->belongsTo(Ministry::class, 'technical_ministry_id');
    }

    /**
     * Relation avec le ministère de tutelle financière
     */
    public function financialMinistry()
    {
        return $this->belongsTo(Ministry::class, 'financial_ministry_id');
    }

    /**
     * Relation avec les rapports
     */
    public function reports()
    {
        return $this->hasMany(Report::class, 'entity_id');
    }

    /**
     * Relation avec les utilisateurs de l'entité
     */
    public function users()
    {
        return $this->hasMany(User::class, 'entity_id');
    }

    /**
     * Scope pour les entités actives
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope par type d'entité
     */
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope par secteur
     */
    public function scopeBySector($query, $sector)
    {
        return $query->where('sector', $sector);
    }

    /**
     * Scope par ministère de tutelle technique
     */
    public function scopeByTechnicalMinistry($query, $ministryId)
    {
        return $query->where('technical_ministry_id', $ministryId);
    }

    /**
     * Scope par ministère de tutelle financière
     */
    public function scopeByFinancialMinistry($query, $ministryId)
    {
        return $query->where('financial_ministry_id', $ministryId);
    }

    /**
     * Obtenir les KPI de l'entité
     */
    public function getEntityKpiMetrics()
    {
        return [
            'general_info' => [
                'entity_name' => $this->name,
                'entity_type' => $this->type,
                'sector' => $this->sector,
                'status' => $this->status,
                'technical_ministry' => $this->technicalMinistry?->name,
                'financial_ministry' => $this->financialMinistry?->name,
            ],
            'reporting_metrics' => [
                'total_reports' => $this->reports()->count(),
                'active_reports' => $this->getActiveReportsCount(),
                'pending_approvals' => $this->getPendingApprovalsCount(),
                'approved_reports' => $this->getApprovedReportsCount(),
                'rejected_reports' => $this->getRejectedReportsCount(),
                'monthly_submission_rate' => $this->getMonthlySubmissionRate(),
            ],
            'compliance_metrics' => [
                'overall_compliance_score' => $this->getOverallComplianceScore(),
                'uemoa_compliance_rate' => $this->getUemoaComplianceRate(),
                'timely_submission_rate' => $this->getTimelySubmissionRate(),
                'quality_score' => $this->getQualityScore(),
                'approval_efficiency' => $this->getApprovalEfficiency(),
            ],
            'performance_indicators' => [
                'average_report_completion_time' => $this->getAverageReportCompletionTime(),
                'collaboration_activity' => $this->getCollaborationActivity(),
                'revision_rate' => $this->getRevisionRate(),
                'user_engagement' => $this->getUserEngagement(),
            ],
            'trends' => [
                'last_6_months_activity' => $this->getActivityTrends(6),
                'compliance_evolution' => $this->getComplianceEvolution(6),
                'performance_trends' => $this->getPerformanceTrends(6),
            ],
            'alerts' => [
                'overdue_reports' => $this->getOverdueReports(),
                'missing_mandatory_reports' => $this->getMissingMandatoryReports(),
                'compliance_warnings' => $this->getComplianceWarnings(),
            ]
        ];
    }

    /**
     * Obtenir le nombre de rapports actifs
     */
    private function getActiveReportsCount()
    {
        return $this->reports()
                   ->whereHas('currentVersion', function($query) {
                       $query->whereIn('status', ['draft', 'pending_approval']);
                   })
                   ->count();
    }

    /**
     * Obtenir le nombre d'approbations en attente
     */
    private function getPendingApprovalsCount()
    {
        return $this->reports()
                   ->whereHas('currentVersion', function($query) {
                       $query->where('status', 'pending_approval');
                   })
                   ->count();
    }

    /**
     * Obtenir le nombre de rapports approuvés
     */
    private function getApprovedReportsCount()
    {
        return $this->reports()
                   ->whereHas('currentVersion', function($query) {
                       $query->where('status', 'approved');
                   })
                   ->count();
    }

    /**
     * Obtenir le nombre de rapports rejetés
     */
    private function getRejectedReportsCount()
    {
        return $this->reports()
                   ->whereHas('currentVersion', function($query) {
                       $query->where('status', 'rejected');
                   })
                   ->count();
    }

    /**
     * Obtenir le taux de soumission mensuel
     */
    private function getMonthlySubmissionRate()
    {
        $expectedReports = 4; // Supposons 4 rapports obligatoires par mois
        $actualSubmissions = $this->reports()
                                 ->where('created_at', '>=', now()->startOfMonth())
                                 ->count();

        return $expectedReports > 0 ? round(($actualSubmissions / $expectedReports) * 100, 2) : 0;
    }

    /**
     * Obtenir le score de conformité global
     */
    private function getOverallComplianceScore()
    {
        $scores = [
            'uemoa_compliance' => $this->getUemoaComplianceRate(),
            'timely_submission' => $this->getTimelySubmissionRate(),
            'quality' => $this->getQualityScore(),
            'completeness' => $this->getCompletenessScore(),
        ];

        return round(array_sum($scores) / count($scores), 2);
    }

    /**
     * Obtenir le taux de conformité UEMOA
     */
    private function getUemoaComplianceRate()
    {
        // Calcul basé sur les critères UEMOA spécifiques
        $totalReports = $this->reports()->where('created_at', '>=', now()->subDays(30))->count();
        
        if ($totalReports === 0) return 100;

        $compliantReports = $this->reports()
                                ->where('created_at', '>=', now()->subDays(30))
                                ->whereHas('currentVersion', function($query) {
                                    $query->where('status', 'approved')
                                          ->whereJsonContains('metadata->uemoa_compliant', true);
                                })
                                ->count();

        return round(($compliantReports / $totalReports) * 100, 2);
    }

    /**
     * Obtenir le taux de soumission dans les délais
     */
    private function getTimelySubmissionRate()
    {
        // Logique pour calculer les soumissions dans les délais
        $totalSubmissions = $this->reports()->where('created_at', '>=', now()->subDays(90))->count();
        
        if ($totalSubmissions === 0) return 100;

        $timelySubmissions = $this->reports()
                                 ->where('created_at', '>=', now()->subDays(90))
                                 ->whereJsonContains('metadata->submitted_on_time', true)
                                 ->count();

        return round(($timelySubmissions / $totalSubmissions) * 100, 2);
    }

    /**
     * Obtenir le score de qualité
     */
    private function getQualityScore()
    {
        $totalReports = $this->reports()->where('created_at', '>=', now()->subDays(30))->count();
        
        if ($totalReports === 0) return 100;

        $qualityReports = $this->reports()
                              ->where('created_at', '>=', now()->subDays(30))
                              ->whereHas('currentVersion', function($query) {
                                  $query->where('status', 'approved')
                                        ->whereNull('rejection_reason');
                              })
                              ->count();

        return round(($qualityReports / $totalReports) * 100, 2);
    }

    /**
     * Obtenir le score de complétude
     */
    private function getCompletenessScore()
    {
        // Score basé sur la présence de tous les champs obligatoires
        return 95.0; // Exemple
    }

    /**
     * Obtenir l'efficacité d'approbation
     */
    private function getApprovalEfficiency()
    {
        $approvedReports = $this->reports()
                               ->whereHas('currentVersion', function($query) {
                                   $query->where('status', 'approved')
                                         ->where('created_at', '>=', now()->subDays(30));
                               })
                               ->with('currentVersion')
                               ->get();

        if ($approvedReports->isEmpty()) return 100;

        $avgApprovalTime = $approvedReports->avg(function($report) {
            return $report->currentVersion->created_at->diffInHours($report->currentVersion->approved_at);
        });

        // Score inversé : moins de temps = meilleur score
        $targetHours = 48; // Objectif 48h
        return $avgApprovalTime <= $targetHours ? 100 : round((1 - (($avgApprovalTime - $targetHours) / $targetHours)) * 100, 2);
    }

    /**
     * Obtenir le temps moyen de finalisation des rapports
     */
    private function getAverageReportCompletionTime()
    {
        $completedReports = $this->reports()
                                ->whereHas('currentVersion', function($query) {
                                    $query->where('status', 'approved')
                                          ->where('created_at', '>=', now()->subDays(30));
                                })
                                ->with('currentVersion')
                                ->get();

        if ($completedReports->isEmpty()) return 0;

        $avgHours = $completedReports->avg(function($report) {
            return $report->created_at->diffInHours($report->currentVersion->approved_at);
        });

        return round($avgHours, 1);
    }

    /**
     * Obtenir l'activité de collaboration
     */
    private function getCollaborationActivity()
    {
        $totalCollaborators = DocumentVersion::whereHas('report', function($query) {
                                  $query->where('entity_id', $this->id);
                              })
                              ->withCount('collaborators')
                              ->get()
                              ->sum('collaborators_count');

        $totalComments = DocumentComment::whereHas('documentVersion.report', function($query) {
                             $query->where('entity_id', $this->id);
                         })
                         ->count();

        return [
            'total_collaborators' => $totalCollaborators,
            'total_comments' => $totalComments,
            'avg_collaborators_per_report' => $this->reports()->count() > 0 
                ? round($totalCollaborators / $this->reports()->count(), 1) 
                : 0,
        ];
    }

    /**
     * Obtenir le taux de révision
     */
    private function getRevisionRate()
    {
        $totalReports = $this->reports()->where('created_at', '>=', now()->subDays(30))->count();
        
        if ($totalReports === 0) return 0;

        $revisedReports = $this->reports()
                              ->where('created_at', '>=', now()->subDays(30))
                              ->whereHas('versions', function($query) {
                                  $query->selectRaw('COUNT(*) as version_count')
                                        ->havingRaw('COUNT(*) > 1');
                              })
                              ->count();

        return round(($revisedReports / $totalReports) * 100, 2);
    }

    /**
     * Obtenir l'engagement des utilisateurs
     */
    private function getUserEngagement()
    {
        $activeUsers = $this->users()
                           ->whereHas('documentVersions', function($query) {
                               $query->where('updated_at', '>=', now()->subDays(30));
                           })
                           ->count();

        $totalUsers = $this->users()->count();

        return [
            'active_users' => $activeUsers,
            'total_users' => $totalUsers,
            'engagement_rate' => $totalUsers > 0 ? round(($activeUsers / $totalUsers) * 100, 2) : 0,
        ];
    }

    /**
     * Obtenir les tendances d'activité
     */
    private function getActivityTrends($months)
    {
        $trends = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $count = $this->reports()
                         ->whereMonth('created_at', $month->month)
                         ->whereYear('created_at', $month->year)
                         ->count();
            
            $trends[] = [
                'month' => $month->format('Y-m'),
                'reports_created' => $count
            ];
        }
        return $trends;
    }

    /**
     * Obtenir l'évolution de la conformité
     */
    private function getComplianceEvolution($months)
    {
        $evolution = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $totalReports = $this->reports()
                                ->whereMonth('created_at', $month->month)
                                ->whereYear('created_at', $month->year)
                                ->count();

            $compliantReports = $this->reports()
                                    ->whereMonth('created_at', $month->month)
                                    ->whereYear('created_at', $month->year)
                                    ->whereHas('currentVersion', function($query) {
                                        $query->where('status', 'approved');
                                    })
                                    ->count();

            $complianceRate = $totalReports > 0 ? round(($compliantReports / $totalReports) * 100, 2) : 0;
            
            $evolution[] = [
                'month' => $month->format('Y-m'),
                'compliance_rate' => $complianceRate
            ];
        }
        return $evolution;
    }

    /**
     * Obtenir les tendances de performance
     */
    private function getPerformanceTrends($months)
    {
        $trends = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            
            // Calculer différentes métriques pour ce mois
            $qualityScore = $this->calculateMonthlyQualityScore($month);
            $timelySubmissions = $this->calculateMonthlyTimelySubmissions($month);
            
            $trends[] = [
                'month' => $month->format('Y-m'),
                'quality_score' => $qualityScore,
                'timely_submission_rate' => $timelySubmissions,
            ];
        }
        return $trends;
    }

    /**
     * Calculer le score de qualité mensuel
     */
    private function calculateMonthlyQualityScore($month)
    {
        // Logique pour calculer le score de qualité pour un mois donné
        return 85.0; // Exemple
    }

    /**
     * Calculer les soumissions dans les délais mensuels
     */
    private function calculateMonthlyTimelySubmissions($month)
    {
        // Logique pour calculer les soumissions dans les délais pour un mois donné
        return 92.0; // Exemple
    }

    /**
     * Obtenir les rapports en retard
     */
    private function getOverdueReports()
    {
        return $this->reports()
                   ->whereHas('currentVersion', function($query) {
                       $query->whereIn('status', ['draft', 'pending_approval']);
                   })
                   ->where('created_at', '<', now()->subDays(7)) // Plus de 7 jours
                   ->with('currentVersion')
                   ->get()
                   ->map(function($report) {
                       return [
                           'id' => $report->id,
                           'name' => $report->name,
                           'status' => $report->currentVersion->status,
                           'days_overdue' => now()->diffInDays($report->created_at),
                           'category' => $report->category,
                       ];
                   });
    }

    /**
     * Obtenir les rapports obligatoires manquants
     */
    private function getMissingMandatoryReports()
    {
        // Logique pour identifier les rapports obligatoires non créés
        $mandatoryReports = [
            'Projet de Budget Annuel',
            'États Financiers Annuels',
            'Rapport d\'Activités Détaillé',
            'Inventaire Physique et Patrimoine'
        ];

        $existingReports = $this->reports()
                               ->where('created_at', '>=', now()->startOfYear())
                               ->pluck('name')
                               ->toArray();

        $missing = array_diff($mandatoryReports, $existingReports);

        return array_map(function($reportName) {
            return [
                'name' => $reportName,
                'deadline' => $this->getReportDeadline($reportName),
                'priority' => 'high',
            ];
        }, $missing);
    }

    /**
     * Obtenir les avertissements de conformité
     */
    private function getComplianceWarnings()
    {
        $warnings = [];

        // Vérifier le taux de conformité
        if ($this->getUemoaComplianceRate() < 80) {
            $warnings[] = [
                'type' => 'low_compliance',
                'message' => 'Taux de conformité UEMOA inférieur à 80%',
                'severity' => 'high',
                'metric' => $this->getUemoaComplianceRate() . '%'
            ];
        }

        // Vérifier les soumissions tardives
        if ($this->getTimelySubmissionRate() < 70) {
            $warnings[] = [
                'type' => 'late_submissions',
                'message' => 'Trop de soumissions tardives',
                'severity' => 'medium',
                'metric' => $this->getTimelySubmissionRate() . '%'
            ];
        }

        return $warnings;
    }

    /**
     * Obtenir la date limite d'un rapport
     */
    private function getReportDeadline($reportName)
    {
        $deadlines = [
            'Projet de Budget Annuel' => now()->month(10)->day(31), // 31 octobre
            'États Financiers Annuels' => now()->addYear()->month(3)->day(31), // 31 mars N+1
            'Rapport d\'Activités Détaillé' => now()->addYear()->month(4)->day(30), // 30 avril N+1
            'Inventaire Physique et Patrimoine' => now()->month(12)->day(31), // 31 décembre
        ];

        return $deadlines[$reportName] ?? now()->addDays(30);
    }

    /**
     * Obtenir les KPI comparatifs avec d'autres entités similaires
     */
    public function getComparativeKpis()
    {
        $similarEntities = static::where('type', $this->type)
                                ->where('sector', $this->sector)
                                ->where('id', '!=', $this->id)
                                ->get();

        if ($similarEntities->isEmpty()) {
            return [
                'peer_comparison' => 'Aucune entité similaire pour comparaison',
                'ranking' => null,
            ];
        }

        $myScore = $this->getOverallComplianceScore();
        $betterCount = $similarEntities->filter(function($entity) use ($myScore) {
            return $entity->getOverallComplianceScore() > $myScore;
        })->count();

        return [
            'peer_comparison' => [
                'total_peers' => $similarEntities->count(),
                'my_ranking' => $betterCount + 1,
                'percentile' => round((1 - ($betterCount / $similarEntities->count())) * 100, 0),
                'average_peer_score' => round($similarEntities->avg(fn($e) => $e->getOverallComplianceScore()), 2),
                'my_score' => $myScore,
                'performance_gap' => round($myScore - $similarEntities->avg(fn($e) => $e->getOverallComplianceScore()), 2),
            ],
            'best_practices' => $this->getBestPracticesFromPeers($similarEntities),
        ];
    }

    /**
     * Obtenir les meilleures pratiques des pairs
     */
    private function getBestPracticesFromPeers($peers)
    {
        $topPerformer = $peers->sortByDesc(fn($e) => $e->getOverallComplianceScore())->first();
        
        if (!$topPerformer) return [];

        return [
            'top_performer' => $topPerformer->name,
            'top_performer_score' => $topPerformer->getOverallComplianceScore(),
            'lessons' => [
                'Taux de soumission dans les délais élevé',
                'Processus d\'approbation optimisé',
                'Collaboration active entre équipes',
                'Conformité UEMOA exemplaire'
            ]
        ];
    }
}