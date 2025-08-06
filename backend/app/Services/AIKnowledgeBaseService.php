<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class AIKnowledgeBaseService
{
    protected $knowledgeCache = [];
    
    /**
     * Base de connaissances OHADA
     */
    public function getOhadaKnowledge(): array
    {
        return Cache::remember('ai_knowledge_ohada', 3600, function() {
            return [
                'general' => [
                    'definition' => 'L\'OHADA (Organisation pour l\'Harmonisation en Afrique du Droit des Affaires) est une organisation internationale créée par le Traité de Port-Louis le 17 octobre 1993.',
                    'objectives' => [
                        'Harmoniser le droit des affaires dans les États-Parties',
                        'Sécuriser juridiquement les activités économiques',
                        'Encourager l\'investissement et faciliter les échanges',
                        'Former et informer les auxiliaires de justice'
                    ],
                    'member_countries' => [
                        'Bénin', 'Burkina Faso', 'Cameroun', 'République Centrafricaine',
                        'Comores', 'Congo', 'République Démocratique du Congo', 'Côte d\'Ivoire',
                        'Djibouti', 'Gabon', 'Guinée', 'Guinée-Bissau', 'Guinée Équatoriale',
                        'Mali', 'Niger', 'Sénégal', 'Tchad', 'Togo'
                    ]
                ],
                'uniform_acts' => [
                    'companies' => [
                        'title' => 'Acte uniforme relatif au droit des sociétés commerciales et du GIE',
                        'key_provisions' => [
                            'Constitution des sociétés commerciales',
                            'Fonctionnement du conseil d\'administration',
                            'Assemblées générales et prise de décisions',
                            'Modification du capital social',
                            'Transformation, fusion, scission',
                            'Dissolution et liquidation'
                        ],
                        'governance_requirements' => [
                            'Conseil d\'administration minimum 3 membres',
                            'Réunion CA au moins 2 fois par an',
                            'Assemblée générale annuelle obligatoire',
                            'Commissaires aux comptes pour certaines sociétés',
                            'Publication des comptes annuels'
                        ]
                    ],
                    'accounting' => [
                        'title' => 'Acte uniforme portant organisation et harmonisation des comptabilités des entreprises',
                        'systems' => [
                            'SYSCOHADA' => 'Système Comptable OHADA (pays non-CEMAC)',
                            'SYSCEBNAC' => 'Système Comptable CEMAC (pays CEMAC)'
                        ],
                        'financial_statements' => [
                            'Bilan', 'Compte de résultat', 'Tableau financier des ressources et emplois (TAFIRE)',
                            'État annexé', 'État supplémentaire statistique'
                        ]
                    ],
                    'simplified_procedures' => [
                        'title' => 'Acte uniforme portant organisation des procédures simplifiées',
                        'scope' => 'Procédures de recouvrement et d\'exécution',
                        'key_features' => [
                            'Injonction de payer', 'Saisie-attribution', 'Saisie-vente',
                            'Procédures collectives simplifiées'
                        ]
                    ]
                ],
                'epe_specificities' => [
                    'governance' => [
                        'Conseil d\'administration renforcé avec représentants de l\'État',
                        'Contrôle a priori pour certaines décisions stratégiques',
                        'Rapport annuel de gestion obligatoire',
                        'Audit externe obligatoire',
                        'Transparence accrue dans la gestion'
                    ],
                    'financial_reporting' => [
                        'États financiers selon SYSCOHADA/SYSCEBNAC',
                        'Rapport d\'activité annuel',
                        'Tableau de bord de gestion trimestriel',
                        'Reporting spécifique au ministère de tutelle'
                    ]
                ]
            ];
        });
    }

    /**
     * Base de connaissances UEMOA
     */
    public function getUemoaKnowledge(): array
    {
        return Cache::remember('ai_knowledge_uemoa', 3600, function() {
            return [
                'general' => [
                    'definition' => 'L\'Union Économique et Monétaire Ouest Africaine (UEMOA) est une organisation d\'intégration économique créée le 10 janvier 1994.',
                    'objectives' => [
                        'Réaliser l\'intégration économique des États membres',
                        'Harmoniser les politiques économiques',
                        'Créer un marché commun',
                        'Coordonner les politiques sectorielles'
                    ],
                    'member_countries' => [
                        'Bénin', 'Burkina Faso', 'Côte d\'Ivoire', 'Guinée-Bissau',
                        'Mali', 'Niger', 'Sénégal', 'Togo'
                    ],
                    'currency' => 'Franc CFA (XOF)',
                    'central_bank' => 'BCEAO (Banque Centrale des États de l\'Afrique de l\'Ouest)'
                ],
                'directives' => [
                    'multilateral_surveillance' => [
                        'title' => 'Directive relative à la surveillance multilatérale',
                        'convergence_criteria' => [
                            'Solde budgétaire de base ≥ -3% du PIB',
                            'Taux d\'inflation annuel ≤ 3%',
                            'Encours de la dette publique ≤ 70% du PIB',
                            'Arriérés de paiement : non accumulation'
                        ],
                        'secondary_criteria' => [
                            'Masse salariale/recettes fiscales ≤ 35%',
                            'Investissements publics/recettes fiscales ≥ 20%',
                            'Solde extérieur courant hors dons ≥ -5% du PIB',
                            'Taux de pression fiscale ≥ 17%'
                        ]
                    ],
                    'public_procurement' => [
                        'title' => 'Directive relative aux marchés publics',
                        'principles' => [
                            'Liberté d\'accès à la commande publique',
                            'Égalité de traitement des candidats',
                            'Transparence des procédures'
                        ],
                        'thresholds' => [
                            'Fournitures et services < 15M FCFA : procédure de gré à gré',
                            'Travaux < 30M FCFA : procédure de gré à gré',
                            'Au-delà : procédures formelles obligatoires'
                        ]
                    ],
                    'public_finance' => [
                        'title' => 'Directive relative aux lois de finances',
                        'budget_principles' => [
                            'Annualité', 'Unité', 'Universalité', 'Spécialité',
                            'Sincérité', 'Transparence'
                        ],
                        'reporting_requirements' => [
                            'Loi de finances initiale',
                            'Lois de finances rectificatives',
                            'Loi de règlement',
                            'Rapports d\'exécution trimestriels'
                        ]
                    ]
                ],
                'epe_obligations' => [
                    'reporting' => [
                        'Plan stratégique triennal',
                        'Budget annuel et plans d\'investissement',
                        'Rapports d\'activité trimestriels',
                        'États financiers annuels audités',
                        'Indicateurs de performance'
                    ],
                    'governance' => [
                        'Conseil d\'administration conforme aux standards',
                        'Audit interne et externe',
                        'Gestion des risques',
                        'Transparence et publication d\'informations'
                    ]
                ]
            ];
        });
    }

    /**
     * Base de connaissances SYSCOHADA/SYSCEBNAC
     */
    public function getSyscohadaKnowledge(): array
    {
        return Cache::remember('ai_knowledge_syscohada', 3600, function() {
            return [
                'general' => [
                    'syscohada' => [
                        'definition' => 'Système Comptable OHADA pour les pays non-CEMAC',
                        'applicable_countries' => [
                            'Bénin', 'Burkina Faso', 'Côte d\'Ivoire', 'Guinée-Bissau',
                            'Mali', 'Niger', 'Sénégal', 'Togo', 'Guinée'
                        ]
                    ],
                    'syscebnac' => [
                        'definition' => 'Système Comptable de la BEAC pour les pays CEMAC',
                        'applicable_countries' => [
                            'Cameroun', 'République Centrafricaine', 'Tchad',
                            'République du Congo', 'Guinée Équatoriale', 'Gabon'
                        ]
                    ]
                ],
                'accounting_framework' => [
                    'chart_of_accounts' => [
                        'class_1' => 'Comptes de ressources durables',
                        'class_2' => 'Comptes d\'actif immobilisé',
                        'class_3' => 'Comptes de stocks',
                        'class_4' => 'Comptes de tiers',
                        'class_5' => 'Comptes de trésorerie',
                        'class_6' => 'Comptes de charges des activités ordinaires',
                        'class_7' => 'Comptes de produits des activités ordinaires',
                        'class_8' => 'Comptes des autres charges et des autres produits',
                        'class_9' => 'Comptes des engagements hors bilan et comptes de la comptabilité analytique'
                    ],
                    'financial_statements' => [
                        'bilan' => [
                            'description' => 'Présentation de la situation patrimoniale',
                            'sections' => ['Actif immobilisé', 'Actif circulant', 'Capitaux propres', 'Dettes financières', 'Passif circulant']
                        ],
                        'compte_resultat' => [
                            'description' => 'Présentation de la performance',
                            'sections' => ['Activités ordinaires', 'Activités financières', 'Éléments extraordinaires']
                        ],
                        'tafire' => [
                            'description' => 'Tableau Financier des Ressources et Emplois',
                            'purpose' => 'Analyse des flux de trésorerie'
                        ],
                        'etat_annexe' => [
                            'description' => 'Notes explicatives aux états financiers',
                            'content' => ['Méthodes comptables', 'Détails des postes', 'Engagements hors bilan']
                        ]
                    ]
                ],
                'epe_adaptations' => [
                    'specific_accounts' => [
                        'Subventions d\'investissement reçues',
                        'Dotations en capital de l\'État',
                        'Provisions pour missions de service public',
                        'Résultat sous contrôle de l\'État'
                    ],
                    'reporting_specificities' => [
                        'Compte d\'emploi des ressources publiques',
                        'État de suivi des recommandations d\'audit',
                        'Tableau de bord de gestion par activité',
                        'Indicateurs de performance sociale et environnementale'
                    ]
                ]
            ];
        });
    }

    /**
     * Base de connaissances Gouvernance EPE
     */
    public function getGovernanceKnowledge(): array
    {
        return Cache::remember('ai_knowledge_governance', 3600, function() {
            return [
                'principles' => [
                    'transparency' => [
                        'definition' => 'Obligation de rendre compte de manière claire et accessible',
                        'applications' => [
                            'Publication des états financiers',
                            'Communication sur la stratégie',
                            'Divulgation des rémunérations des dirigeants',
                            'Rapport sur les parties liées'
                        ]
                    ],
                    'accountability' => [
                        'definition' => 'Responsabilité devant les parties prenantes',
                        'mechanisms' => [
                            'Assemblées générales',
                            'Rapports annuels',
                            'Audit externe',
                            'Contrôle parlementaire'
                        ]
                    ],
                    'responsibility' => [
                        'definition' => 'Prise en compte des impacts sociaux et environnementaux',
                        'aspects' => [
                            'Responsabilité sociale d\'entreprise',
                            'Développement durable',
                            'Éthique des affaires',
                            'Gouvernement d\'entreprise'
                        ]
                    ],
                    'fairness' => [
                        'definition' => 'Traitement équitable de toutes les parties prenantes',
                        'applications' => [
                            'Droits des actionnaires minoritaires',
                            'Égalité de traitement',
                            'Procédures équitables',
                            'Absence de conflits d\'intérêts'
                        ]
                    ]
                ],
                'board_governance' => [
                    'composition' => [
                        'minimum_members' => 3,
                        'independence' => 'Au moins 1/3 d\'administrateurs indépendants recommandé',
                        'diversity' => 'Diversité de compétences, genre et expérience',
                        'competencies' => [
                            'Expertise financière',
                            'Connaissance du secteur',
                            'Expérience de gouvernance',
                            'Compétences juridiques'
                        ]
                    ],
                    'responsibilities' => [
                        'strategic' => [
                            'Définition de la stratégie',
                            'Approbation du budget',
                            'Suivi de la performance',
                            'Gestion des risques majeurs'
                        ],
                        'oversight' => [
                            'Supervision de la direction',
                            'Contrôle de l\'audit',
                            'Conformité réglementaire',
                            'Éthique et intégrité'
                        ],
                        'stakeholder' => [
                            'Relation avec l\'État actionnaire',
                            'Dialogue avec les partenaires sociaux',
                            'Communication externe',
                            'Responsabilité sociétale'
                        ]
                    ],
                    'meetings' => [
                        'frequency' => 'Minimum 4 fois par an',
                        'preparation' => 'Documents envoyés 5 jours avant',
                        'quorum' => 'Majorité des membres',
                        'minutes' => 'Procès-verbaux obligatoires'
                    ]
                ],
                'committees' => [
                    'audit' => [
                        'purpose' => 'Supervision de l\'audit et du contrôle interne',
                        'composition' => 'Majorité d\'indépendants',
                        'responsibilities' => [
                            'Supervision des auditeurs externes',
                            'Examen des états financiers',
                            'Évaluation du contrôle interne',
                            'Suivi des recommandations'
                        ]
                    ],
                    'compensation' => [
                        'purpose' => 'Politique de rémunération des dirigeants',
                        'responsibilities' => [
                            'Définition de la politique de rémunération',
                            'Évaluation de la performance',
                            'Approbation des packages',
                            'Transparence des rémunérations'
                        ]
                    ],
                    'risk' => [
                        'purpose' => 'Supervision de la gestion des risques',
                        'responsibilities' => [
                            'Politique de gestion des risques',
                            'Surveillance des risques majeurs',
                            'Évaluation des systèmes de contrôle',
                            'Reporting au conseil'
                        ]
                    ]
                ]
            ];
        });
    }

    /**
     * Obtient des conseils pratiques selon le contexte
     */
    public function getContextualAdvice(string $domain, array $context): array
    {
        switch ($domain) {
            case 'governance':
                return $this->getGovernanceAdvice($context);
            case 'financial_reporting':
                return $this->getFinancialReportingAdvice($context);
            case 'compliance':
                return $this->getComplianceAdvice($context);
            case 'risk_management':
                return $this->getRiskManagementAdvice($context);
            default:
                return [];
        }
    }

    protected function getGovernanceAdvice(array $context): array
    {
        $advice = [];
        
        if ($context['country']['is_ohada_member'] ?? false) {
            $advice[] = "Assurez-vous que votre conseil d'administration respecte les exigences OHADA : minimum 3 membres, réunions au moins 2 fois par an.";
            $advice[] = "Préparez l'assemblée générale annuelle obligatoire selon l'Acte uniforme sur les sociétés commerciales.";
        }
        
        if ($context['entity']['type'] ?? '' === 'SOCIETE_ETAT') {
            $advice[] = "En tant que société d'État, mettez en place un comité d'audit avec majorité d'indépendants.";
            $advice[] = "Publiez un rapport annuel de gouvernance détaillant les pratiques mises en œuvre.";
        }
        
        return $advice;
    }

    protected function getFinancialReportingAdvice(array $context): array
    {
        $advice = [];
        
        $accountingSystem = $context['country']['accounting_system'] ?? '';
        
        if ($accountingSystem === 'SYSCOHADA') {
            $advice[] = "Préparez vos états financiers selon le SYSCOHADA : Bilan, Compte de résultat, TAFIRE, État annexé.";
            $advice[] = "Respectez le plan comptable SYSCOHADA pour la classification de vos comptes.";
        } elseif ($accountingSystem === 'SYSCEBNAC') {
            $advice[] = "Utilisez le référentiel SYSCEBNAC adapté aux pays CEMAC.";
            $advice[] = "Tenez compte des spécificités de la BEAC pour vos reportings.";
        }
        
        if ($context['country']['is_uemoa_member'] ?? false) {
            $advice[] = "Respectez les critères de convergence UEMOA dans vos reportings financiers.";
        }
        
        return $advice;
    }

    protected function getComplianceAdvice(array $context): array
    {
        $advice = [];
        
        if ($context['country']['is_uemoa_member'] ?? false) {
            $advice[] = "Respectez les directives UEMOA sur la surveillance multilatérale.";
            $advice[] = "Appliquez le code des marchés publics UEMOA pour vos procédures d'achat.";
        }
        
        if ($context['country']['is_ohada_member'] ?? false) {
            $advice[] = "Conformez-vous aux Actes uniformes OHADA applicables à votre secteur.";
        }
        
        return $advice;
    }

    protected function getRiskManagementAdvice(array $context): array
    {
        return [
            "Mettez en place un comité des risques au niveau du conseil d'administration.",
            "Développez une cartographie des risques spécifique aux EPE africaines.",
            "Intégrez la gestion des risques ESG dans votre stratégie.",
            "Assurez un reporting régulier des risques aux organes de gouvernance."
        ];
    }

    /**
     * Recherche dans la base de connaissances
     */
    public function search(string $query, array $context = []): array
    {
        $results = [];
        $query = strtolower($query);
        
        // Recherche dans les différentes bases
        $knowledge = [
            'ohada' => $this->getOhadaKnowledge(),
            'uemoa' => $this->getUemoaKnowledge(),
            'syscohada' => $this->getSyscohadaKnowledge(),
            'governance' => $this->getGovernanceKnowledge()
        ];
        
        foreach ($knowledge as $domain => $data) {
            $matches = $this->searchInArray($data, $query);
            if (!empty($matches)) {
                $results[$domain] = $matches;
            }
        }
        
        return $results;
    }

    private function searchInArray(array $data, string $query): array
    {
        $results = [];
        
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $subResults = $this->searchInArray($value, $query);
                if (!empty($subResults)) {
                    $results[$key] = $subResults;
                }
            } elseif (is_string($value) && stripos($value, $query) !== false) {
                $results[$key] = $value;
            }
        }
        
        return $results;
    }
}