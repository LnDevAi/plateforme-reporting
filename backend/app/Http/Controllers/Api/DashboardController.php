<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\ReportExecution;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Obtenir les statistiques générales du tableau de bord
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total_reports' => Report::count(),
            'active_reports' => Report::active()->count(),
            'total_executions' => ReportExecution::count(),
            'executions_today' => ReportExecution::whereDate('created_at', today())->count(),
            'successful_executions' => ReportExecution::successful()->count(),
            'failed_executions' => ReportExecution::failed()->count(),
            'total_users' => User::count(),
            'active_users' => User::where('is_active', true)->count(),
        ];

        // Calculer le taux de réussite
        $stats['success_rate'] = $stats['total_executions'] > 0 
            ? round(($stats['successful_executions'] / $stats['total_executions']) * 100, 2)
            : 0;

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Obtenir les exécutions récentes
     */
    public function recentExecutions(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 10);

        $executions = ReportExecution::with(['report', 'executor'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $executions,
        ]);
    }

    /**
     * Obtenir les rapports les plus populaires
     */
    public function popularReports(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 10);

        $reports = Report::select('reports.*')
            ->selectRaw('COUNT(report_executions.id) as execution_count')
            ->leftJoin('report_executions', 'reports.id', '=', 'report_executions.report_id')
            ->with(['creator', 'lastExecution'])
            ->groupBy('reports.id')
            ->orderBy('execution_count', 'desc')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $reports,
        ]);
    }

    /**
     * Obtenir les données pour les graphiques d'exécution
     */
    public function executionCharts(Request $request): JsonResponse
    {
        $period = $request->get('period', '7days'); // 7days, 30days, 90days

        $days = match($period) {
            '7days' => 7,
            '30days' => 30,
            '90days' => 90,
            default => 7,
        };

        // Exécutions par jour
        $executionsByDay = ReportExecution::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as successful'),
                DB::raw('SUM(CASE WHEN status = "failed" THEN 1 ELSE 0 END) as failed')
            )
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Exécutions par catégorie de rapport
        $executionsByCategory = Report::select(
                'category',
                DB::raw('COUNT(report_executions.id) as execution_count')
            )
            ->leftJoin('report_executions', 'reports.id', '=', 'report_executions.report_id')
            ->where('report_executions.created_at', '>=', now()->subDays($days))
            ->groupBy('category')
            ->orderBy('execution_count', 'desc')
            ->get();

        // Temps d'exécution moyen par type de rapport
        $averageExecutionTime = Report::select(
                'type',
                DB::raw('AVG(report_executions.execution_time) as avg_time')
            )
            ->leftJoin('report_executions', 'reports.id', '=', 'report_executions.report_id')
            ->where('report_executions.status', 'completed')
            ->where('report_executions.created_at', '>=', now()->subDays($days))
            ->groupBy('type')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'executions_by_day' => $executionsByDay,
                'executions_by_category' => $executionsByCategory,
                'average_execution_time' => $averageExecutionTime,
                'period' => $period,
            ],
        ]);
    }

    /**
     * Obtenir les métriques de performance
     */
    public function performanceMetrics(): JsonResponse
    {
        // Temps d'exécution moyen global
        $avgExecutionTime = ReportExecution::successful()
            ->avg('execution_time');

        // Nombre moyen d'enregistrements par rapport
        $avgRecordsCount = ReportExecution::successful()
            ->avg('records_count');

        // Top 5 des rapports les plus lents
        $slowestReports = ReportExecution::select(
                'report_executions.report_id',
                'reports.name',
                DB::raw('AVG(report_executions.execution_time) as avg_time')
            )
            ->join('reports', 'report_executions.report_id', '=', 'reports.id')
            ->where('report_executions.status', 'completed')
            ->groupBy('report_executions.report_id', 'reports.name')
            ->orderBy('avg_time', 'desc')
            ->limit(5)
            ->get();

        // Top 5 des rapports avec le plus d'erreurs
        $errorProneReports = ReportExecution::select(
                'report_executions.report_id',
                'reports.name',
                DB::raw('COUNT(*) as error_count')
            )
            ->join('reports', 'report_executions.report_id', '=', 'reports.id')
            ->where('report_executions.status', 'failed')
            ->groupBy('report_executions.report_id', 'reports.name')
            ->orderBy('error_count', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'average_execution_time' => round($avgExecutionTime, 2),
                'average_records_count' => round($avgRecordsCount),
                'slowest_reports' => $slowestReports,
                'error_prone_reports' => $errorProneReports,
            ],
        ]);
    }

    /**
     * Obtenir l'activité des utilisateurs
     */
    public function userActivity(Request $request): JsonResponse
    {
        $period = $request->get('period', '30days');
        $days = match($period) {
            '7days' => 7,
            '30days' => 30,
            '90days' => 90,
            default => 30,
        };

        // Utilisateurs les plus actifs
        $activeUsers = User::select(
                'users.id',
                'users.name',
                'users.email',
                DB::raw('COUNT(report_executions.id) as execution_count')
            )
            ->leftJoin('report_executions', 'users.id', '=', 'report_executions.executed_by')
            ->where('report_executions.created_at', '>=', now()->subDays($days))
            ->groupBy('users.id', 'users.name', 'users.email')
            ->orderBy('execution_count', 'desc')
            ->limit(10)
            ->get();

        // Activité par département
        $departmentActivity = User::select(
                'department',
                DB::raw('COUNT(DISTINCT users.id) as user_count'),
                DB::raw('COUNT(report_executions.id) as execution_count')
            )
            ->leftJoin('report_executions', 'users.id', '=', 'report_executions.executed_by')
            ->where('report_executions.created_at', '>=', now()->subDays($days))
            ->whereNotNull('department')
            ->groupBy('department')
            ->orderBy('execution_count', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'active_users' => $activeUsers,
                'department_activity' => $departmentActivity,
                'period' => $period,
            ],
        ]);
    }

    /**
     * Obtenir les alertes et notifications
     */
    public function alerts(): JsonResponse
    {
        $alerts = [];

        // Rapports avec beaucoup d'échecs récents
        $failingReports = Report::select(
                'reports.id',
                'reports.name',
                DB::raw('COUNT(report_executions.id) as failed_count')
            )
            ->join('report_executions', 'reports.id', '=', 'report_executions.report_id')
            ->where('report_executions.status', 'failed')
            ->where('report_executions.created_at', '>=', now()->subDays(7))
            ->groupBy('reports.id', 'reports.name')
            ->having('failed_count', '>=', 3)
            ->get();

        foreach ($failingReports as $report) {
            $alerts[] = [
                'type' => 'error',
                'title' => 'Rapport en échec répété',
                'message' => "Le rapport '{$report->name}' a échoué {$report->failed_count} fois dans les 7 derniers jours",
                'report_id' => $report->id,
            ];
        }

        // Rapports lents
        $slowReports = ReportExecution::select(
                'reports.id',
                'reports.name',
                DB::raw('AVG(report_executions.execution_time) as avg_time')
            )
            ->join('reports', 'report_executions.report_id', '=', 'reports.id')
            ->where('report_executions.status', 'completed')
            ->where('report_executions.created_at', '>=', now()->subDays(7))
            ->groupBy('reports.id', 'reports.name')
            ->having('avg_time', '>', 60) // Plus de 60 secondes
            ->get();

        foreach ($slowReports as $report) {
            $alerts[] = [
                'type' => 'warning',
                'title' => 'Rapport lent',
                'message' => "Le rapport '{$report->name}' prend en moyenne {$report->avg_time} secondes à s'exécuter",
                'report_id' => $report->id,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $alerts,
        ]);
    }
}