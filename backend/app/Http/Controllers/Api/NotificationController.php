<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Obtenir les notifications de l'utilisateur connecté
     */
    public function index(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 20);
        $notifications = $this->notificationService->getUserNotifications(Auth::id(), $limit);

        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }

    /**
     * Obtenir le nombre de notifications non lues
     */
    public function unreadCount(): JsonResponse
    {
        $count = $this->notificationService->getUnreadCount(Auth::id());

        return response()->json([
            'success' => true,
            'data' => ['count' => $count],
        ]);
    }

    /**
     * Marquer des notifications comme lues
     */
    public function markAsRead(Request $request): JsonResponse
    {
        $request->validate([
            'notification_ids' => 'required|array',
            'notification_ids.*' => 'integer|exists:notifications,id',
        ]);

        $updated = $this->notificationService->markAsRead(
            $request->notification_ids,
            Auth::id()
        );

        return response()->json([
            'success' => true,
            'message' => "{$updated} notification(s) marquée(s) comme lue(s)",
            'data' => ['updated_count' => $updated],
        ]);
    }

    /**
     * Marquer toutes les notifications comme lues
     */
    public function markAllAsRead(): JsonResponse
    {
        $updated = $this->notificationService->markAllAsRead(Auth::id());

        return response()->json([
            'success' => true,
            'message' => "Toutes les notifications ont été marquées comme lues",
            'data' => ['updated_count' => $updated],
        ]);
    }

    /**
     * Créer une notification de test (pour les admins)
     */
    public function createTest(Request $request): JsonResponse
    {
        // Vérifier que l'utilisateur est admin
        if (!Auth::user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé',
            ], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'string|max:50',
            'priority' => 'in:low,normal,high',
            'send_email' => 'boolean',
        ]);

        $notification = $this->notificationService->create([
            'user_id' => Auth::id(),
            'type' => $request->get('type', 'test'),
            'title' => $request->title,
            'message' => $request->message,
            'priority' => $request->get('priority', 'normal'),
            'send_email' => $request->get('send_email', false),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notification de test créée',
            'data' => $notification,
        ], 201);
    }
}