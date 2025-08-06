<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class CourseCertificate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'course_id',
        'user_id',
        'enrollment_id',
        'certificate_number',
        'issued_at',
        'expires_at',
        'issuing_body',
        'issuing_authority',
        'issuing_authority_title',
        'issuing_authority_signature',
        'status',
        'verification_code',
        'verification_url',
        'revoked_at',
        'revocation_reason',
        'final_score',
        'grade',
        'completion_time_hours',
        'certificate_template',
        'generated_pdf_path',
        'blockchain_hash',
        'metadata',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
        'final_score' => 'decimal:2',
        'completion_time_hours' => 'decimal:2',
        'metadata' => 'array',
    ];

    /**
     * Statuts de certificat
     */
    const STATUS_ISSUED = 'issued';
    const STATUS_EXPIRED = 'expired';
    const STATUS_REVOKED = 'revoked';
    const STATUS_SUSPENDED = 'suspended';
    const STATUS_RENEWED = 'renewed';

    const STATUSES = [
        self::STATUS_ISSUED => 'Délivré',
        self::STATUS_EXPIRED => 'Expiré',
        self::STATUS_REVOKED => 'Révoqué',
        self::STATUS_SUSPENDED => 'Suspendu',
        self::STATUS_RENEWED => 'Renouvelé',
    ];

    /**
     * Organismes de délivrance
     */
    const ISSUING_BODIES = [
        'platform_internal' => [
            'name' => 'Plateforme de Reporting EPE',
            'authority' => 'Directeur de la Certification',
            'logo' => '/images/certificates/platform-logo.png',
            'seal' => '/images/certificates/platform-seal.png',
        ],
        'uemoa_commission' => [
            'name' => 'Commission de l\'UEMOA',
            'authority' => 'Président de la Commission',
            'logo' => '/images/certificates/uemoa-logo.png',
            'seal' => '/images/certificates/uemoa-seal.png',
        ],
        'ohada_secretariat' => [
            'name' => 'Secrétariat Permanent OHADA',
            'authority' => 'Secrétaire Permanent',
            'logo' => '/images/certificates/ohada-logo.png',
            'seal' => '/images/certificates/ohada-seal.png',
        ],
        'african_development_bank' => [
            'name' => 'Banque Africaine de Développement',
            'authority' => 'Directeur de la Gouvernance',
            'logo' => '/images/certificates/bad-logo.png',
            'seal' => '/images/certificates/bad-seal.png',
        ],
        'ifc_governance' => [
            'name' => 'IFC Corporate Governance',
            'authority' => 'Program Manager',
            'logo' => '/images/certificates/ifc-logo.png',
            'seal' => '/images/certificates/ifc-seal.png',
        ],
        'institute_directors' => [
            'name' => 'Institut des Administrateurs',
            'authority' => 'Directeur Général',
            'logo' => '/images/certificates/iad-logo.png',
            'seal' => '/images/certificates/iad-seal.png',
        ],
    ];

    /**
     * Grades de certification
     */
    const GRADES = [
        'A+' => ['min_score' => 95, 'label' => 'Excellence', 'color' => '#FFD700'],
        'A' => ['min_score' => 90, 'label' => 'Très Bien', 'color' => '#32CD32'],
        'B+' => ['min_score' => 85, 'label' => 'Bien Plus', 'color' => '#228B22'],
        'B' => ['min_score' => 80, 'label' => 'Bien', 'color' => '#4682B4'],
        'C+' => ['min_score' => 75, 'label' => 'Assez Bien Plus', 'color' => '#4169E1'],
        'C' => ['min_score' => 70, 'label' => 'Assez Bien', 'color' => '#6A5ACD'],
        'D' => ['min_score' => 60, 'label' => 'Passable', 'color' => '#FF8C00'],
        'F' => ['min_score' => 0, 'label' => 'Insuffisant', 'color' => '#DC143C'],
    ];

    /**
     * Relations
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(CourseEnrollment::class);
    }

    /**
     * Scopes
     */
    public function scopeValid($query)
    {
        return $query->where('status', self::STATUS_ISSUED)
                    ->where(function($q) {
                        $q->whereNull('expires_at')
                          ->orWhere('expires_at', '>', now());
                    });
    }

    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<', now())
                    ->where('status', '!=', self::STATUS_REVOKED);
    }

    public function scopeByIssuingBody($query, $body)
    {
        return $query->where('issuing_body', $body);
    }

    /**
     * Accesseurs
     */
    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    public function getIsValidAttribute(): bool
    {
        return $this->status === self::STATUS_ISSUED &&
               ($this->expires_at === null || $this->expires_at->isFuture());
    }

    public function getIsExpiredAttribute(): bool
    {
        return $this->expires_at && $this->expires_at->isPast() && 
               $this->status !== self::STATUS_REVOKED;
    }

    public function getGradeInfoAttribute(): array
    {
        if (!$this->grade) {
            return ['grade' => 'N/A', 'label' => 'Non évalué', 'color' => '#808080'];
        }

        return array_merge(['grade' => $this->grade], self::GRADES[$this->grade] ?? []);
    }

    public function getIssuingBodyInfoAttribute(): array
    {
        return self::ISSUING_BODIES[$this->issuing_body] ?? [
            'name' => $this->issuing_body,
            'authority' => 'Autorité de Certification',
            'logo' => '/images/certificates/default-logo.png',
            'seal' => '/images/certificates/default-seal.png',
        ];
    }

    public function getPublicVerificationUrlAttribute(): string
    {
        return route('certificates.verify', [
            'number' => $this->certificate_number,
            'code' => $this->verification_code
        ]);
    }

    public function getDaysUntilExpiryAttribute(): ?int
    {
        if (!$this->expires_at) {
            return null;
        }

        return max(0, now()->diffInDays($this->expires_at, false));
    }

    /**
     * Méthodes utilitaires
     */

    /**
     * Calcule et assigne une note basée sur le score
     */
    public function calculateGrade(): self
    {
        if (!$this->final_score) {
            return $this;
        }

        foreach (self::GRADES as $grade => $info) {
            if ($this->final_score >= $info['min_score']) {
                $this->update(['grade' => $grade]);
                break;
            }
        }

        return $this;
    }

    /**
     * Révoque le certificat
     */
    public function revoke(string $reason): self
    {
        $this->update([
            'status' => self::STATUS_REVOKED,
            'revoked_at' => now(),
            'revocation_reason' => $reason,
        ]);

        return $this;
    }

    /**
     * Marque le certificat comme expiré
     */
    public function markAsExpired(): self
    {
        if ($this->expires_at && $this->expires_at->isPast()) {
            $this->update(['status' => self::STATUS_EXPIRED]);
        }

        return $this;
    }

    /**
     * Renouvelle le certificat
     */
    public function renew(int $months = null): self
    {
        $months = $months ?? $this->course->certification_validity_months ?? 24;
        
        $this->update([
            'status' => self::STATUS_RENEWED,
            'expires_at' => now()->addMonths($months),
            'verification_code' => $this->generateVerificationCode(),
        ]);

        return $this;
    }

    /**
     * Génère un nouveau code de vérification
     */
    public function generateVerificationCode(): string
    {
        return strtoupper(bin2hex(random_bytes(8)));
    }

    /**
     * Vérifie l'authenticité du certificat
     */
    public static function verify(string $number, string $code): ?self
    {
        return self::where('certificate_number', $number)
                  ->where('verification_code', $code)
                  ->where('status', '!=', self::STATUS_REVOKED)
                  ->first();
    }

    /**
     * Génère le PDF du certificat
     */
    public function generatePDF(): string
    {
        $template = $this->certificate_template ?? 'default';
        $data = $this->getCertificateData();
        
        // Générer le PDF avec une librairie comme TCPDF ou DomPDF
        $pdf = \PDF::loadView("certificates.templates.{$template}", $data);
        
        $filename = "certificate_{$this->certificate_number}.pdf";
        $path = storage_path("app/certificates/{$filename}");
        
        $pdf->save($path);
        
        $this->update(['generated_pdf_path' => "certificates/{$filename}"]);
        
        return $path;
    }

    /**
     * Obtient les données pour la génération du certificat
     */
    protected function getCertificateData(): array
    {
        return [
            'certificate' => $this,
            'course' => $this->course,
            'user' => $this->user,
            'enrollment' => $this->enrollment,
            'issuing_body' => $this->issuing_body_info,
            'grade_info' => $this->grade_info,
            'verification_url' => $this->public_verification_url,
            'qr_code' => $this->generateQRCode(),
            'generated_at' => now(),
        ];
    }

    /**
     * Génère un QR code pour la vérification
     */
    protected function generateQRCode(): string
    {
        // Utiliser une librairie comme SimpleSoftwareIO/simple-qrcode
        return \QrCode::size(100)->generate($this->public_verification_url);
    }

    /**
     * Envoie le certificat par email
     */
    public function sendByEmail(): void
    {
        $pdfPath = $this->generated_pdf_path ? storage_path("app/{$this->generated_pdf_path}") : $this->generatePDF();
        
        \Mail::to($this->user->email)->send(new \App\Mail\CertificateDeliveryMail($this, $pdfPath));
    }

    /**
     * Obtient les statistiques du certificat
     */
    public function getStats(): array
    {
        return [
            'id' => $this->id,
            'number' => $this->certificate_number,
            'course' => [
                'title' => $this->course->localized_title,
                'code' => $this->course->code,
                'duration_hours' => $this->course->duration_hours,
            ],
            'recipient' => [
                'name' => $this->user->name,
                'email' => $this->user->email,
                'organization' => $this->user->organization,
                'position' => $this->user->position,
            ],
            'certification' => [
                'issued_at' => $this->issued_at->toISOString(),
                'expires_at' => $this->expires_at?->toISOString(),
                'is_valid' => $this->is_valid,
                'days_until_expiry' => $this->days_until_expiry,
                'issuing_body' => $this->issuing_body_info['name'],
                'verification_code' => $this->verification_code,
            ],
            'performance' => [
                'final_score' => $this->final_score,
                'grade' => $this->grade_info,
                'completion_time_hours' => $this->completion_time_hours,
            ],
            'verification' => [
                'url' => $this->public_verification_url,
                'blockchain_hash' => $this->blockchain_hash,
            ],
        ];
    }

    /**
     * Enregistre sur la blockchain (optionnel)
     */
    public function storeOnBlockchain(): string
    {
        // Implémentation future pour stockage blockchain
        $hash = hash('sha256', json_encode([
            'certificate_number' => $this->certificate_number,
            'user_id' => $this->user_id,
            'course_id' => $this->course_id,
            'issued_at' => $this->issued_at->timestamp,
            'verification_code' => $this->verification_code,
        ]));
        
        $this->update(['blockchain_hash' => $hash]);
        
        return $hash;
    }

    /**
     * Configuration des templates de certificat par défaut
     */
    public static function getDefaultTemplates(): array
    {
        return [
            'default' => [
                'name' => 'Template Standard',
                'description' => 'Template de base pour tous les certificats',
                'path' => 'certificates.templates.default',
            ],
            'ohada_governance' => [
                'name' => 'Gouvernance OHADA',
                'description' => 'Template spécialisé pour la gouvernance OHADA',
                'path' => 'certificates.templates.ohada_governance',
            ],
            'syscohada_finance' => [
                'name' => 'Finance SYSCOHADA',
                'description' => 'Template pour les certifications financières',
                'path' => 'certificates.templates.syscohada_finance',
            ],
            'uemoa_compliance' => [
                'name' => 'Conformité UEMOA',
                'description' => 'Template pour la conformité UEMOA',
                'path' => 'certificates.templates.uemoa_compliance',
            ],
            'leadership_executive' => [
                'name' => 'Leadership Exécutif',
                'description' => 'Template pour les formations de leadership',
                'path' => 'certificates.templates.leadership_executive',
            ],
        ];
    }
}