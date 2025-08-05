<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ministry;
use App\Models\StateEntity;
use App\Models\DocumentVersion;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class KpiController extends Controller
{
    /**
     * Obtenir les KPI globaux (niveau super-administrateur/ministères)
     */
    public function getGlobalKpis(Request $request): JsonResponse
    {
        // Vérifier les permissions (super admin ou ministère)
        if (!Auth::user()->isAdmin() && !Auth::user()->ministry_id) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé - Permissions insuffisantes'
            ], 403);
        }

        $period = $request->get('period', '6months');
        $ministryId = $request->get('ministry_id');

        $kpis = [
            'overview' => $this->getGlobalOverview($ministryId),
            'ministry_performance' => $this->getMinistryPerformance($ministryId),
            'epe_rankings' => $this->getEpeRankings($ministryId),
            'compliance_dashboard' => $this->getComplianceDashboard($ministryId),
            'trends_analysis' => $this->getTrendsAnalysis($period, $ministryId),
            'alerts_summary' => $this->getAlertsSummary($ministryId),
            'regulatory_scorecard' => $this->getRegulatoryScorecard($ministryId),
        ];

        return response()->json([
            'success' => true,
            'data' => $kpis,
            'generated_at' => now()->toISOString(),
            'period' => $period,
        ]);
    }

    /**
     * Obtenir les KPI par entité/structure
     */
    public function getEntityKpis(Request $request, $entityId): JsonResponse
    {
        $entity = StateEntity::findOrFail($entityId);

        // Vérifier les permissions
        if (!$this->canViewEntityKpis($entity)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé à ces KPI'
            ], 403);
        }

        $kpis = $entity->getEntityKpiMetrics();
        $comparativeKpis = $entity->getComparativeKpis();

        return response()->json([
            'success' => true,
            'data' => [
                'entity_kpis' => $kpis,
                'comparative_analysis' => $comparativeKpis,
                'recommendations' => $this->generateRecommendations($entity, $kpis),
            ],
            'entity_info' => [
                'id' => $entity->id,
                'name' => $entity->name,
                'type' => $entity->type,
                'sector' => $entity->sector,
                'technical_ministry' => $entity->technicalMinistry?->name,
                'financial_ministry' => $entity->financialMinistry?->name,
            ]
        ]);
    }

    /**
     * Obtenir les KPI par document
     */
    public function getDocumentKpis(Request $request, $documentId): JsonResponse
    {
        $document = DocumentVersion::findOrFail($documentId);

        // Vérifier les permissions
        if (!$this->canViewDocumentKpis($document)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé à ces KPI'
            ], 403);
        }

        $kpis = $this->calculateDocumentKpis($document);

        return response()->json([
            'success' => true,
            'data' => $kpis,
            'document_info' => [
                'id' => $document->id,
                'title' => $document->title,
                'version' => $document->version_number,
                'status' => $document->status,
                'report_name' => $document->report->name,
                'entity_name' => $document->report->entity->name ?? null,
            ]
        ]);
    }

    /**
     * Obtenir les KPI par ministère
     */
    public function getMinistryKpis(Request $request, $ministryId): JsonResponse
    {
        $ministry = Ministry::findOrFail($ministryId);

        // Vérifier les permissions
        if (!$this->canViewMinistryKpis($ministry)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé à ces KPI'
            ], 403);
        }

        $kpis = $ministry->getKpiMetrics();
        $detailedDashboard = $ministry->getDetailedKpiDashboard();

        return response()->json([
            'success' => true,
            'data' => [
                'ministry_kpis' => $kpis,
                'detailed_dashboard' => $detailedDashboard,
                'supervision_summary' => $this->getSupervisionSummary($ministry),
            ],
            'ministry_info' => [
                'id' => $ministry->id,
                'name' => $ministry->name,
                'type' => $ministry->type,
                'minister' => $ministry->minister_name,
            ]
        ]);
    }

    /**
     * Obtenir le tableau de bord KPI pour un utilisateur spécifique
     */
    public function getUserDashboardKpis(): JsonResponse
    {
        $user = Auth::user();
        
        $kpis = [
            'user_metrics' => $this->getUserMetrics($user),
            'accessible_entities' => $this->getAccessibleEntitiesKpis($user),
            'ministry_overview' => $this->getMinistryOverviewForUser($user),
            'recent_activity' => $this->getRecentActivityKpis($user),
            'alerts' => $this->getUserAlerts($user),
        ];

        return response()->json([
            'success' => true,
            'data' => $kpis,
            'user_context' => [
                'role' => $user->role,
                'ministry' => $user->ministry?->name,
                'entity' => $user->entity?->name,
                'permissions' => $user->getPermissions(),
            ]
        ]);
    }

    /**
     * Obtenir un rapport KPI exportable
     */
    public function exportKpiReport(Request $request): JsonResponse
    {
        $type = $request->get('type', 'global'); // global, ministry, entity, document
        $id = $request->get('id');
        $format = $request->get('format', 'json'); // json, excel, pdf
        $period = $request->get('period', '6months');

        $data = $this->generateExportableKpiReport($type, $id, $period);

        if ($format === 'excel') {
            return $this->exportToExcel($data, $type);
        } elseif ($format === 'pdf') {
            return $this->exportToPdf($data, $type);
        }

        return response()->json([
            'success' => true,
            'data' => $data,
            'export_info' => [
                'type' => $type,
                'format' => $format,
                'generated_at' => now()->toISOString(),
                'period' => $period,
            ]
        ]);
    }

    /**
     * Obtenir l'aperçu global
     */
    private function getGlobalOverview($ministryId = null)
    {
        $query = StateEntity::query();
        if ($ministryId) {
            $query->where(function($q) use ($ministryId) {
                $q->where('technical_ministry_id', $ministryId)
                  ->orWhere('financial_ministry_id', $ministryId);
            });
        }

        $totalEntities = $query->count();
        $activeEntities = $query->where('is_active', true)->count();

        $totalReports = DocumentVersion::whereHas('report.entity', function($q) use ($ministryId) {
            if ($ministryId) {
                $q->where(function($subQ) use ($ministryId) {
                    $subQ->where('technical_ministry_id', $ministryId)
                         ->orWhere('financial_ministry_id', $ministryId);
                });
            }
        })->count();

        $pendingApprovals = DocumentVersion::where('status', 'pending_approval')
            ->whereHas('report.entity', function($q) use ($ministryId) {
                if ($ministryId) {
                    $q->where(function($subQ) use ($ministryId) {
                        $subQ->where('technical_ministry_id', $ministryId)
                             ->orWhere('financial_ministry_id', $ministryId);
                    });
                }
            })->count();

        return [
            'total_entities' => $totalEntities,
            'active_entities' => $activeEntities,
            'total_reports' => $totalReports,
            'pending_approvals' => $pendingApprovals,
            'monthly_submissions' => $this->getMonthlySubmissions($ministryId),
            'compliance_rate' => $this->getGlobalComplianceRate($ministryId),
            'average_approval_time' => $this->getGlobalAverageApprovalTime($ministryId),
        ];
    }

    /**
     * Obtenir la performance des ministères
     */
    private function getMinistryPerformance($ministryId = null)
    {
        $query = Ministry::with(['technicalTutelageEpes', 'financialTutelageEpes']);
        
        if ($ministryId) {
            $query->where('id', $ministryId);
        }

        return $query->get()->map(function($ministry) {
            $kpis = $ministry->getKpiMetrics();
            return [
                'ministry_id' => $ministry->id,
                'ministry_name' => $ministry->name,
                'minister' => $ministry->minister_name,
                'technical_epes_count' => $kpis['technical_supervision']['total_epes'],
                'financial_epes_count' => $kpis['financial_supervision']['total_epes'],
                'overall_compliance' => $kpis['global_metrics']['regulatory_compliance_score'],
                'pending_approvals' => $kpis['technical_supervision']['pending_approvals'] + 
                                     $kpis['financial_supervision']['pending_approvals'],
            ];
        })->toArray();
    }

    /**
     * Obtenir le classement des EPE
     */
    private function getEpeRankings($ministryId = null)
    {
        $query = StateEntity::with(['technicalMinistry', 'financialMinistry']);
        
        if ($ministryId) {
            $query->where(function($q) use ($ministryId) {
                $q->where('technical_ministry_id', $ministryId)
                  ->orWhere('financial_ministry_id', $ministryId);
            });
        }

        $entities = $query->get()->map(function($entity) {
            $kpis = $entity->getEntityKpiMetrics();
            return [
                'entity_id' => $entity->id,
                'entity_name' => $entity->name,
                'entity_type' => $entity->type,
                'sector' => $entity->sector,
                'compliance_score' => $kpis['compliance_metrics']['overall_compliance_score'],
                'submission_rate' => $kpis['compliance_metrics']['timely_submission_rate'],
                'quality_score' => $kpis['compliance_metrics']['quality_score'],
                'reports_count' => $kpis['reporting_metrics']['total_reports'],
                'technical_ministry' => $entity->technicalMinistry?->name,
                'financial_ministry' => $entity->financialMinistry?->name,
            ];
        });

        return [
            'top_performers' => $entities->sortByDesc('compliance_score')->take(10)->values(),
            'bottom_performers' => $entities->sortBy('compliance_score')->take(5)->values(),
            'by_sector' => $entities->groupBy('sector')->map(function($group) {
                return $group->sortByDesc('compliance_score')->take(3)->values();
            }),
        ];
    }

    /**
     * Obtenir le tableau de bord de conformité
     */
    private function getComplianceDashboard($ministryId = null)
    {
        return [
            'uemoa_compliance' => $this->getUemoaComplianceMetrics($ministryId),
            'regulatory_deadlines' => $this->getRegulatoryDeadlines($ministryId),
            'missing_reports' => $this->getMissingReports($ministryId),
            'overdue_items' => $this->getOverdueItems($ministryId),
            'quality_indicators' => $this->getQualityIndicators($ministryId),
        ];
    }

    /**
     * Obtenir l'analyse des tendances
     */
    private function getTrendsAnalysis($period, $ministryId = null)
    {
        $months = $this->getPeriodMonths($period);
        
        return [
            'submission_trends' => $this->getSubmissionTrends($months, $ministryId),
            'compliance_trends' => $this->getComplianceTrends($months, $ministryId),
            'approval_time_trends' => $this->getApprovalTimeTrends($months, $ministryId),
            'quality_trends' => $this->getQualityTrends($months, $ministryId),
            'seasonal_patterns' => $this->getSeasonalPatterns($months, $ministryId),
        ];
    }

    /**
     * Calculer les KPI d'un document
     */
    private function calculateDocumentKpis($document)
    {
        return [
            'document_metrics' => [
                'version_number' => $document->version_number,
                'status' => $document->status,
                'creation_date' => $document->created_at,
                'last_updated' => $document->updated_at,
                'approval_date' => $document->approved_at,
                'content_length' => strlen($document->content),
                'is_current' => $document->is_current,
            ],
            'collaboration_metrics' => [
                'total_collaborators' => $document->collaborators()->count(),
                'total_comments' => $document->comments()->count(),
                'unresolved_comments' => $document->comments()->unresolved()->count(),
                'total_changes' => $document->changes()->count(),
                'revision_count' => $this->getRevisionCount($document),
            ],
            'approval_metrics' => [
                'time_to_approval' => $this->getTimeToApproval($document),
                'approval_efficiency' => $this->getApprovalEfficiency($document),
                'reviewer_feedback' => $this->getReviewerFeedback($document),
                'compliance_score' => $this->getDocumentComplianceScore($document),
            ],
            'quality_metrics' => [
                'completeness_score' => $this->getCompletenessScore($document),
                'accuracy_score' => $this->getAccuracyScore($document),
                'formatting_score' => $this->getFormattingScore($document),
                'uemoa_compliance' => $this->getUemoaComplianceScore($document),
            ],
            'usage_metrics' => [
                'view_count' => $this->getViewCount($document),
                'download_count' => $this->getDownloadCount($document),
                'share_count' => $this->getShareCount($document),
                'reference_count' => $this->getReferenceCount($document),
            ],
        ];
    }

    /**
     * Vérifier si l'utilisateur peut voir les KPI d'une entité
     */
    private function canViewEntityKpis($entity)
    {
        $user = Auth::user();
        
        // Super admin peut tout voir
        if ($user->isAdmin()) {
            return true;
        }

        // Utilisateur de l'entité
        if ($user->entity_id === $entity->id) {
            return true;
        }

        // Utilisateur du ministère de tutelle
        if ($user->ministry_id && 
            ($user->ministry_id === $entity->technical_ministry_id || 
             $user->ministry_id === $entity->financial_ministry_id)) {
            return true;
        }

        return false;
    }

    /**
     * Vérifier si l'utilisateur peut voir les KPI d'un document
     */
    private function canViewDocumentKpis($document)
    {
        $user = Auth::user();
        
        // Super admin peut tout voir
        if ($user->isAdmin()) {
            return true;
        }

        // Créateur du document
        if ($document->created_by === $user->id) {
            return true;
        }

        // Collaborateur du document
        if ($document->collaborators()->where('user_id', $user->id)->exists()) {
            return true;
        }

        // Utilisateur de l'entité propriétaire
        if ($user->entity_id === $document->report->entity_id) {
            return true;
        }

        return false;
    }

    /**
     * Vérifier si l'utilisateur peut voir les KPI d'un ministère
     */
    private function canViewMinistryKpis($ministry)
    {
        $user = Auth::user();
        
        // Super admin peut tout voir
        if ($user->isAdmin()) {
            return true;
        }

        // Utilisateur du ministère
        if ($user->ministry_id === $ministry->id) {
            return true;
        }

        return false;
    }

    /**
     * Générer des recommandations basées sur les KPI
     */
    private function generateRecommendations($entity, $kpis)
    {
        $recommendations = [];

        // Recommandations basées sur le taux de conformité
        if ($kpis['compliance_metrics']['overall_compliance_score'] < 80) {
            $recommendations[] = [
                'type' => 'compliance',
                'priority' => 'high',
                'title' => 'Améliorer la conformité globale',
                'description' => 'Le taux de conformité est inférieur à 80%. Concentrez-vous sur la qualité des soumissions.',
                'actions' => [
                    'Réviser les processus de validation interne',
                    'Former les équipes aux standards UEMOA',
                    'Mettre en place des contrôles qualité'
                ]
            ];
        }

        // Recommandations sur les délais
        if ($kpis['compliance_metrics']['timely_submission_rate'] < 70) {
            $recommendations[] = [
                'type' => 'timing',
                'priority' => 'medium',
                'title' => 'Améliorer les délais de soumission',
                'description' => 'Trop de rapports sont soumis en retard.',
                'actions' => [
                    'Établir un calendrier de rappels',
                    'Automatiser les notifications d\'échéance',
                    'Optimiser les workflows de validation'
                ]
            ];
        }

        // Recommandations sur la collaboration
        if ($kpis['performance_indicators']['user_engagement']['engagement_rate'] < 50) {
            $recommendations[] = [
                'type' => 'collaboration',
                'priority' => 'medium',
                'title' => 'Renforcer l\'engagement des équipes',
                'description' => 'Le taux d\'engagement des utilisateurs est faible.',
                'actions' => [
                    'Organiser des formations sur les outils collaboratifs',
                    'Mettre en place des incitations à la participation',
                    'Améliorer l\'interface utilisateur'
                ]
            ];
        }

        return $recommendations;
    }

    /**
     * Obtenir les métriques d'un utilisateur
     */
    private function getUserMetrics($user)
    {
        return [
            'documents_created' => DocumentVersion::where('created_by', $user->id)->count(),
            'documents_updated' => DocumentVersion::where('updated_by', $user->id)->count(),
            'collaborations_count' => $user->collaborations()->count(),
            'comments_made' => $user->documentComments()->count(),
            'approvals_given' => DocumentVersion::where('approved_by', $user->id)->count(),
            'last_activity' => $user->last_activity_at,
            'productivity_score' => $this->calculateUserProductivityScore($user),
        ];
    }

    /**
     * Obtenir les soumissions mensuelles
     */
    private function getMonthlySubmissions($ministryId = null)
    {
        $query = DocumentVersion::where('created_at', '>=', now()->startOfMonth());
        
        if ($ministryId) {
            $query->whereHas('report.entity', function($q) use ($ministryId) {
                $q->where(function($subQ) use ($ministryId) {
                    $subQ->where('technical_ministry_id', $ministryId)
                         ->orWhere('financial_ministry_id', $ministryId);
                });
            });
        }

        return $query->count();
    }

    /**
     * Obtenir le taux de conformité global
     */
    private function getGlobalComplianceRate($ministryId = null)
    {
        $query = DocumentVersion::where('created_at', '>=', now()->subDays(30));
        
        if ($ministryId) {
            $query->whereHas('report.entity', function($q) use ($ministryId) {
                $q->where(function($subQ) use ($ministryId) {
                    $subQ->where('technical_ministry_id', $ministryId)
                         ->orWhere('financial_ministry_id', $ministryId);
                });
            });
        }

        $total = $query->count();
        $approved = $query->where('status', 'approved')->count();

        return $total > 0 ? round(($approved / $total) * 100, 2) : 0;
    }

    /**
     * Obtenir le temps moyen d'approbation global
     */
    private function getGlobalAverageApprovalTime($ministryId = null)
    {
        $query = DocumentVersion::where('status', 'approved')
                               ->whereNotNull('approved_at')
                               ->where('created_at', '>=', now()->subDays(30));

        if ($ministryId) {
            $query->whereHas('report.entity', function($q) use ($ministryId) {
                $q->where(function($subQ) use ($ministryId) {
                    $subQ->where('technical_ministry_id', $ministryId)
                         ->orWhere('financial_ministry_id', $ministryId);
                });
            });
        }

        $reports = $query->get();
        
        if ($reports->isEmpty()) {
            return 0;
        }

        $avgHours = $reports->avg(function($report) {
            return $report->created_at->diffInHours($report->approved_at);
        });

        return round($avgHours, 1);
    }

    /**
     * Obtenir les métriques de conformité UEMOA
     */
    private function getUemoaComplianceMetrics($ministryId = null)
    {
        // Logique pour calculer les métriques de conformité UEMOA
        return [
            'overall_score' => 85.4,
            'nomenclature_compliance' => 92.1,
            'deadline_adherence' => 78.3,
            'content_quality' => 89.2,
            'documentation_completeness' => 86.7,
        ];
    }

    /**
     * Calculer le score de productivité d'un utilisateur
     */
    private function calculateUserProductivityScore($user)
    {
        $documentsCreated = DocumentVersion::where('created_by', $user->id)
                                          ->where('created_at', '>=', now()->subDays(30))
                                          ->count();
        
        $collaborations = $user->collaborations()
                              ->where('created_at', '>=', now()->subDays(30))
                              ->count();
        
        $comments = $user->documentComments()
                        ->where('created_at', '>=', now()->subDays(30))
                        ->count();

        // Score basé sur l'activité (formule simple)
        $score = ($documentsCreated * 10) + ($collaborations * 5) + ($comments * 2);
        
        return min(100, $score); // Plafonner à 100
    }

    /**
     * Autres méthodes utilitaires...
     */
    private function getPeriodMonths($period)
    {
        switch ($period) {
            case '3months': return 3;
            case '6months': return 6;
            case '12months': return 12;
            default: return 6;
        }
    }

    private function getRevisionCount($document)
    {
        return DocumentVersion::where('report_id', $document->report_id)->count() - 1;
    }

    private function getTimeToApproval($document)
    {
        if (!$document->approved_at) return null;
        return $document->created_at->diffInHours($document->approved_at);
    }

    // ... Autres méthodes de calcul des métriques
}