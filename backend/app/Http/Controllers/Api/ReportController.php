<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\ReportExecution;
use App\Models\ReportData;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    /**
     * Lister tous les rapports
     */
    public function index(Request $request): JsonResponse
    {
        $query = Report::with(['creator', 'lastExecution']);

        // Filtres
        if ($request->has('category')) {
            $query->byCategory($request->category);
        }

        if ($request->has('type')) {
            $query->byType($request->type);
        }

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        // Recherche
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $reports = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $reports,
        ]);
    }

    /**
     * Créer un nouveau rapport
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:reports',
            'description' => 'nullable|string',
            'type' => 'required|in:table,chart,dashboard,export',
            'category' => 'required|string|max:100',
            'query' => 'required|string',
            'parameters' => 'nullable|array',
            'filters' => 'nullable|array',
            'visualization_config' => 'nullable|array',
            'schedule' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $report = Report::create([
            ...$request->all(),
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        $report->load(['creator', 'updater']);

        return response()->json([
            'success' => true,
            'message' => 'Rapport créé avec succès',
            'data' => $report,
        ], 201);
    }

    /**
     * Afficher un rapport spécifique
     */
    public function show(Report $report): JsonResponse
    {
        $report->load(['creator', 'updater', 'executions' => function ($query) {
            $query->latest()->take(10);
        }]);

        return response()->json([
            'success' => true,
            'data' => $report,
        ]);
    }

    /**
     * Mettre à jour un rapport
     */
    public function update(Request $request, Report $report): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:reports,name,' . $report->id,
            'description' => 'nullable|string',
            'type' => 'required|in:table,chart,dashboard,export',
            'category' => 'required|string|max:100',
            'query' => 'required|string',
            'parameters' => 'nullable|array',
            'filters' => 'nullable|array',
            'visualization_config' => 'nullable|array',
            'schedule' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $report->update([
            ...$request->all(),
            'updated_by' => Auth::id(),
        ]);

        $report->load(['creator', 'updater']);

        return response()->json([
            'success' => true,
            'message' => 'Rapport mis à jour avec succès',
            'data' => $report,
        ]);
    }

    /**
     * Supprimer un rapport
     */
    public function destroy(Report $report): JsonResponse
    {
        $report->delete();

        return response()->json([
            'success' => true,
            'message' => 'Rapport supprimé avec succès',
        ]);
    }

    /**
     * Exécuter un rapport
     */
    public function execute(Request $request, Report $report): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'parameters' => 'nullable|array',
            'format' => 'nullable|in:json,excel,pdf',
            'limit' => 'nullable|integer|min:1|max:10000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Créer une nouvelle exécution
            $execution = ReportExecution::create([
                'report_id' => $report->id,
                'executed_by' => Auth::id(),
                'status' => 'running',
                'parameters_used' => $request->get('parameters', []),
                'started_at' => now(),
            ]);

            $startTime = microtime(true);

            // Construire et exécuter la requête
            $query = $this->buildQuery($report, $request->get('parameters', []));
            $results = DB::select($query);

            $endTime = microtime(true);
            $executionTime = round($endTime - $startTime, 2);

            // Limiter les résultats si nécessaire
            $limit = $request->get('limit', 1000);
            if (count($results) > $limit) {
                $results = array_slice($results, 0, $limit);
            }

            // Stocker les données
            foreach ($results as $index => $row) {
                ReportData::create([
                    'report_id' => $report->id,
                    'execution_id' => $execution->id,
                    'data' => (array) $row,
                    'row_number' => $index + 1,
                ]);
            }

            // Mettre à jour l'exécution
            $execution->update([
                'status' => 'completed',
                'execution_time' => $executionTime,
                'records_count' => count($results),
                'completed_at' => now(),
            ]);

            $format = $request->get('format', 'json');

            if ($format === 'json') {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'execution_id' => $execution->id,
                        'results' => $results,
                        'metadata' => [
                            'total_records' => count($results),
                            'execution_time' => $executionTime,
                            'parameters' => $request->get('parameters', []),
                        ],
                    ],
                ]);
            }

            // Générer un fichier pour export
            return $this->generateExport($execution, $results, $format);

        } catch (\Exception $e) {
            // Mettre à jour l'exécution en cas d'erreur
            if (isset($execution)) {
                $execution->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                    'completed_at' => now(),
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'exécution du rapport',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir l'historique d'exécution d'un rapport
     */
    public function executionHistory(Report $report): JsonResponse
    {
        $executions = $report->executions()
            ->with('executor')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $executions,
        ]);
    }

    /**
     * Obtenir les statistiques d'un rapport
     */
    public function statistics(Report $report): JsonResponse
    {
        $stats = [
            'total_executions' => $report->executions()->count(),
            'successful_executions' => $report->executions()->successful()->count(),
            'failed_executions' => $report->executions()->failed()->count(),
            'average_execution_time' => $report->executions()->successful()->avg('execution_time'),
            'last_execution' => $report->lastExecution,
            'average_records_count' => $report->executions()->successful()->avg('records_count'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Construire la requête SQL avec les paramètres
     */
    private function buildQuery(Report $report, array $parameters): string
    {
        $query = $report->query;

        // Remplacer les paramètres dans la requête
        foreach ($parameters as $key => $value) {
            $placeholder = ":{$key}";
            if (is_string($value)) {
                $value = "'" . addslashes($value) . "'";
            }
            $query = str_replace($placeholder, $value, $query);
        }

        return $query;
    }

    /**
     * Générer un export de fichier
     */
    private function generateExport(ReportExecution $execution, array $results, string $format)
    {
        $filename = "rapport_{$execution->report->name}_{$execution->id}";

        switch ($format) {
            case 'excel':
                // Implémentation pour Excel
                $filePath = "exports/{$filename}.xlsx";
                // Code pour générer le fichier Excel
                break;

            case 'pdf':
                // Implémentation pour PDF
                $filePath = "exports/{$filename}.pdf";
                // Code pour générer le fichier PDF
                break;

            default:
                $filePath = "exports/{$filename}.json";
                break;
        }

        $execution->update([
            'file_path' => $filePath,
            'file_type' => $format,
        ]);

        return response()->download(storage_path("app/{$filePath}"));
    }
}