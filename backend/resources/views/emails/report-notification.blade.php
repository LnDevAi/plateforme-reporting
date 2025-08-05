<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $notification->title }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #1890ff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #1890ff;
            margin-bottom: 10px;
        }
        .notification-title {
            font-size: 20px;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
        }
        .notification-message {
            font-size: 16px;
            color: #666;
            margin-bottom: 20px;
            line-height: 1.8;
        }
        .notification-data {
            background-color: #f8f9fa;
            border-left: 4px solid #1890ff;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .notification-data h4 {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 14px;
            font-weight: 600;
        }
        .notification-data p {
            margin: 5px 0;
            font-size: 14px;
            color: #666;
        }
        .priority-high {
            border-left-color: #ff4d4f;
        }
        .priority-normal {
            border-left-color: #1890ff;
        }
        .priority-low {
            border-left-color: #52c41a;
        }
        .button {
            display: inline-block;
            background-color: #1890ff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #0070f3;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
        }
        .status-success {
            color: #52c41a;
            font-weight: 600;
        }
        .status-error {
            color: #ff4d4f;
            font-weight: 600;
        }
        .status-warning {
            color: #faad14;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📊 Plateforme de Reporting</div>
            <div style="color: #666; font-size: 14px;">Notification automatique</div>
        </div>

        <div class="notification-title">
            @if($notification->priority === 'high')
                🔴
            @elseif($notification->priority === 'low')
                🟢
            @else
                🔵
            @endif
            {{ $notification->title }}
        </div>

        <div class="notification-message">
            {{ $notification->message }}
        </div>

        @if($notification->data && count($notification->data) > 0)
            <div class="notification-data priority-{{ $notification->priority }}">
                <h4>📋 Détails de la notification</h4>
                
                @if(isset($data['report_id']))
                    <p><strong>Rapport :</strong> {{ $data['report_id'] }}</p>
                @endif
                
                @if(isset($data['execution_id']))
                    <p><strong>Exécution :</strong> #{{ $data['execution_id'] }}</p>
                @endif
                
                @if(isset($data['records_count']))
                    <p><strong>Nombre d'enregistrements :</strong> {{ number_format($data['records_count']) }}</p>
                @endif
                
                @if(isset($data['execution_time']))
                    <p><strong>Temps d'exécution :</strong> {{ $data['execution_time'] }}s</p>
                @endif
                
                @if(isset($data['error_message']))
                    <p><strong>Message d'erreur :</strong> <span class="status-error">{{ $data['error_message'] }}</span></p>
                @endif
                
                @if(isset($data['file_path']))
                    <p><strong>Fichier généré :</strong> ✅ Voir pièce jointe</p>
                @endif
            </div>
        @endif

        @if($notification->type === 'report_execution_complete')
            <div style="text-align: center;">
                <a href="{{ config('app.frontend_url') }}/reports/{{ $data['report_id'] ?? '' }}" class="button">
                    📊 Voir le rapport
                </a>
            </div>
        @elseif($notification->type === 'report_execution_failed')
            <div style="text-align: center;">
                <a href="{{ config('app.frontend_url') }}/reports/{{ $data['report_id'] ?? '' }}" class="button" style="background-color: #ff4d4f;">
                    🔍 Diagnostiquer l'erreur
                </a>
            </div>
        @elseif($notification->type === 'scheduled_report')
            <div style="text-align: center;">
                <a href="{{ config('app.frontend_url') }}/schedules/{{ $data['schedule_id'] ?? '' }}" class="button">
                    ⏰ Voir la planification
                </a>
            </div>
        @endif

        <div class="footer">
            <p>📧 Vous recevez cet email car vous êtes inscrit aux notifications de la plateforme de reporting.</p>
            <p>⚙️ <a href="{{ config('app.frontend_url') }}/profile">Gérer mes préférences de notification</a></p>
            <p>🕐 Envoyé le {{ $notification->created_at->format('d/m/Y à H:i') }}</p>
            <p style="margin-top: 15px; color: #ccc;">
                © {{ date('Y') }} Plateforme de Reporting. Tous droits réservés.
            </p>
        </div>
    </div>
</body>
</html>