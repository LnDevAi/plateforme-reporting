PLATEFORME DE REPORTING - NOTIFICATION
=====================================

{{ $notification->title }}

{{ $notification->message }}

@if($notification->data && count($notification->data) > 0)
DÉTAILS DE LA NOTIFICATION :
----------------------------
@if(isset($data['report_id']))
Rapport : {{ $data['report_id'] }}
@endif
@if(isset($data['execution_id']))
Exécution : #{{ $data['execution_id'] }}
@endif
@if(isset($data['records_count']))
Nombre d'enregistrements : {{ number_format($data['records_count']) }}
@endif
@if(isset($data['execution_time']))
Temps d'exécution : {{ $data['execution_time'] }}s
@endif
@if(isset($data['error_message']))
Message d'erreur : {{ $data['error_message'] }}
@endif
@if(isset($data['file_path']))
Fichier généré : Voir pièce jointe
@endif

@endif
@if($notification->type === 'report_execution_complete')
Lien vers le rapport : {{ config('app.frontend_url') }}/reports/{{ $data['report_id'] ?? '' }}
@elseif($notification->type === 'report_execution_failed')
Lien de diagnostic : {{ config('app.frontend_url') }}/reports/{{ $data['report_id'] ?? '' }}
@elseif($notification->type === 'scheduled_report')
Lien vers la planification : {{ config('app.frontend_url') }}/schedules/{{ $data['schedule_id'] ?? '' }}
@endif

---
Vous recevez cet email car vous êtes inscrit aux notifications de la plateforme de reporting.
Gérer mes préférences : {{ config('app.frontend_url') }}/profile
Envoyé le {{ $notification->created_at->format('d/m/Y à H:i') }}

© {{ date('Y') }} Plateforme de Reporting. Tous droits réservés.