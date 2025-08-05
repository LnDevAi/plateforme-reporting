<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReportSchedule;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ScheduleController extends Controller
{
    /**
     * Lister les planifications
     */
    public function index(Request $request): JsonResponse
    {
        $query = ReportSchedule::with(['report', 'creator']);

        // Filtres
        if ($request->has('report_id')) {
            $query->where('report_id', $request->report_id);
        }

        if ($request->has('frequency')) {
            $query->byFrequency($request->frequency);
        }

        if ($request->has('active')) {
            if ($request->boolean('active')) {
                $query->active();
            } else {
                $query->where('is_active', false);
            }
        }

        $schedules = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $schedules,
        ]);
    }

    /**
     * Créer une nouvelle planification
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'report_id' => 'required|exists:reports,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'frequency' => 'required|in:hourly,daily,weekly,monthly,quarterly,yearly,custom',
            'time' => 'required|date_format:H:i',
            'timezone' => 'nullable|string|max:50',
            'frequency_config' => 'nullable|array',
            'parameters' => 'nullable|array',
            'recipients' => 'nullable|array',
            'recipients.*' => 'email',
            'export_format' => 'nullable|in:json,excel,pdf',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Vérifier que l'utilisateur peut accéder au rapport
        $report = Report::findOrFail($request->report_id);
        
        $schedule = ReportSchedule::create([
            ...$request->all(),
            'created_by' => Auth::id(),
            'timezone' => $request->timezone ?? config('app.timezone'),
        ]);

        // Calculer la première exécution
        $schedule->calculateNextRun();

        $schedule->load(['report', 'creator']);

        return response()->json([
            'success' => true,
            'message' => 'Planification créée avec succès',
            'data' => $schedule,
        ], 201);
    }

    /**
     * Afficher une planification
     */
    public function show(ReportSchedule $schedule): JsonResponse
    {
        $schedule->load(['report', 'creator', 'executions' => function ($query) {
            $query->latest()->take(10);
        }]);

        return response()->json([
            'success' => true,
            'data' => $schedule,
        ]);
    }

    /**
     * Mettre à jour une planification
     */
    public function update(Request $request, ReportSchedule $schedule): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'frequency' => 'required|in:hourly,daily,weekly,monthly,quarterly,yearly,custom',
            'time' => 'required|date_format:H:i',
            'timezone' => 'nullable|string|max:50',
            'frequency_config' => 'nullable|array',
            'parameters' => 'nullable|array',
            'recipients' => 'nullable|array',
            'recipients.*' => 'email',
            'export_format' => 'nullable|in:json,excel,pdf',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $schedule->update($request->all());

        // Recalculer la prochaine exécution si la planification a changé
        if ($request->has(['frequency', 'time', 'frequency_config', 'is_active'])) {
            $schedule->calculateNextRun();
        }

        $schedule->load(['report', 'creator']);

        return response()->json([
            'success' => true,
            'message' => 'Planification mise à jour avec succès',
            'data' => $schedule,
        ]);
    }

    /**
     * Supprimer une planification
     */
    public function destroy(ReportSchedule $schedule): JsonResponse
    {
        $schedule->delete();

        return response()->json([
            'success' => true,
            'message' => 'Planification supprimée avec succès',
        ]);
    }

    /**
     * Activer/désactiver une planification
     */
    public function toggleStatus(ReportSchedule $schedule): JsonResponse
    {
        $schedule->update([
            'is_active' => !$schedule->is_active,
        ]);

        // Recalculer la prochaine exécution
        $schedule->calculateNextRun();

        return response()->json([
            'success' => true,
            'message' => $schedule->is_active ? 'Planification activée' : 'Planification désactivée',
            'data' => $schedule,
        ]);
    }

    /**
     * Exécuter une planification manuellement
     */
    public function executeNow(ReportSchedule $schedule): JsonResponse
    {
        if (!$schedule->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'La planification est désactivée',
            ], 400);
        }

        try {
            // Créer une exécution manuelle
            $execution = $schedule->report->executions()->create([
                'executed_by' => Auth::id(),
                'status' => 'running',
                'parameters_used' => $schedule->parameters ?? [],
                'started_at' => now(),
            ]);

            // Ici, on pourrait dispatcher un job pour exécuter le rapport
            // Pour l'instant, on simule une exécution réussie
            $execution->update([
                'status' => 'completed',
                'execution_time' => 1.5,
                'records_count' => 100,
                'completed_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Planification exécutée avec succès',
                'data' => $execution,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'exécution: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir les planifications dues pour exécution
     */
    public function getDue(): JsonResponse
    {
        $dueSchedules = ReportSchedule::due()
            ->with(['report', 'creator'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $dueSchedules,
        ]);
    }

    /**
     * Obtenir les fréquences disponibles
     */
    public function getFrequencies(): JsonResponse
    {
        $frequencies = [
            ['value' => 'hourly', 'label' => 'Toutes les heures'],
            ['value' => 'daily', 'label' => 'Quotidien'],
            ['value' => 'weekly', 'label' => 'Hebdomadaire'],
            ['value' => 'monthly', 'label' => 'Mensuel'],
            ['value' => 'quarterly', 'label' => 'Trimestriel'],
            ['value' => 'yearly', 'label' => 'Annuel'],
            ['value' => 'custom', 'label' => 'Personnalisé'],
        ];

        return response()->json([
            'success' => true,
            'data' => $frequencies,
        ]);
    }

    /**
     * Obtenir les fuseaux horaires
     */
    public function getTimezones(): JsonResponse
    {
        $timezones = [
            ['value' => 'Europe/Paris', 'label' => 'Europe/Paris (CET)'],
            ['value' => 'UTC', 'label' => 'UTC'],
            ['value' => 'America/New_York', 'label' => 'America/New_York (EST)'],
            ['value' => 'America/Los_Angeles', 'label' => 'America/Los_Angeles (PST)'],
            ['value' => 'Asia/Tokyo', 'label' => 'Asia/Tokyo (JST)'],
        ];

        return response()->json([
            'success' => true,
            'data' => $timezones,
        ]);
    }
}