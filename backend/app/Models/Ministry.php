<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ministry extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'type',
        'description',
        'minister_name',
        'secretary_general',
        'contact_email',
        'contact_phone',
        'address',
        'is_active',
        'parent_ministry_id',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Relation avec le ministère parent (pour la hiérarchie)
     */
    public function parentMinistry()
    {
        return $this->belongsTo(Ministry::class, 'parent_ministry_id');
    }

    /**
     * Relation avec les sous-ministères
     */
    public function childMinistries()
    {
        return $this->hasMany(Ministry::class, 'parent_ministry_id');
    }

    /**
     * Relation avec les EPE sous tutelle technique
     */
    public function technicalTutelageEpes()
    {
        return $this->hasMany(StateEntity::class, 'technical_ministry_id');
    }

    /**
     * Relation avec les EPE sous tutelle financière
     */
    public function financialTutelageEpes()
    {
        return $this->hasMany(StateEntity::class, 'financial_ministry_id');
    }

    /**
     * Relation avec tous les utilisateurs du ministère
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Scope pour les ministères actifs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope par type de ministère
     */
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Obtenir toutes les EPE sous tutelle (technique + financière)
     */
    public function getAllTutelageEpes()
    {
        return StateEntity::where('technical_ministry_id', $this->id)
                         ->orWhere('financial_ministry_id', $this->id)
                         ->get();
    }

    /**
     * Obtenir les KPI du ministère
     */
    public function getKpiMetrics()
    {
        $technicalEpes = $this->technicalTutelageEpes()->with('reports')->get();
        $financialEpes = $this->financialTutelageEpes()->with('reports')->get();
        
        return [
            'technical_supervision' => [
                'total_epes' => $technicalEpes->count(),
                'total_reports' => $technicalEpes->sum(fn($epe) => $epe->reports->count()),
                'pending_approvals' => $this->getPendingApprovalsCount('technical'),
                'compliance_rate' => $this->getComplianceRate('technical'),
            ],
            'financial_supervision' => [
                'total_epes' => $financialEpes->count(),
                'total_reports' => $financialEpes->sum(fn($epe) => $epe->reports->count()),
                'pending_approvals' => $this->getPendingApprovalsCount('financial'),
                'compliance_rate' => $this->getComplianceRate('financial'),
            ],
            'global_metrics' => [
                'total_supervised_epes' => $technicalEpes->count() + $financialEpes->count(),
                'monthly_report_submission_rate' => $this->getMonthlySubmissionRate(),
                'average_approval_time' => $this->getAverageApprovalTime(),
                'regulatory_compliance_score' => $this->getRegulatoryComplianceScore(),
            ]
        ];
    }

    /**
     * Obtenir le nombre d'approbations en attente
     */
    private function getPendingApprovalsCount($tutelageType)
    {
        $epeIds = $tutelageType === 'technical' 
            ? $this->technicalTutelageEpes()->pluck('id')
            : $this->financialTutelageEpes()->pluck('id');

        return DocumentVersion::whereHas('report', function($query) use ($epeIds) {
                $query->whereIn('entity_id', $epeIds);
            })
            ->where('status', 'pending_approval')
            ->count();
    }

    /**
     * Obtenir le taux de conformité
     */
    private function getComplianceRate($tutelageType)
    {
        $epeIds = $tutelageType === 'technical' 
            ? $this->technicalTutelageEpes()->pluck('id')
            : $this->financialTutelageEpes()->pluck('id');

        $totalReports = DocumentVersion::whereHas('report', function($query) use ($epeIds) {
                $query->whereIn('entity_id', $epeIds);
            })
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        $compliantReports = DocumentVersion::whereHas('report', function($query) use ($epeIds) {
                $query->whereIn('entity_id', $epeIds);
            })
            ->where('status', 'approved')
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        return $totalReports > 0 ? round(($compliantReports / $totalReports) * 100, 2) : 0;
    }

    /**
     * Obtenir le taux de soumission mensuel
     */
    private function getMonthlySubmissionRate()
    {
        // Calcul basé sur les obligations réglementaires vs soumissions réelles
        $expectedReports = $this->getAllTutelageEpes()->count() * 4; // 4 rapports mensuels par EPE
        $actualSubmissions = DocumentVersion::whereHas('report', function($query) {
                $epeIds = $this->getAllTutelageEpes()->pluck('id');
                $query->whereIn('entity_id', $epeIds);
            })
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        return $expectedReports > 0 ? round(($actualSubmissions / $expectedReports) * 100, 2) : 0;
    }

    /**
     * Obtenir le temps moyen d'approbation
     */
    private function getAverageApprovalTime()
    {
        $approvedReports = DocumentVersion::whereHas('report', function($query) {
                $epeIds = $this->getAllTutelageEpes()->pluck('id');
                $query->whereIn('entity_id', $epeIds);
            })
            ->where('status', 'approved')
            ->where('created_at', '>=', now()->subDays(30))
            ->get();

        if ($approvedReports->isEmpty()) {
            return 0;
        }

        $totalHours = $approvedReports->sum(function($report) {
            return $report->created_at->diffInHours($report->approved_at);
        });

        return round($totalHours / $approvedReports->count(), 1);
    }

    /**
     * Obtenir le score de conformité réglementaire
     */
    private function getRegulatoryComplianceScore()
    {
        // Score basé sur plusieurs critères UEMOA
        $criteria = [
            'timely_submission' => $this->getTimelySubmissionRate(),
            'content_quality' => $this->getContentQualityScore(),
            'approval_efficiency' => $this->getApprovalEfficiencyScore(),
            'regulatory_adherence' => $this->getRegulatoryAdherenceScore(),
        ];

        return round(array_sum($criteria) / count($criteria), 2);
    }

    /**
     * Obtenir le taux de soumission dans les délais
     */
    private function getTimelySubmissionRate()
    {
        // Logique pour calculer les soumissions dans les délais réglementaires
        return 85.5; // Exemple
    }

    /**
     * Obtenir le score de qualité du contenu
     */
    private function getContentQualityScore()
    {
        // Basé sur le nombre de rejets, commentaires, révisions
        return 78.2; // Exemple
    }

    /**
     * Obtenir le score d'efficacité d'approbation
     */
    private function getApprovalEfficiencyScore()
    {
        // Basé sur les temps d'approbation vs objectifs
        return 92.1; // Exemple
    }

    /**
     * Obtenir le score d'adhérence réglementaire
     */
    private function getRegulatoryAdherenceScore()
    {
        // Basé sur la conformité aux directives UEMOA
        return 88.7; // Exemple
    }

    /**
     * Obtenir les KPI détaillés pour le tableau de bord ministériel
     */
    public function getDetailedKpiDashboard()
    {
        return [
            'overview' => [
                'total_epes_supervised' => $this->getAllTutelageEpes()->count(),
                'active_reports_count' => $this->getActiveReportsCount(),
                'pending_approvals_count' => $this->getTotalPendingApprovals(),
                'monthly_compliance_rate' => $this->getMonthlySubmissionRate(),
            ],
            'performance_trends' => [
                'last_6_months_submissions' => $this->getSubmissionTrends(6),
                'approval_time_evolution' => $this->getApprovalTimeTrends(6),
                'compliance_evolution' => $this->getComplianceTrends(6),
            ],
            'epe_rankings' => [
                'top_performers' => $this->getTopPerformingEpes(),
                'attention_needed' => $this->getEpesNeedingAttention(),
            ],
            'regulatory_alerts' => [
                'overdue_reports' => $this->getOverdueReports(),
                'missing_documents' => $this->getMissingDocuments(),
                'compliance_issues' => $this->getComplianceIssues(),
            ]
        ];
    }

    /**
     * Obtenir le nombre de rapports actifs
     */
    private function getActiveReportsCount()
    {
        return DocumentVersion::whereHas('report', function($query) {
                $epeIds = $this->getAllTutelageEpes()->pluck('id');
                $query->whereIn('entity_id', $epeIds);
            })
            ->whereIn('status', ['draft', 'pending_approval'])
            ->count();
    }

    /**
     * Obtenir le total des approbations en attente
     */
    private function getTotalPendingApprovals()
    {
        return $this->getPendingApprovalsCount('technical') + $this->getPendingApprovalsCount('financial');
    }

    /**
     * Obtenir les tendances de soumission
     */
    private function getSubmissionTrends($months)
    {
        $trends = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $count = DocumentVersion::whereHas('report', function($query) {
                    $epeIds = $this->getAllTutelageEpes()->pluck('id');
                    $query->whereIn('entity_id', $epeIds);
                })
                ->whereMonth('created_at', $month->month)
                ->whereYear('created_at', $month->year)
                ->count();
            
            $trends[] = [
                'month' => $month->format('Y-m'),
                'submissions' => $count
            ];
        }
        return $trends;
    }

    /**
     * Obtenir les tendances des temps d'approbation
     */
    private function getApprovalTimeTrends($months)
    {
        // Logique similaire pour les temps d'approbation
        return []; // À implémenter
    }

    /**
     * Obtenir les tendances de conformité
     */
    private function getComplianceTrends($months)
    {
        // Logique similaire pour la conformité
        return []; // À implémenter
    }

    /**
     * Obtenir les EPE les plus performantes
     */
    private function getTopPerformingEpes()
    {
        return $this->getAllTutelageEpes()
                   ->sortByDesc('performance_score')
                   ->take(5);
    }

    /**
     * Obtenir les EPE nécessitant une attention
     */
    private function getEpesNeedingAttention()
    {
        return $this->getAllTutelageEpes()
                   ->where('compliance_score', '<', 70)
                   ->sortBy('compliance_score');
    }

    /**
     * Obtenir les rapports en retard
     */
    private function getOverdueReports()
    {
        // Logique pour identifier les rapports en retard selon calendrier UEMOA
        return [];
    }

    /**
     * Obtenir les documents manquants
     */
    private function getMissingDocuments()
    {
        // Logique pour identifier les documents obligatoires manquants
        return [];
    }

    /**
     * Obtenir les problèmes de conformité
     */
    private function getComplianceIssues()
    {
        // Logique pour identifier les problèmes de conformité
        return [];
    }
}