<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AuthController;

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
});

// Route de test
Route::get('health', function () {
    return response()->json([
        'status' => 'OK',
        'timestamp' => now(),
        'version' => '1.0.0'
    ]);
});