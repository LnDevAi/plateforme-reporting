<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Mail\ReportNotificationMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Créer une notification
     */
    public function create(array $data)
    {
        $notification = Notification::create([
            'user_id' => $data['user_id'],
            'type' => $data['type'],
            'title' => $data['title'],
            'message' => $data['message'],
            'data' => $data['data'] ?? [],
            'priority' => $data['priority'] ?? 'normal',
            'related_type' => $data['related_type'] ?? null,
            'related_id' => $data['related_id'] ?? null,
        ]);

        // Envoyer un email si demandé
        if ($data['send_email'] ?? false) {
            $this->sendEmailNotification($notification);
        }

        return $notification;
    }

    /**
     * Créer des notifications pour plusieurs utilisateurs
     */
    public function createForUsers(array $userIds, array $data)
    {
        $notifications = [];

        foreach ($userIds as $userId) {
            $notificationData = array_merge($data, ['user_id' => $userId]);
            $notifications[] = $this->create($notificationData);
        }

        return $notifications;
    }

    /**
     * Notifier la fin d'exécution d'un rapport
     */
    public function notifyReportExecutionComplete($execution)
    {
        $report = $execution->report;
        $executor = $execution->executor;

        $data = [
            'user_id' => $executor->id,
            'type' => 'report_execution_complete',
            'title' => 'Rapport exécuté avec succès',
            'message' => "Le rapport '{$report->name}' a été exécuté avec succès en {$execution->execution_time}s.",
            'data' => [
                'report_id' => $report->id,
                'execution_id' => $execution->id,
                'records_count' => $execution->records_count,
                'execution_time' => $execution->execution_time,
            ],
            'priority' => 'normal',
            'related_type' => 'App\Models\ReportExecution',
            'related_id' => $execution->id,
            'send_email' => $executor->email_notifications ?? true,
        ];

        return $this->create($data);
    }

    /**
     * Notifier l'échec d'exécution d'un rapport
     */
    public function notifyReportExecutionFailed($execution)
    {
        $report = $execution->report;
        $executor = $execution->executor;

        $data = [
            'user_id' => $executor->id,
            'type' => 'report_execution_failed',
            'title' => 'Échec d\'exécution du rapport',
            'message' => "Le rapport '{$report->name}' a échoué lors de l'exécution. Erreur: {$execution->error_message}",
            'data' => [
                'report_id' => $report->id,
                'execution_id' => $execution->id,
                'error_message' => $execution->error_message,
            ],
            'priority' => 'high',
            'related_type' => 'App\Models\ReportExecution',
            'related_id' => $execution->id,
            'send_email' => true, // Toujours envoyer un email pour les erreurs
        ];

        return $this->create($data);
    }

    /**
     * Notifier la création d'un nouveau rapport
     */
    public function notifyNewReport($report)
    {
        // Notifier tous les managers et admins
        $users = User::whereIn('role', ['admin', 'manager'])->get();

        $data = [
            'type' => 'new_report',
            'title' => 'Nouveau rapport créé',
            'message' => "Un nouveau rapport '{$report->name}' a été créé par {$report->creator->name}.",
            'data' => [
                'report_id' => $report->id,
                'creator_name' => $report->creator->name,
                'category' => $report->category,
                'type' => $report->type,
            ],
            'priority' => 'normal',
            'related_type' => 'App\Models\Report',
            'related_id' => $report->id,
            'send_email' => false, // Pas d'email pour les nouvelles créations
        ];

        return $this->createForUsers($users->pluck('id')->toArray(), $data);
    }

    /**
     * Notifier les rapports planifiés
     */
    public function notifyScheduledReportExecuted($schedule, $execution)
    {
        $recipients = $schedule->recipients ?? [];
        
        if (empty($recipients)) {
            return [];
        }

        $report = $schedule->report;
        $data = [
            'type' => 'scheduled_report',
            'title' => 'Rapport planifié exécuté',
            'message' => "Le rapport planifié '{$schedule->name}' a été exécuté automatiquement.",
            'data' => [
                'schedule_id' => $schedule->id,
                'report_id' => $report->id,
                'execution_id' => $execution->id,
                'records_count' => $execution->records_count,
                'execution_time' => $execution->execution_time,
                'file_path' => $execution->file_path,
            ],
            'priority' => 'normal',
            'related_type' => 'App\Models\ReportExecution',
            'related_id' => $execution->id,
            'send_email' => true, // Toujours envoyer pour les rapports planifiés
        ];

        // Convertir les emails en IDs utilisateurs
        $userIds = User::whereIn('email', $recipients)->pluck('id')->toArray();

        return $this->createForUsers($userIds, $data);
    }

    /**
     * Notifier les alertes système
     */
    public function notifySystemAlert($type, $title, $message, $data = [])
    {
        // Notifier tous les admins
        $admins = User::where('role', 'admin')->get();

        $notificationData = [
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'priority' => 'high',
            'send_email' => true,
        ];

        return $this->createForUsers($admins->pluck('id')->toArray(), $notificationData);
    }

    /**
     * Envoyer une notification par email
     */
    public function sendEmailNotification($notification)
    {
        try {
            $user = $notification->user;
            
            if (!$user || !$user->email) {
                Log::warning("Impossible d'envoyer l'email pour la notification {$notification->id}: utilisateur ou email manquant");
                return false;
            }

            Mail::to($user->email)->send(new ReportNotificationMail($notification));
            
            $notification->markAsEmailSent();
            
            Log::info("Email de notification envoyé à {$user->email} pour la notification {$notification->id}");
            
            return true;
        } catch (\Exception $e) {
            Log::error("Erreur lors de l'envoi de l'email pour la notification {$notification->id}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Marquer des notifications comme lues
     */
    public function markAsRead(array $notificationIds, $userId)
    {
        return Notification::whereIn('id', $notificationIds)
                          ->where('user_id', $userId)
                          ->update(['read_at' => now()]);
    }

    /**
     * Marquer toutes les notifications d'un utilisateur comme lues
     */
    public function markAllAsRead($userId)
    {
        return Notification::where('user_id', $userId)
                          ->whereNull('read_at')
                          ->update(['read_at' => now()]);
    }

    /**
     * Supprimer les anciennes notifications
     */
    public function cleanupOldNotifications($days = 30)
    {
        $cutoffDate = now()->subDays($days);
        
        $deleted = Notification::where('created_at', '<', $cutoffDate)
                               ->whereNotNull('read_at')
                               ->delete();

        Log::info("Nettoyage des notifications: {$deleted} notifications supprimées");
        
        return $deleted;
    }

    /**
     * Obtenir les notifications d'un utilisateur
     */
    public function getUserNotifications($userId, $limit = 20)
    {
        return Notification::where('user_id', $userId)
                          ->with('related')
                          ->orderBy('created_at', 'desc')
                          ->limit($limit)
                          ->get();
    }

    /**
     * Obtenir le nombre de notifications non lues
     */
    public function getUnreadCount($userId)
    {
        return Notification::where('user_id', $userId)
                          ->unread()
                          ->count();
    }
}