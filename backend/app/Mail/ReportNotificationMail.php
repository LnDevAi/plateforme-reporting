<?php

namespace App\Mail;

use App\Models\Notification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReportNotificationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $notification;

    /**
     * Create a new message instance.
     */
    public function __construct(Notification $notification)
    {
        $this->notification = $notification;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[Plateforme de Reporting] ' . $this->notification->title,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            html: 'emails.report-notification',
            text: 'emails.report-notification-text',
            with: [
                'notification' => $this->notification,
                'user' => $this->notification->user,
                'data' => $this->notification->data,
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        $attachments = [];

        // Ajouter le fichier de rapport si disponible
        if ($this->notification->type === 'scheduled_report' && 
            isset($this->notification->data['file_path']) &&
            file_exists(storage_path('app/' . $this->notification->data['file_path']))) {
            
            $attachments[] = \Illuminate\Mail\Mailables\Attachment::fromPath(
                storage_path('app/' . $this->notification->data['file_path'])
            );
        }

        return $attachments;
    }
}