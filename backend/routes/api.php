<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\DocumentCollaborationController;
use App\Http\Controllers\Api\KpiController;
use App\Http\Controllers\DocumentTemplateController;
use App\Http\Controllers\AIWritingAssistantController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Routes publiques (authentification)
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('user', [AuthController::class, 'user'])->middleware('auth:sanctum');
});

// Routes protégées
Route::middleware('auth:sanctum')->group(function () {
    
    // Dashboard et statistiques
    Route::prefix('dashboard')->group(function () {
        Route::get('stats', [DashboardController::class, 'stats']);
        Route::get('recent-executions', [DashboardController::class, 'recentExecutions']);
        Route::get('popular-reports', [DashboardController::class, 'popularReports']);
        Route::get('execution-charts', [DashboardController::class, 'executionCharts']);
        Route::get('performance-metrics', [DashboardController::class, 'performanceMetrics']);
        Route::get('user-activity', [DashboardController::class, 'userActivity']);
        Route::get('alerts', [DashboardController::class, 'alerts']);
    });

    // Gestion des rapports
    Route::prefix('reports')->group(function () {
        // CRUD des rapports
        Route::get('/', [ReportController::class, 'index']);
        Route::post('/', [ReportController::class, 'store']);
        Route::get('{report}', [ReportController::class, 'show']);
        Route::put('{report}', [ReportController::class, 'update']);
        Route::delete('{report}', [ReportController::class, 'destroy']);
        
        // Exécution et statistiques
        Route::post('{report}/execute', [ReportController::class, 'execute']);
        Route::get('{report}/executions', [ReportController::class, 'executionHistory']);
        Route::get('{report}/statistics', [ReportController::class, 'statistics']);
        
        // Export et téléchargement
        Route::get('{report}/export/{format}', [ReportController::class, 'export']);
        Route::get('executions/{execution}/download', [ReportController::class, 'downloadExecution']);
    });

    // Gestion des notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/mark-as-read', [NotificationController::class, 'markAsRead']);
        Route::post('/mark-all-as-read', [NotificationController::class, 'markAllAsRead']);
        Route::post('/test', [NotificationController::class, 'createTest']);
    });

    // Gestion des planifications
    Route::prefix('schedules')->group(function () {
        Route::get('/', [ScheduleController::class, 'index']);
        Route::post('/', [ScheduleController::class, 'store']);
        Route::get('/due', [ScheduleController::class, 'getDue']);
        Route::get('/frequencies', [ScheduleController::class, 'getFrequencies']);
        Route::get('/timezones', [ScheduleController::class, 'getTimezones']);
        Route::get('{schedule}', [ScheduleController::class, 'show']);
        Route::put('{schedule}', [ScheduleController::class, 'update']);
        Route::delete('{schedule}', [ScheduleController::class, 'destroy']);
        Route::put('{schedule}/toggle-status', [ScheduleController::class, 'toggleStatus']);
        Route::post('{schedule}/execute-now', [ScheduleController::class, 'executeNow']);
    });

    // Collaboration documentaire
    Route::prefix('documents')->group(function () {
        // Gestion des versions
        Route::get('/{reportId}/current', [DocumentCollaborationController::class, 'getCurrentVersion']);
        Route::get('/{reportId}/versions', [DocumentCollaborationController::class, 'getVersionHistory']);
        Route::post('/{reportId}/versions', [DocumentCollaborationController::class, 'createVersion']);
        
        // Édition de contenu
        Route::put('/versions/{versionId}/content', [DocumentCollaborationController::class, 'updateContent']);
        Route::post('/versions/{versionId}/lock', [DocumentCollaborationController::class, 'lockDocument']);
        Route::delete('/versions/{versionId}/lock', [DocumentCollaborationController::class, 'unlockDocument']);
        
        // Gestion des collaborateurs
        Route::post('/versions/{versionId}/collaborators', [DocumentCollaborationController::class, 'addCollaborator']);
        Route::put('/versions/{versionId}/collaborators/{userId}', [DocumentCollaborationController::class, 'updateCollaboratorPermissions']);
        Route::delete('/versions/{versionId}/collaborators/{userId}', [DocumentCollaborationController::class, 'removeCollaborator']);
        
        // Commentaires
        Route::get('/versions/{versionId}/comments', [DocumentCollaborationController::class, 'getComments']);
        Route::post('/versions/{versionId}/comments', [DocumentCollaborationController::class, 'addComment']);
        Route::put('/comments/{commentId}/resolve', [DocumentCollaborationController::class, 'resolveComment']);
        
        // Workflow d'approbation
        Route::post('/versions/{versionId}/submit-approval', [DocumentCollaborationController::class, 'submitForApproval']);
        Route::post('/versions/{versionId}/approve', [DocumentCollaborationController::class, 'approveDocument']);
        Route::post('/versions/{versionId}/reject', [DocumentCollaborationController::class, 'rejectDocument']);
        
        // Historique et traçabilité
        Route::get('/versions/{versionId}/changes', [DocumentCollaborationController::class, 'getChangeHistory']);
    });

    // KPI et analytics multi-niveaux
    Route::prefix('kpis')->group(function () {
        // KPI globaux (super-administrateurs/ministères)
        Route::get('/global', [KpiController::class, 'getGlobalKpis']);
        
        // KPI par entité/structure
        Route::get('/entities/{entityId}', [KpiController::class, 'getEntityKpis']);
        
        // KPI par document
        Route::get('/documents/{documentId}', [KpiController::class, 'getDocumentKpis']);
        
        // KPI par ministère
        Route::get('/ministries/{ministryId}', [KpiController::class, 'getMinistryKpis']);
        
        // Tableau de bord utilisateur
        Route::get('/dashboard', [KpiController::class, 'getUserDashboardKpis']);
        
        // Export de rapports KPI
        Route::post('/export', [KpiController::class, 'exportKpiReport']);
    });

    // Gestion des utilisateurs (pour les admins)
    Route::middleware('admin')->prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('{user}', [UserController::class, 'show']);
        Route::put('{user}', [UserController::class, 'update']);
        Route::delete('{user}', [UserController::class, 'destroy']);
        Route::put('{user}/toggle-status', [UserController::class, 'toggleStatus']);
    });

    // Métadonnées et configuration
    Route::prefix('meta')->group(function () {
        Route::get('categories', function () {
            return response()->json([
                'success' => true,
                'data' => [
                    'Financier', 'RH', 'Ventes', 'Marketing', 
                    'Production', 'Logistique', 'Qualité', 'Technique'
                ]
            ]);
        });
        
        Route::get('report-types', function () {
            return response()->json([
                'success' => true,
                'data' => [
                    ['value' => 'table', 'label' => 'Tableau'],
                    ['value' => 'chart', 'label' => 'Graphique'],
                    ['value' => 'dashboard', 'label' => 'Tableau de bord'],
                    ['value' => 'export', 'label' => 'Export']
                ]
            ]);
        });
        
        Route::get('departments', function () {
            return response()->json([
                'success' => true,
                'data' => [
                    'Direction', 'Finance', 'Ressources Humaines', 
                    'Commercial', 'Marketing', 'Production', 
                    'Logistique', 'Qualité', 'IT'
                ]
            ]);
        });
    });

    // Document Templates - Routes pour la gestion des modèles EPE
    Route::prefix('document-templates')->group(function () {
        // Liste et catégories
        Route::get('/', [DocumentTemplateController::class, 'index']);
        Route::get('/categories', [DocumentTemplateController::class, 'categories']);
        Route::get('/statistics', [DocumentTemplateController::class, 'statistics']);
        
        // Templates spécifiques
        Route::get('/{templateKey}', [DocumentTemplateController::class, 'show']);
        
        // Génération de documents
        Route::post('/generate', [DocumentTemplateController::class, 'generate']);
        Route::post('/generate-custom', [DocumentTemplateController::class, 'generateCustom']);
        Route::post('/preview', [DocumentTemplateController::class, 'preview']);
        
        // Validation
        Route::post('/validate', [DocumentTemplateController::class, 'validate']);
    });

    // Templates pour entités spécifiques
    Route::get('state-entities/{entity}/templates', [DocumentTemplateController::class, 'forEntity']);

    // Téléchargement de documents générés
    Route::get('documents/download', [DocumentTemplateController::class, 'download'])->name('documents.download');

    // AI Writing Assistant - Assistant IA pour la rédaction
    Route::prefix('ai-assistant')->group(function () {
        // Génération de contenu
        Route::post('/generate-content', [AIWritingAssistantController::class, 'generateContent']);
        Route::post('/improve-content', [AIWritingAssistantController::class, 'improveContent']);
        Route::post('/adaptive-content', [AIWritingAssistantController::class, 'generateAdaptiveContent']);
        
        // Suggestions et aide
        Route::post('/suggestions', [AIWritingAssistantController::class, 'getSuggestions']);
        Route::post('/executive-summary', [AIWritingAssistantController::class, 'generateExecutiveSummary']);
        
        // Analyse et conformité
        Route::post('/analyze-compliance', [AIWritingAssistantController::class, 'analyzeCompliance']);
        
        // Configuration et test
        Route::get('/contexts', [AIWritingAssistantController::class, 'getDocumentContexts']);
        Route::get('/test-connectivity', [AIWritingAssistantController::class, 'testAIConnectivity']);
    });
});

// Route de test
Route::get('health', function () {
    return response()->json([
        'status' => 'OK',
        'timestamp' => now(),
        'version' => '1.0.0'
    ]);
});