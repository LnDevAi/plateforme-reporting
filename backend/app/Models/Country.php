<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'name_fr',
        'name_en',
        'capital',
        'currency_code',
        'currency_name',
        'currency_symbol',
        'phone_prefix',
        'flag_emoji',
        'region',
        'sub_region',
        'is_uemoa_member',
        'is_ohada_member',
        'is_ecowas_member',
        'is_cemac_member',
        'accounting_system',
        'fiscal_year_type',
        'official_languages',
        'business_languages',
        'regulatory_framework',
        'compliance_requirements',
        'document_templates',
        'ai_prompt_adaptations',
        'status',
        'metadata',
    ];

    protected $casts = [
        'is_uemoa_member' => 'boolean',
        'is_ohada_member' => 'boolean',
        'is_ecowas_member' => 'boolean',
        'is_cemac_member' => 'boolean',
        'official_languages' => 'array',
        'business_languages' => 'array',
        'regulatory_framework' => 'array',
        'compliance_requirements' => 'array',
        'document_templates' => 'array',
        'ai_prompt_adaptations' => 'array',
        'metadata' => 'array',
    ];

    /**
     * Pays membres de l'UEMOA
     */
    const UEMOA_COUNTRIES = [
        'BJ' => 'Bénin',
        'BF' => 'Burkina Faso',
        'CI' => 'Côte d\'Ivoire',
        'GW' => 'Guinée-Bissau',
        'ML' => 'Mali',
        'NE' => 'Niger',
        'SN' => 'Sénégal',
        'TG' => 'Togo',
    ];

    /**
     * Pays membres de l'OHADA
     */
    const OHADA_COUNTRIES = [
        'BJ' => 'Bénin',
        'BF' => 'Burkina Faso',
        'CM' => 'Cameroun',
        'CF' => 'République Centrafricaine',
        'KM' => 'Comores',
        'CG' => 'République du Congo',
        'CD' => 'République Démocratique du Congo',
        'CI' => 'Côte d\'Ivoire',
        'DJ' => 'Djibouti',
        'GA' => 'Gabon',
        'GN' => 'Guinée',
        'GW' => 'Guinée-Bissau',
        'GQ' => 'Guinée Équatoriale',
        'ML' => 'Mali',
        'NE' => 'Niger',
        'SN' => 'Sénégal',
        'TD' => 'Tchad',
        'TG' => 'Togo',
    ];

    /**
     * Pays membres de la CEMAC
     */
    const CEMAC_COUNTRIES = [
        'CM' => 'Cameroun',
        'CF' => 'République Centrafricaine',
        'TD' => 'Tchad',
        'CG' => 'République du Congo',
        'GQ' => 'Guinée Équatoriale',
        'GA' => 'Gabon',
    ];

    /**
     * Autres pays africains prioritaires
     */
    const OTHER_AFRICAN_COUNTRIES = [
        'DZ' => 'Algérie',
        'AO' => 'Angola',
        'BW' => 'Botswana',
        'BI' => 'Burundi',
        'CV' => 'Cap-Vert',
        'EG' => 'Égypte',
        'ET' => 'Éthiopie',
        'GH' => 'Ghana',
        'KE' => 'Kenya',
        'LR' => 'Libéria',
        'LY' => 'Libye',
        'MG' => 'Madagascar',
        'MW' => 'Malawi',
        'MU' => 'Maurice',
        'MA' => 'Maroc',
        'MZ' => 'Mozambique',
        'NA' => 'Namibie',
        'NG' => 'Nigeria',
        'RW' => 'Rwanda',
        'ST' => 'São Tomé-et-Principe',
        'ZA' => 'Afrique du Sud',
        'SS' => 'Soudan du Sud',
        'SD' => 'Soudan',
        'TZ' => 'Tanzanie',
        'TN' => 'Tunisie',
        'UG' => 'Ouganda',
        'ZM' => 'Zambie',
        'ZW' => 'Zimbabwe',
    ];

    /**
     * Systèmes comptables par région
     */
    const ACCOUNTING_SYSTEMS = [
        'SYSCOHADA' => 'Système Comptable OHADA',
        'SYSCEBNAC' => 'Système Comptable CEMAC', 
        'IFRS' => 'International Financial Reporting Standards',
        'LOCAL' => 'Standards Comptables Locaux',
        'MIXED' => 'Système Mixte',
    ];

    /**
     * Relations
     */
    public function stateEntities(): HasMany
    {
        return $this->hasMany(StateEntity::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function ministries(): HasMany
    {
        return $this->hasMany(Ministry::class);
    }

    /**
     * Scopes
     */
    public function scopeUemoaMembers($query)
    {
        return $query->where('is_uemoa_member', true);
    }

    public function scopeOhadaMembers($query)
    {
        return $query->where('is_ohada_member', true);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByRegion($query, $region)
    {
        return $query->where('region', $region);
    }

    /**
     * Méthodes utilitaires
     */
    public function getFullNameAttribute(): string
    {
        return $this->flag_emoji . ' ' . $this->name;
    }

    public function getCurrencyDisplayAttribute(): string
    {
        return "{$this->currency_name} ({$this->currency_code})";
    }

    public function getRegionalMembershipsAttribute(): array
    {
        $memberships = [];
        
        if ($this->is_uemoa_member) $memberships[] = 'UEMOA';
        if ($this->is_ohada_member) $memberships[] = 'OHADA';
        if ($this->is_ecowas_member) $memberships[] = 'CEDEAO';
        if ($this->is_cemac_member) $memberships[] = 'CEMAC';
        
        return $memberships;
    }

    /**
     * Obtient le système comptable applicable
     */
    public function getApplicableAccountingSystem(): string
    {
        if ($this->is_ohada_member) {
            return $this->is_cemac_member ? 'SYSCEBNAC' : 'SYSCOHADA';
        }
        
        return $this->accounting_system ?? 'IFRS';
    }

    /**
     * Obtient les exigences de conformité spécifiques
     */
    public function getComplianceRequirements(): array
    {
        $requirements = $this->compliance_requirements ?? [];
        
        // Ajouter les exigences régionales
        if ($this->is_uemoa_member) {
            $requirements = array_merge($requirements, [
                'Directives UEMOA sur la surveillance multilatérale',
                'Code des marchés publics UEMOA',
                'Réglementation bancaire BCEAO',
            ]);
        }
        
        if ($this->is_ohada_member) {
            $requirements = array_merge($requirements, [
                'Actes uniformes OHADA',
                'Droit des sociétés commerciales OHADA',
                'Procédures simplifiées de recouvrement',
            ]);
        }
        
        if ($this->is_cemac_member) {
            $requirements = array_merge($requirements, [
                'Réglementation BEAC',
                'Code des investissements CEMAC',
                'Harmonisation fiscale CEMAC',
            ]);
        }
        
        return array_unique($requirements);
    }

    /**
     * Obtient les templates de documents disponibles
     */
    public function getAvailableDocumentTemplates(): array
    {
        $templates = $this->document_templates ?? [];
        
        // Ajouter les templates régionaux
        if ($this->is_uemoa_member) {
            $templates = array_merge($templates, [
                'plan_passation_marches_uemoa',
                'rapport_conformite_uemoa',
                'nomenclature_budgetaire_uemoa',
            ]);
        }
        
        if ($this->is_ohada_member) {
            $templates = array_merge($templates, [
                'etats_financiers_syscohada',
                'rapport_gestion_ohada',
                'pv_assemblee_generale_ohada',
            ]);
        }
        
        return array_unique($templates);
    }

    /**
     * Obtient les adaptations IA pour le pays
     */
    public function getAIPromptAdaptations(): array
    {
        $adaptations = $this->ai_prompt_adaptations ?? [];
        
        // Adaptations de base
        $baseAdaptations = [
            'country' => $this->name,
            'currency' => $this->currency_code,
            'languages' => $this->business_languages,
            'accounting_system' => $this->getApplicableAccountingSystem(),
            'regulatory_framework' => $this->getComplianceRequirements(),
        ];
        
        return array_merge($baseAdaptations, $adaptations);
    }

    /**
     * Vérifie si le pays utilise le SYSCOHADA
     */
    public function usesSyscohadaAttribute(): bool
    {
        return $this->is_ohada_member && !$this->is_cemac_member;
    }

    /**
     * Vérifie si le pays utilise le SYSCEBNAC
     */
    public function usesSyscebnacAttribute(): bool
    {
        return $this->is_cemac_member;
    }

    /**
     * Obtient la devise locale formatée
     */
    public function formatCurrency(float $amount): string
    {
        $symbol = $this->currency_symbol ?? $this->currency_code;
        return number_format($amount, 0, ',', ' ') . ' ' . $symbol;
    }

    /**
     * Obtient les langues d'affaires principales
     */
    public function getPrimaryBusinessLanguage(): string
    {
        $languages = $this->business_languages ?? $this->official_languages ?? ['fr'];
        return $languages[0] ?? 'fr';
    }

    /**
     * Vérifie si le pays supporte une langue
     */
    public function supportsLanguage(string $language): bool
    {
        $allLanguages = array_merge(
            $this->official_languages ?? [],
            $this->business_languages ?? []
        );
        
        return in_array($language, $allLanguages);
    }

    /**
     * Obtient les types d'entités publiques selon le pays
     */
    public function getPublicEntityTypes(): array
    {
        if ($this->is_uemoa_member || $this->is_ohada_member) {
            return [
                'SOCIETE_ETAT' => 'Société d\'État',
                'ETABLISSEMENT_PUBLIC' => 'Établissement Public',
                'ENTREPRISE_PUBLIQUE' => 'Entreprise Publique',
                'AUTORITE_ADMINISTRATIVE' => 'Autorité Administrative',
                'AUTRES' => 'Autres Structures Publiques',
            ];
        }
        
        // Types génériques pour autres pays
        return [
            'STATE_OWNED_ENTERPRISE' => 'State-Owned Enterprise',
            'PUBLIC_INSTITUTION' => 'Public Institution',
            'GOVERNMENT_AGENCY' => 'Government Agency',
            'PARASTATAL' => 'Parastatal Organization',
            'OTHERS' => 'Other Public Entities',
        ];
    }

    /**
     * Configuration de l'année fiscale selon le pays
     */
    public function getFiscalYearConfiguration(): array
    {
        return [
            'type' => $this->fiscal_year_type ?? 'calendar',
            'start_month' => $this->metadata['fiscal_start_month'] ?? 1,
            'end_month' => $this->metadata['fiscal_end_month'] ?? 12,
            'current_year' => date('Y'),
        ];
    }
}