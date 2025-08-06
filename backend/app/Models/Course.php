<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Course extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'title',
        'title_fr',
        'title_en',
        'description',
        'description_fr',
        'description_en',
        'category',
        'level',
        'duration_hours',
        'instructor_name',
        'instructor_bio',
        'instructor_credentials',
        'learning_objectives',
        'prerequisites',
        'target_audience',
        'certification_available',
        'certification_body',
        'certification_validity_months',
        'required_subscription_plans',
        'thumbnail_url',
        'trailer_video_url',
        'tags',
        'regulatory_framework',
        'applicable_countries',
        'language',
        'price',
        'currency',
        'is_featured',
        'is_mandatory',
        'sort_order',
        'status',
        'published_at',
        'metadata',
    ];

    protected $casts = [
        'learning_objectives' => 'array',
        'prerequisites' => 'array',
        'target_audience' => 'array',
        'required_subscription_plans' => 'array',
        'tags' => 'array',
        'regulatory_framework' => 'array',
        'applicable_countries' => 'array',
        'price' => 'decimal:2',
        'is_featured' => 'boolean',
        'is_mandatory' => 'boolean',
        'published_at' => 'datetime',
        'metadata' => 'array',
    ];

    /**
     * Catégories de cours
     */
    const CATEGORIES = [
        'governance' => 'Gouvernance d\'Entreprise',
        'financial_management' => 'Gestion Financière',
        'compliance' => 'Conformité Réglementaire',
        'strategy' => 'Stratégie et Planification',
        'leadership' => 'Leadership et Management',
        'audit' => 'Audit et Contrôle Interne',
        'risk_management' => 'Gestion des Risques',
        'public_policy' => 'Politiques Publiques',
        'digital_transformation' => 'Transformation Digitale',
        'sustainability' => 'Développement Durable',
        'procurement' => 'Passation des Marchés',
        'human_resources' => 'Ressources Humaines',
    ];

    /**
     * Niveaux de difficulté
     */
    const LEVELS = [
        'beginner' => 'Débutant',
        'intermediate' => 'Intermédiaire',
        'advanced' => 'Avancé',
        'expert' => 'Expert',
    ];

    /**
     * Langues disponibles
     */
    const LANGUAGES = [
        'fr' => 'Français',
        'en' => 'Anglais',
        'ar' => 'Arabe',
        'pt' => 'Portugais',
        'es' => 'Espagnol',
    ];

    /**
     * Cadres réglementaires
     */
    const REGULATORY_FRAMEWORKS = [
        'ohada' => 'OHADA',
        'uemoa' => 'UEMOA',
        'cemac' => 'CEMAC',
        'syscohada' => 'SYSCOHADA',
        'ifrs' => 'IFRS',
        'iso' => 'Standards ISO',
        'king_iv' => 'King IV (Afrique du Sud)',
        'oecd' => 'Principes OCDE',
    ];

    /**
     * Organismes de certification
     */
    const CERTIFICATION_BODIES = [
        'ifc_governance' => 'IFC Corporate Governance',
        'african_development_bank' => 'Banque Africaine de Développement',
        'uemoa_commission' => 'Commission UEMOA',
        'ohada_secretariat' => 'Secrétariat Permanent OHADA',
        'institute_directors' => 'Institut des Administrateurs',
        'chartered_governance' => 'Chartered Governance Institute',
        'platform_internal' => 'Plateforme de Reporting EPE (Certification Interne)',
    ];

    /**
     * Relations
     */
    public function modules(): HasMany
    {
        return $this->hasMany(CourseModule::class)->orderBy('sort_order');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(CourseEnrollment::class);
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(CourseCertificate::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(CourseReview::class);
    }

    public function subscriptionPlans(): BelongsToMany
    {
        return $this->belongsToMany(SubscriptionPlan::class, 'course_subscription_plan');
    }

    /**
     * Scopes
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published')
                    ->where('published_at', '<=', now());
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByLevel($query, $level)
    {
        return $query->where('level', $level);
    }

    public function scopeByLanguage($query, $language)
    {
        return $query->where('language', $language);
    }

    public function scopeForCountry($query, $countryCode)
    {
        return $query->where(function($q) use ($countryCode) {
            $q->whereNull('applicable_countries')
              ->orWhereJsonContains('applicable_countries', $countryCode);
        });
    }

    public function scopeForSubscriptionPlan($query, $planCode)
    {
        return $query->where(function($q) use ($planCode) {
            $q->whereNull('required_subscription_plans')
              ->orWhereJsonContains('required_subscription_plans', $planCode);
        });
    }

    public function scopeMandatory($query)
    {
        return $query->where('is_mandatory', true);
    }

    /**
     * Accesseurs
     */
    public function getLocalizedTitleAttribute(): string
    {
        $locale = app()->getLocale();
        return $this->{"title_{$locale}"} ?? $this->title;
    }

    public function getLocalizedDescriptionAttribute(): string
    {
        $locale = app()->getLocale();
        return $this->{"description_{$locale}"} ?? $this->description;
    }

    public function getCategoryLabelAttribute(): string
    {
        return self::CATEGORIES[$this->category] ?? $this->category;
    }

    public function getLevelLabelAttribute(): string
    {
        return self::LEVELS[$this->level] ?? $this->level;
    }

    public function getLanguageLabelAttribute(): string
    {
        return self::LANGUAGES[$this->language] ?? $this->language;
    }

    public function getFormattedPriceAttribute(): string
    {
        if (!$this->price) {
            return 'Gratuit';
        }

        return number_format($this->price, 0, ',', ' ') . ' ' . $this->currency;
    }

    /**
     * Méthodes utilitaires
     */

    /**
     * Vérifie si un utilisateur peut accéder au cours
     */
    public function canBeAccessedBy(User $user): bool
    {
        // Vérifier le statut du cours
        if ($this->status !== 'published' || $this->published_at->isFuture()) {
            return false;
        }

        // Vérifier l'abonnement requis
        if ($this->required_subscription_plans) {
            $userSubscription = CheckSubscription::getUserSubscription($user);
            
            if (!$userSubscription || !$userSubscription->isActive()) {
                return false;
            }

            $planCode = $userSubscription->subscriptionPlan->code;
            
            if (!in_array($planCode, $this->required_subscription_plans)) {
                return false;
            }
        }

        // Vérifier la compatibilité pays
        if ($this->applicable_countries && $user->country) {
            if (!in_array($user->country->code, $this->applicable_countries)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Vérifie si un utilisateur est inscrit au cours
     */
    public function isEnrolledBy(User $user): bool
    {
        return $this->enrollments()
                   ->where('user_id', $user->id)
                   ->where('status', 'active')
                   ->exists();
    }

    /**
     * Obtient le pourcentage de progression d'un utilisateur
     */
    public function getProgressPercentage(User $user): int
    {
        $enrollment = $this->enrollments()
                          ->where('user_id', $user->id)
                          ->first();

        if (!$enrollment) {
            return 0;
        }

        return $enrollment->calculateProgress();
    }

    /**
     * Vérifie si un utilisateur a complété le cours
     */
    public function isCompletedBy(User $user): bool
    {
        return $this->getProgressPercentage($user) === 100;
    }

    /**
     * Vérifie si un utilisateur peut obtenir un certificat
     */
    public function canIssueClaimsrateFor(User $user): bool
    {
        if (!$this->certification_available) {
            return false;
        }

        if (!$this->isCompletedBy($user)) {
            return false;
        }

        // Vérifier si un certificat valide existe déjà
        $existingCertificate = $this->certificates()
                                   ->where('user_id', $user->id)
                                   ->where('status', 'issued')
                                   ->where('expires_at', '>', now())
                                   ->first();

        return !$existingCertificate;
    }

    /**
     * Calcule la note moyenne du cours
     */
    public function getAverageRating(): float
    {
        return $this->reviews()->avg('rating') ?? 0;
    }

    /**
     * Obtient le nombre total d'inscrits
     */
    public function getEnrollmentCount(): int
    {
        return $this->enrollments()->where('status', 'active')->count();
    }

    /**
     * Obtient le taux de completion
     */
    public function getCompletionRate(): float
    {
        $totalEnrollments = $this->getEnrollmentCount();
        
        if ($totalEnrollments === 0) {
            return 0;
        }

        $completedEnrollments = $this->enrollments()
                                    ->where('status', 'completed')
                                    ->count();

        return ($completedEnrollments / $totalEnrollments) * 100;
    }

    /**
     * Obtient les cours recommandés
     */
    public function getRecommendedCourses(int $limit = 5): array
    {
        return self::published()
                   ->where('id', '!=', $this->id)
                   ->where(function($query) {
                       $query->where('category', $this->category)
                             ->orWhere('level', $this->level)
                             ->orWhere('language', $this->language);
                   })
                   ->orderByDesc('is_featured')
                   ->orderBy('sort_order')
                   ->limit($limit)
                   ->get()
                   ->toArray();
    }

    /**
     * Configuration des cours par défaut
     */
    public static function getDefaultCourses(): array
    {
        return [
            [
                'code' => 'GOV_OHADA_FUNDAMENTALS',
                'title' => 'Fondamentaux de la Gouvernance OHADA',
                'title_fr' => 'Fondamentaux de la Gouvernance OHADA',
                'title_en' => 'OHADA Governance Fundamentals',
                'description' => 'Formation complète sur les principes de gouvernance d\'entreprise selon le droit OHADA et les meilleures pratiques internationales.',
                'description_fr' => 'Formation complète sur les principes de gouvernance d\'entreprise selon le droit OHADA et les meilleures pratiques internationales.',
                'description_en' => 'Comprehensive training on corporate governance principles under OHADA law and international best practices.',
                'category' => 'governance',
                'level' => 'intermediate',
                'duration_hours' => 12,
                'instructor_name' => 'Dr. Aminata KONE',
                'instructor_bio' => 'Expert en droit des affaires OHADA, 15 ans d\'expérience en gouvernance d\'entreprise',
                'instructor_credentials' => 'Docteur en Droit, Certified Director (IFC), Expert OHADA',
                'learning_objectives' => [
                    'Maîtriser les principes fondamentaux de la gouvernance OHADA',
                    'Comprendre les rôles et responsabilités du conseil d\'administration',
                    'Appliquer les bonnes pratiques de transparence et de redevabilité',
                    'Gérer les conflits d\'intérêts et les situations délicates'
                ],
                'prerequisites' => [
                    'Expérience minimale en gestion d\'entreprise',
                    'Connaissance de base du droit des sociétés'
                ],
                'target_audience' => [
                    'Administrateurs d\'entreprises publiques',
                    'Directeurs généraux d\'EPE',
                    'Cadres dirigeants',
                    'Représentants des ministères de tutelle'
                ],
                'certification_available' => true,
                'certification_body' => 'platform_internal',
                'certification_validity_months' => 24,
                'required_subscription_plans' => ['professional', 'enterprise', 'government'],
                'tags' => ['OHADA', 'gouvernance', 'administration', 'EPE'],
                'regulatory_framework' => ['ohada', 'syscohada'],
                'applicable_countries' => ['BF', 'BJ', 'CI', 'ML', 'NE', 'SN', 'TG', 'CM', 'GA', 'TD'],
                'language' => 'fr',
                'price' => 0,
                'currency' => 'XOF',
                'is_featured' => true,
                'is_mandatory' => true,
                'sort_order' => 1,
                'status' => 'published',
                'published_at' => now(),
            ],

            [
                'code' => 'FIN_SYSCOHADA_REPORTING',
                'title' => 'Reporting Financier SYSCOHADA pour EPE',
                'title_fr' => 'Reporting Financier SYSCOHADA pour EPE',
                'title_en' => 'SYSCOHADA Financial Reporting for SOEs',
                'description' => 'Maîtrise des obligations de reporting financier selon le SYSCOHADA révisé pour les entreprises publiques.',
                'category' => 'financial_management',
                'level' => 'advanced',
                'duration_hours' => 16,
                'instructor_name' => 'Prof. Moussa TRAORE',
                'instructor_bio' => 'Expert-comptable SYSCOHADA, ancien directeur financier d\'EPE',
                'learning_objectives' => [
                    'Maîtriser le plan comptable SYSCOHADA révisé',
                    'Élaborer les états financiers conformes',
                    'Gérer les spécificités comptables des EPE',
                    'Préparer les rapports de gestion'
                ],
                'certification_available' => true,
                'certification_body' => 'ohada_secretariat',
                'certification_validity_months' => 36,
                'required_subscription_plans' => ['professional', 'enterprise', 'government'],
                'tags' => ['SYSCOHADA', 'comptabilité', 'états financiers', 'reporting'],
                'regulatory_framework' => ['syscohada', 'ohada'],
                'language' => 'fr',
                'is_featured' => true,
                'sort_order' => 2,
                'status' => 'published',
                'published_at' => now(),
            ],

            [
                'code' => 'COMPLIANCE_UEMOA',
                'title' => 'Conformité Réglementaire UEMOA',
                'title_fr' => 'Conformité Réglementaire UEMOA',
                'title_en' => 'WAEMU Regulatory Compliance',
                'description' => 'Formation sur les exigences de conformité des directives UEMOA pour les entreprises publiques.',
                'category' => 'compliance',
                'level' => 'intermediate',
                'duration_hours' => 10,
                'instructor_name' => 'Mme Fatou DIALLO',
                'instructor_bio' => 'Juriste spécialisée en droit communautaire UEMOA',
                'learning_objectives' => [
                    'Comprendre les directives UEMOA applicables',
                    'Mettre en place un système de conformité',
                    'Gérer les obligations de reporting UEMOA',
                    'Prévenir les sanctions réglementaires'
                ],
                'certification_available' => true,
                'certification_body' => 'uemoa_commission',
                'certification_validity_months' => 24,
                'required_subscription_plans' => ['professional', 'enterprise', 'government'],
                'tags' => ['UEMOA', 'conformité', 'réglementation', 'directives'],
                'regulatory_framework' => ['uemoa'],
                'applicable_countries' => ['BF', 'BJ', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG'],
                'language' => 'fr',
                'sort_order' => 3,
                'status' => 'published',
                'published_at' => now(),
            ],

            [
                'code' => 'LEADERSHIP_PUBLIC',
                'title' => 'Leadership et Management Public',
                'title_fr' => 'Leadership et Management Public',
                'title_en' => 'Public Leadership and Management',
                'description' => 'Développement des compétences de leadership pour dirigeants d\'entreprises publiques.',
                'category' => 'leadership',
                'level' => 'advanced',
                'duration_hours' => 14,
                'instructor_name' => 'Dr. Jean-Baptiste OUEDRAOGO',
                'instructor_bio' => 'Coach en leadership, ancien DG d\'EPE, consultant international',
                'learning_objectives' => [
                    'Développer un style de leadership adapté au secteur public',
                    'Gérer les parties prenantes multiples',
                    'Conduire le changement organisationnel',
                    'Optimiser la performance collective'
                ],
                'certification_available' => true,
                'certification_body' => 'institute_directors',
                'certification_validity_months' => 24,
                'required_subscription_plans' => ['enterprise', 'government'],
                'tags' => ['leadership', 'management', 'changement', 'performance'],
                'language' => 'fr',
                'sort_order' => 4,
                'status' => 'published',
                'published_at' => now(),
            ],

            [
                'code' => 'RISK_MANAGEMENT_EPE',
                'title' => 'Gestion des Risques dans les EPE',
                'title_fr' => 'Gestion des Risques dans les EPE',
                'title_en' => 'Risk Management in SOEs',
                'description' => 'Méthodologies de gestion des risques spécifiques aux entreprises publiques africaines.',
                'category' => 'risk_management',
                'level' => 'advanced',
                'duration_hours' => 12,
                'instructor_name' => 'M. Alassane CISSE',
                'instructor_bio' => 'Risk Manager certifié, spécialiste des risques dans le secteur public',
                'learning_objectives' => [
                    'Identifier et évaluer les risques spécifiques aux EPE',
                    'Mettre en place un système de gestion des risques',
                    'Développer des stratégies de mitigation',
                    'Intégrer la gestion des risques à la gouvernance'
                ],
                'certification_available' => true,
                'certification_body' => 'platform_internal',
                'certification_validity_months' => 24,
                'required_subscription_plans' => ['professional', 'enterprise', 'government'],
                'tags' => ['risques', 'évaluation', 'mitigation', 'contrôle'],
                'language' => 'fr',
                'sort_order' => 5,
                'status' => 'published',
                'published_at' => now(),
            ],

            [
                'code' => 'DIGITAL_TRANSFORMATION',
                'title' => 'Transformation Digitale des EPE',
                'title_fr' => 'Transformation Digitale des EPE',
                'title_en' => 'Digital Transformation of SOEs',
                'description' => 'Stratégies et outils pour réussir la transformation digitale des entreprises publiques.',
                'category' => 'digital_transformation',
                'level' => 'intermediate',
                'duration_hours' => 10,
                'instructor_name' => 'Mme Aïcha BARRY',
                'instructor_bio' => 'Consultante en transformation digitale, experte en innovation publique',
                'learning_objectives' => [
                    'Élaborer une stratégie de transformation digitale',
                    'Choisir les technologies appropriées',
                    'Gérer le changement organisationnel',
                    'Mesurer les impacts de la digitalisation'
                ],
                'certification_available' => true,
                'certification_body' => 'platform_internal',
                'certification_validity_months' => 18,
                'required_subscription_plans' => ['professional', 'enterprise', 'government'],
                'tags' => ['digital', 'transformation', 'innovation', 'technologie'],
                'language' => 'fr',
                'sort_order' => 6,
                'status' => 'published',
                'published_at' => now(),
            ],

            [
                'code' => 'PROCUREMENT_PUBLIC',
                'title' => 'Passation des Marchés Publics',
                'title_fr' => 'Passation des Marchés Publics',
                'title_en' => 'Public Procurement',
                'description' => 'Maîtrise des procédures de passation des marchés publics selon les standards UEMOA.',
                'category' => 'procurement',
                'level' => 'intermediate',
                'duration_hours' => 14,
                'instructor_name' => 'M. Ibrahim KONATE',
                'instructor_bio' => 'Expert en marchés publics, consultant UEMOA',
                'learning_objectives' => [
                    'Maîtriser les procédures de passation des marchés',
                    'Assurer la transparence et l\'équité',
                    'Éviter les risques de contentieux',
                    'Optimiser les achats publics'
                ],
                'certification_available' => true,
                'certification_body' => 'uemoa_commission',
                'certification_validity_months' => 24,
                'required_subscription_plans' => ['professional', 'enterprise', 'government'],
                'tags' => ['marchés publics', 'procurement', 'UEMOA', 'transparence'],
                'regulatory_framework' => ['uemoa'],
                'applicable_countries' => ['BF', 'BJ', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG'],
                'language' => 'fr',
                'sort_order' => 7,
                'status' => 'published',
                'published_at' => now(),
            ],

            [
                'code' => 'SUSTAINABILITY_ESG',
                'title' => 'Durabilité et Critères ESG',
                'title_fr' => 'Durabilité et Critères ESG',
                'title_en' => 'Sustainability and ESG Criteria',
                'description' => 'Intégration des critères environnementaux, sociaux et de gouvernance dans la gestion des EPE.',
                'category' => 'sustainability',
                'level' => 'advanced',
                'duration_hours' => 12,
                'instructor_name' => 'Dr. Marie SAWADOGO',
                'instructor_bio' => 'Experte en développement durable, conseillère ESG',
                'learning_objectives' => [
                    'Comprendre les enjeux ESG pour les EPE',
                    'Élaborer une stratégie de durabilité',
                    'Mesurer et reporter les impacts ESG',
                    'Intégrer l\'ESG dans la gouvernance'
                ],
                'certification_available' => true,
                'certification_body' => 'platform_internal',
                'certification_validity_months' => 24,
                'required_subscription_plans' => ['enterprise', 'government'],
                'tags' => ['ESG', 'durabilité', 'environnement', 'social'],
                'language' => 'fr',
                'sort_order' => 8,
                'status' => 'published',
                'published_at' => now(),
            ],
        ];
    }
}