<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'name_fr',
        'name_en',
        'description',
        'description_fr',
        'description_en',
        'price_monthly',
        'price_yearly',
        'price_currency',
        'billing_cycle',
        'max_entities',
        'max_users',
        'max_reports_monthly',
        'max_documents_monthly',
        'max_storage_gb',
        'max_ai_requests_monthly',
        'features',
        'limitations',
        'target_audience',
        'regional_pricing',
        'trial_days',
        'is_popular',
        'is_enterprise',
        'is_government',
        'sort_order',
        'status',
        'metadata',
    ];

    protected $casts = [
        'price_monthly' => 'decimal:2',
        'price_yearly' => 'decimal:2',
        'features' => 'array',
        'limitations' => 'array',
        'target_audience' => 'array',
        'regional_pricing' => 'array',
        'is_popular' => 'boolean',
        'is_enterprise' => 'boolean',
        'is_government' => 'boolean',
        'metadata' => 'array',
    ];

    /**
     * Plans d'abonnement prédéfinis
     */
    const PLAN_CODES = [
        'STARTER' => 'starter',
        'PROFESSIONAL' => 'professional', 
        'ENTERPRISE' => 'enterprise',
        'GOVERNMENT' => 'government',
        'REGIONAL' => 'regional',
        'CUSTOM' => 'custom',
    ];

    /**
     * Cycles de facturation
     */
    const BILLING_CYCLES = [
        'MONTHLY' => 'monthly',
        'YEARLY' => 'yearly',
        'QUARTERLY' => 'quarterly',
        'BIANNUAL' => 'biannual',
    ];

    /**
     * Devises supportées
     */
    const SUPPORTED_CURRENCIES = [
        'XOF' => 'Franc CFA (UEMOA)',
        'XAF' => 'Franc CFA (CEMAC)',
        'USD' => 'Dollar US',
        'EUR' => 'Euro',
        'NGN' => 'Naira Nigerian',
        'KES' => 'Shilling Kenyan',
        'ZAR' => 'Rand Sud-Africain',
        'MAD' => 'Dirham Marocain',
        'EGP' => 'Livre Égyptienne',
        'GHS' => 'Cedi Ghanéen',
    ];

    /**
     * Features disponibles
     */
    const AVAILABLE_FEATURES = [
        // Fonctionnalités de base
        'basic_reporting' => 'Rapports de base',
        'document_generation' => 'Génération de documents',
        'user_management' => 'Gestion des utilisateurs',
        'data_export' => 'Export de données',
        
        // Fonctionnalités avancées
        'advanced_analytics' => 'Analyses avancées',
        'custom_templates' => 'Templates personnalisés',
        'ai_assistance' => 'Assistant IA',
        'automated_scheduling' => 'Planification automatique',
        'email_notifications' => 'Notifications email',
        'api_access' => 'Accès API',
        
        // Fonctionnalités EPE/UEMOA
        'uemoa_compliance' => 'Conformité UEMOA',
        'ohada_templates' => 'Templates OHADA',
        'syscohada_reporting' => 'Rapports SYSCOHADA',
        'multi_currency' => 'Support multi-devises',
        'regional_standards' => 'Standards régionaux',
        
        // Fonctionnalités collaboration
        'document_collaboration' => 'Collaboration documentaire',
        'version_control' => 'Contrôle de versions',
        'online_sessions' => 'Sessions en ligne',
        'e_voting' => 'Vote électronique',
        'real_time_chat' => 'Chat temps réel',
        
        // Fonctionnalités Enterprise
        'sso_integration' => 'Intégration SSO',
        'advanced_security' => 'Sécurité avancée',
        'audit_trail' => 'Piste d\'audit',
        'custom_branding' => 'Marque personnalisée',
        'priority_support' => 'Support prioritaire',
        'dedicated_account_manager' => 'Gestionnaire de compte dédié',
        
        // Fonctionnalités Government
        'multi_ministry_dashboard' => 'Dashboard multi-ministères',
        'compliance_monitoring' => 'Surveillance conformité',
        'budget_tracking' => 'Suivi budgétaire',
        'performance_kpis' => 'KPIs de performance',
        'regulatory_alerts' => 'Alertes réglementaires',
        'government_reporting' => 'Rapports gouvernementaux',
    ];

    /**
     * Relations
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function features(): BelongsToMany
    {
        return $this->belongsToMany(Feature::class, 'plan_features')
                    ->withPivot('limit_value', 'is_unlimited')
                    ->withTimestamps();
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForCountry($query, $countryCode)
    {
        return $query->where(function($q) use ($countryCode) {
            $q->whereNull('regional_pricing')
              ->orWhereJsonContains('regional_pricing', [$countryCode => []]);
        });
    }

    public function scopeGovernment($query)
    {
        return $query->where('is_government', true);
    }

    public function scopeEnterprise($query)
    {
        return $query->where('is_enterprise', true);
    }

    public function scopePopular($query)
    {
        return $query->where('is_popular', true);
    }

    /**
     * Accesseurs
     */
    public function getLocalizedNameAttribute(): string
    {
        $locale = app()->getLocale();
        return $this->{"name_{$locale}"} ?? $this->name;
    }

    public function getLocalizedDescriptionAttribute(): string
    {
        $locale = app()->getLocale();
        return $this->{"description_{$locale}"} ?? $this->description;
    }

    /**
     * Obtient le prix selon la région
     */
    public function getPriceForCountry(string $countryCode, string $cycle = 'monthly'): array
    {
        $priceField = "price_{$cycle}";
        $basePrice = $this->{$priceField};
        $currency = $this->price_currency;

        // Vérifier s'il y a un prix régional spécifique
        if ($this->regional_pricing && isset($this->regional_pricing[$countryCode])) {
            $regionalPrice = $this->regional_pricing[$countryCode];
            
            if (isset($regionalPrice[$cycle])) {
                return [
                    'amount' => $regionalPrice[$cycle],
                    'currency' => $regionalPrice['currency'] ?? $currency,
                    'formatted' => $this->formatPrice($regionalPrice[$cycle], $regionalPrice['currency'] ?? $currency),
                ];
            }
        }

        return [
            'amount' => $basePrice,
            'currency' => $currency,
            'formatted' => $this->formatPrice($basePrice, $currency),
        ];
    }

    /**
     * Calcule le prix avec remise annuelle
     */
    public function getYearlyDiscount(): array
    {
        if (!$this->price_yearly || !$this->price_monthly) {
            return ['discount' => 0, 'percentage' => 0];
        }

        $yearlyEquivalent = $this->price_monthly * 12;
        $discount = $yearlyEquivalent - $this->price_yearly;
        $percentage = round(($discount / $yearlyEquivalent) * 100);

        return [
            'discount' => $discount,
            'percentage' => $percentage,
            'savings' => $this->formatPrice($discount, $this->price_currency),
        ];
    }

    /**
     * Formate le prix selon la devise
     */
    public function formatPrice(float $amount, string $currency): string
    {
        $formatting = [
            'XOF' => ['symbol' => 'FCFA', 'position' => 'after', 'decimals' => 0],
            'XAF' => ['symbol' => 'FCFA', 'position' => 'after', 'decimals' => 0],
            'USD' => ['symbol' => '$', 'position' => 'before', 'decimals' => 2],
            'EUR' => ['symbol' => '€', 'position' => 'after', 'decimals' => 2],
            'NGN' => ['symbol' => '₦', 'position' => 'before', 'decimals' => 2],
            'KES' => ['symbol' => 'KSh', 'position' => 'before', 'decimals' => 2],
            'ZAR' => ['symbol' => 'R', 'position' => 'before', 'decimals' => 2],
            'MAD' => ['symbol' => 'DH', 'position' => 'after', 'decimals' => 2],
            'EGP' => ['symbol' => 'E£', 'position' => 'before', 'decimals' => 2],
            'GHS' => ['symbol' => 'GH₵', 'position' => 'before', 'decimals' => 2],
        ];

        $format = $formatting[$currency] ?? ['symbol' => $currency, 'position' => 'after', 'decimals' => 2];
        $formattedAmount = number_format($amount, $format['decimals'], ',', ' ');

        if ($format['position'] === 'before') {
            return $format['symbol'] . $formattedAmount;
        } else {
            return $formattedAmount . ' ' . $format['symbol'];
        }
    }

    /**
     * Vérifie si une feature est incluse
     */
    public function hasFeature(string $featureCode): bool
    {
        return in_array($featureCode, $this->features ?? []);
    }

    /**
     * Obtient la limite d'une feature
     */
    public function getFeatureLimit(string $featureCode): ?int
    {
        $limitations = $this->limitations ?? [];
        return $limitations[$featureCode] ?? null;
    }

    /**
     * Vérifie si le plan convient à un type d'organisation
     */
    public function isSuitableFor(string $organizationType): bool
    {
        $targetAudience = $this->target_audience ?? [];
        return in_array($organizationType, $targetAudience);
    }

    /**
     * Obtient les plans recommandés selon le pays et type d'organisation
     */
    public static function getRecommendedPlans(string $countryCode, string $organizationType = null): array
    {
        $query = self::active()->orderBy('sort_order');

        // Filtrer par région si applicable
        if ($countryCode) {
            $country = Country::where('code', $countryCode)->first();
            
            if ($country) {
                // Prioriser les plans gouvernementaux pour pays UEMOA/OHADA
                if ($country->is_uemoa_member || $country->is_ohada_member) {
                    $query->where(function($q) {
                        $q->where('is_government', true)
                          ->orWhere('code', 'PROFESSIONAL')
                          ->orWhere('code', 'ENTERPRISE');
                    });
                }
            }
        }

        // Filtrer par type d'organisation
        if ($organizationType) {
            $query->where(function($q) use ($organizationType) {
                $q->whereJsonContains('target_audience', $organizationType)
                  ->orWhereNull('target_audience');
            });
        }

        return $query->get();
    }

    /**
     * Configuration des plans par défaut
     */
    public static function getDefaultPlans(): array
    {
        return [
            [
                'code' => 'starter',
                'name' => 'Starter',
                'name_fr' => 'Démarrage',
                'name_en' => 'Starter',
                'description' => 'Parfait pour les petites structures publiques débutant leur digitalisation',
                'description_fr' => 'Parfait pour les petites structures publiques débutant leur digitalisation',
                'description_en' => 'Perfect for small public entities starting their digitalization',
                'price_monthly' => 15000, // XOF
                'price_yearly' => 150000, // XOF (16% remise)
                'price_currency' => 'XOF',
                'billing_cycle' => 'monthly',
                'max_entities' => 1,
                'max_users' => 5,
                'max_reports_monthly' => 10,
                'max_documents_monthly' => 20,
                'max_storage_gb' => 5,
                'max_ai_requests_monthly' => 50,
                'features' => [
                    'basic_reporting',
                    'document_generation',
                    'user_management',
                    'data_export',
                    'uemoa_compliance',
                    'email_notifications',
                ],
                'target_audience' => ['etablissement_public', 'small_government'],
                'trial_days' => 14,
                'is_popular' => false,
                'sort_order' => 1,
                'status' => 'active',
                'regional_pricing' => [
                    'NG' => ['monthly' => 25, 'yearly' => 250, 'currency' => 'USD'],
                    'KE' => ['monthly' => 2500, 'yearly' => 25000, 'currency' => 'KES'],
                    'ZA' => ['monthly' => 350, 'yearly' => 3500, 'currency' => 'ZAR'],
                    'MA' => ['monthly' => 250, 'yearly' => 2500, 'currency' => 'MAD'],
                ],
            ],

            [
                'code' => 'professional',
                'name' => 'Professional',
                'name_fr' => 'Professionnel',
                'name_en' => 'Professional',
                'description' => 'Pour les EPE de taille moyenne avec besoins avancés de reporting',
                'description_fr' => 'Pour les EPE de taille moyenne avec besoins avancés de reporting',
                'description_en' => 'For medium-sized SOEs with advanced reporting needs',
                'price_monthly' => 35000, // XOF
                'price_yearly' => 350000, // XOF (16% remise)
                'price_currency' => 'XOF',
                'billing_cycle' => 'monthly',
                'max_entities' => 3,
                'max_users' => 25,
                'max_reports_monthly' => 50,
                'max_documents_monthly' => 100,
                'max_storage_gb' => 25,
                'max_ai_requests_monthly' => 200,
                'features' => [
                    'basic_reporting',
                    'advanced_analytics',
                    'document_generation',
                    'custom_templates',
                    'user_management',
                    'data_export',
                    'ai_assistance',
                    'automated_scheduling',
                    'email_notifications',
                    'uemoa_compliance',
                    'ohada_templates',
                    'syscohada_reporting',
                    'multi_currency',
                    'document_collaboration',
                    'version_control',
                ],
                'target_audience' => ['societe_etat', 'etablissement_public', 'medium_government'],
                'trial_days' => 30,
                'is_popular' => true,
                'sort_order' => 2,
                'status' => 'active',
                'regional_pricing' => [
                    'NG' => ['monthly' => 75, 'yearly' => 750, 'currency' => 'USD'],
                    'KE' => ['monthly' => 7500, 'yearly' => 75000, 'currency' => 'KES'],
                    'ZA' => ['monthly' => 1000, 'yearly' => 10000, 'currency' => 'ZAR'],
                    'MA' => ['monthly' => 700, 'yearly' => 7000, 'currency' => 'MAD'],
                ],
            ],

            [
                'code' => 'enterprise',
                'name' => 'Enterprise',
                'name_fr' => 'Entreprise',
                'name_en' => 'Enterprise',
                'description' => 'Solution complète pour grandes EPE avec besoins complexes',
                'description_fr' => 'Solution complète pour grandes EPE avec besoins complexes',
                'description_en' => 'Complete solution for large SOEs with complex needs',
                'price_monthly' => 75000, // XOF
                'price_yearly' => 750000, // XOF (16% remise)
                'price_currency' => 'XOF',
                'billing_cycle' => 'monthly',
                'max_entities' => 10,
                'max_users' => 100,
                'max_reports_monthly' => 200,
                'max_documents_monthly' => 500,
                'max_storage_gb' => 100,
                'max_ai_requests_monthly' => 1000,
                'features' => [
                    'basic_reporting',
                    'advanced_analytics',
                    'document_generation',
                    'custom_templates',
                    'user_management',
                    'data_export',
                    'ai_assistance',
                    'automated_scheduling',
                    'email_notifications',
                    'api_access',
                    'uemoa_compliance',
                    'ohada_templates',
                    'syscohada_reporting',
                    'multi_currency',
                    'regional_standards',
                    'document_collaboration',
                    'version_control',
                    'online_sessions',
                    'e_voting',
                    'real_time_chat',
                    'sso_integration',
                    'advanced_security',
                    'audit_trail',
                    'custom_branding',
                    'priority_support',
                ],
                'target_audience' => ['societe_etat', 'large_enterprise', 'holding'],
                'trial_days' => 30,
                'is_popular' => false,
                'is_enterprise' => true,
                'sort_order' => 3,
                'status' => 'active',
                'regional_pricing' => [
                    'NG' => ['monthly' => 150, 'yearly' => 1500, 'currency' => 'USD'],
                    'KE' => ['monthly' => 15000, 'yearly' => 150000, 'currency' => 'KES'],
                    'ZA' => ['monthly' => 2000, 'yearly' => 20000, 'currency' => 'ZAR'],
                    'MA' => ['monthly' => 1400, 'yearly' => 14000, 'currency' => 'MAD'],
                ],
            ],

            [
                'code' => 'government',
                'name' => 'Government',
                'name_fr' => 'Gouvernement',
                'name_en' => 'Government',
                'description' => 'Solution dédiée aux ministères et institutions gouvernementales',
                'description_fr' => 'Solution dédiée aux ministères et institutions gouvernementales',
                'description_en' => 'Dedicated solution for ministries and government institutions',
                'price_monthly' => 150000, // XOF
                'price_yearly' => 1500000, // XOF (16% remise)
                'price_currency' => 'XOF',
                'billing_cycle' => 'yearly',
                'max_entities' => null, // Illimité
                'max_users' => null, // Illimité
                'max_reports_monthly' => null, // Illimité
                'max_documents_monthly' => null, // Illimité
                'max_storage_gb' => 500,
                'max_ai_requests_monthly' => 5000,
                'features' => [
                    'basic_reporting',
                    'advanced_analytics',
                    'document_generation',
                    'custom_templates',
                    'user_management',
                    'data_export',
                    'ai_assistance',
                    'automated_scheduling',
                    'email_notifications',
                    'api_access',
                    'uemoa_compliance',
                    'ohada_templates',
                    'syscohada_reporting',
                    'multi_currency',
                    'regional_standards',
                    'document_collaboration',
                    'version_control',
                    'online_sessions',
                    'e_voting',
                    'real_time_chat',
                    'sso_integration',
                    'advanced_security',
                    'audit_trail',
                    'custom_branding',
                    'priority_support',
                    'dedicated_account_manager',
                    'multi_ministry_dashboard',
                    'compliance_monitoring',
                    'budget_tracking',
                    'performance_kpis',
                    'regulatory_alerts',
                    'government_reporting',
                ],
                'target_audience' => ['ministry', 'government_agency', 'regulatory_body'],
                'trial_days' => 60,
                'is_popular' => false,
                'is_government' => true,
                'sort_order' => 4,
                'status' => 'active',
                'regional_pricing' => [
                    'NG' => ['monthly' => 400, 'yearly' => 4000, 'currency' => 'USD'],
                    'KE' => ['monthly' => 40000, 'yearly' => 400000, 'currency' => 'KES'],
                    'ZA' => ['monthly' => 5000, 'yearly' => 50000, 'currency' => 'ZAR'],
                    'MA' => ['monthly' => 3500, 'yearly' => 35000, 'currency' => 'MAD'],
                ],
            ],

            [
                'code' => 'regional',
                'name' => 'Regional',
                'name_fr' => 'Régional',
                'name_en' => 'Regional',
                'description' => 'Solution pour organisations régionales UEMOA, CEMAC, OHADA',
                'description_fr' => 'Solution pour organisations régionales UEMOA, CEMAC, OHADA',
                'description_en' => 'Solution for regional organizations WAEMU, CEMAC, OHADA',
                'price_monthly' => 300000, // XOF
                'price_yearly' => 3000000, // XOF (16% remise)
                'price_currency' => 'XOF',
                'billing_cycle' => 'yearly',
                'max_entities' => null, // Illimité
                'max_users' => null, // Illimité
                'max_reports_monthly' => null, // Illimité
                'max_documents_monthly' => null, // Illimité
                'max_storage_gb' => 1000,
                'max_ai_requests_monthly' => 10000,
                'features' => array_keys(self::AVAILABLE_FEATURES), // Toutes les features
                'target_audience' => ['regional_organization', 'international_body', 'development_bank'],
                'trial_days' => 90,
                'is_popular' => false,
                'is_enterprise' => true,
                'is_government' => true,
                'sort_order' => 5,
                'status' => 'active',
                'metadata' => [
                    'custom_deployment' => true,
                    'dedicated_infrastructure' => true,
                    'multi_country_support' => true,
                ],
            ],
        ];
    }
}