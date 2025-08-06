<?php

namespace App\Services;

use App\Models\StateEntity;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AIWritingAssistantService
{
    protected $apiKey;
    protected $baseUrl;
    protected $model;

    public function __construct()
    {
        $this->apiKey = config('services.openai.api_key');
        $this->baseUrl = config('services.openai.base_url', 'https://api.openai.com/v1');
        $this->model = config('services.openai.model', 'gpt-4');
    }

    /**
     * Contextes spécialisés pour les documents EPE
     */
    const DOCUMENT_CONTEXTS = [
        'budget_annuel_societe_etat' => [
            'expertise' => 'Expert-comptable spécialisé SYSCOHADA et finance d\'entreprise publique',
            'framework' => 'SYSCOHADA révisé 2019, Code des sociétés commerciales du Burkina Faso',
            'tone' => 'Professionnel, technique, conforme aux standards comptables',
            'focus' => 'Prévisions budgétaires, analyse financière, performance économique',
        ],
        'etats_financiers_syscohada' => [
            'expertise' => 'Commissaire aux comptes certifié SYSCOHADA',
            'framework' => 'Plan comptable SYSCOHADA, normes IAS/IFRS adaptées',
            'tone' => 'Rigoureux, factuel, conforme aux principes comptables',
            'focus' => 'Transparence financière, conformité comptable, audit',
        ],
        'rapport_gestion_ca' => [
            'expertise' => 'Directeur général expérimenté en gouvernance d\'entreprise publique',
            'framework' => 'Principes de gouvernance OHADA, best practices administratives',
            'tone' => 'Stratégique, analytique, orienté résultats',
            'focus' => 'Performance opérationnelle, stratégie, gouvernance',
        ],
        'plan_passation_marches' => [
            'expertise' => 'Spécialiste marchés publics et réglementation UEMOA',
            'framework' => 'Code des marchés publics, directives UEMOA sur la commande publique',
            'tone' => 'Réglementaire, précis, transparent',
            'focus' => 'Conformité réglementaire, procédures, transparence',
        ],
        'inventaire_patrimoine' => [
            'expertise' => 'Comptable des matières et gestionnaire de patrimoine public',
            'framework' => 'Comptabilité des matières, gestion patrimoniale publique',
            'tone' => 'Méticuleux, détaillé, inventaire exhaustif',
            'focus' => 'Traçabilité, conservation, valorisation du patrimoine',
        ],
    ];

    /**
     * Génère du contenu IA pour un document EPE
     */
    public function generateDocumentContent(string $templateKey, array $contextData): array
    {
        try {
            $context = $this->buildDocumentContext($templateKey, $contextData);
            $prompt = $this->buildPrompt($templateKey, $context);
            
            $response = $this->callAI($prompt);
            
            return [
                'success' => true,
                'content' => $response['content'],
                'suggestions' => $response['suggestions'] ?? [],
                'metadata' => [
                    'template' => $templateKey,
                    'context_used' => array_keys($context),
                    'generated_at' => Carbon::now(),
                    'confidence' => $response['confidence'] ?? 0.85,
                ],
            ];
            
        } catch (\Exception $e) {
            Log::error('AI Writing Assistant Error', [
                'template' => $templateKey,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'fallback_content' => $this->getFallbackContent($templateKey),
            ];
        }
    }

    /**
     * Améliore un texte existant avec l'IA
     */
    public function improveContent(string $originalContent, string $templateKey, array $contextData = []): array
    {
        try {
            $context = $this->buildDocumentContext($templateKey, $contextData);
            $improvementPrompt = $this->buildImprovementPrompt($originalContent, $templateKey, $context);
            
            $response = $this->callAI($improvementPrompt);
            
            return [
                'success' => true,
                'improved_content' => $response['content'],
                'improvements' => $response['improvements'] ?? [],
                'original_content' => $originalContent,
                'improvement_score' => $response['improvement_score'] ?? 0.8,
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'original_content' => $originalContent,
            ];
        }
    }

    /**
     * Génère des suggestions de contenu
     */
    public function getSuggestions(string $templateKey, array $contextData, string $sectionType = 'general'): array
    {
        try {
            $context = $this->buildDocumentContext($templateKey, $contextData);
            $suggestionsPrompt = $this->buildSuggestionsPrompt($templateKey, $context, $sectionType);
            
            $response = $this->callAI($suggestionsPrompt);
            
            return [
                'success' => true,
                'suggestions' => $response['suggestions'],
                'section_type' => $sectionType,
                'context_relevance' => $response['relevance'] ?? 0.8,
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'fallback_suggestions' => $this->getFallbackSuggestions($templateKey, $sectionType),
            ];
        }
    }

    /**
     * Analyse et vérifie la conformité du contenu
     */
    public function analyzeCompliance(string $content, string $templateKey, array $contextData = []): array
    {
        try {
            $context = $this->buildDocumentContext($templateKey, $contextData);
            $compliancePrompt = $this->buildCompliancePrompt($content, $templateKey, $context);
            
            $response = $this->callAI($compliancePrompt);
            
            return [
                'success' => true,
                'compliance_score' => $response['compliance_score'],
                'compliance_issues' => $response['issues'] ?? [],
                'recommendations' => $response['recommendations'] ?? [],
                'regulatory_checks' => $response['regulatory_checks'] ?? [],
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Construction du contexte documentaire
     */
    private function buildDocumentContext(string $templateKey, array $contextData): array
    {
        $baseContext = self::DOCUMENT_CONTEXTS[$templateKey] ?? self::DOCUMENT_CONTEXTS['budget_annuel_societe_etat'];
        
        $context = [
            'document_type' => $templateKey,
            'expertise_role' => $baseContext['expertise'],
            'regulatory_framework' => $baseContext['framework'],
            'tone' => $baseContext['tone'],
            'focus_areas' => $baseContext['focus'],
            'country' => 'Burkina Faso',
            'currency' => 'FCFA',
            'accounting_system' => 'SYSCOHADA',
        ];

        // Ajouter les informations de l'entité
        if (isset($contextData['entity_id'])) {
            $entity = StateEntity::with(['technicalMinistry', 'financialMinistry'])->find($contextData['entity_id']);
            if ($entity) {
                $context['entity'] = [
                    'name' => $entity->name,
                    'code' => $entity->code,
                    'type' => $entity->type,
                    'type_label' => $entity->getTypeLabel(),
                    'sector' => $entity->sector,
                    'capital_amount' => $entity->capital_amount,
                    'employee_count' => $entity->employee_count,
                    'requirements' => $entity->getStructureSpecificRequirements(),
                    'technical_ministry' => $entity->technicalMinistry?->name,
                    'financial_ministry' => $entity->financialMinistry?->name,
                ];
            }
        }

        // Informations temporelles
        if (isset($contextData['exercice'])) {
            $context['fiscal_year'] = $contextData['exercice'];
            $context['period'] = [
                'start' => "{$contextData['exercice']}-01-01",
                'end' => "{$contextData['exercice']}-12-31",
            ];
        }

        // Données financières si disponibles
        if (isset($contextData['financial_data'])) {
            $context['financial_data'] = $contextData['financial_data'];
        }

        return $context;
    }

    /**
     * Construction du prompt principal
     */
    private function buildPrompt(string $templateKey, array $context): string
    {
        $prompt = "Vous êtes un {$context['expertise_role']} au Burkina Faso, expert en {$context['regulatory_framework']}.

CONTEXTE :
- Document : " . ucfirst(str_replace('_', ' ', $templateKey)) . "
- Entité : " . ($context['entity']['name'] ?? 'EPE') . " (" . ($context['entity']['type_label'] ?? 'Entité publique') . ")
- Secteur : " . ($context['entity']['sector'] ?? 'Non spécifié') . "
- Exercice : " . ($context['fiscal_year'] ?? date('Y')) . "
- Cadre réglementaire : {$context['regulatory_framework']}

INSTRUCTIONS :
1. Rédigez un contenu professionnel en français pour ce document
2. Respectez le ton {$context['tone']}
3. Concentrez-vous sur : {$context['focus_areas']}
4. Intégrez les spécificités de l'entité et du secteur
5. Assurez la conformité SYSCOHADA/UEMOA
6. Utilisez des données réalistes et cohérentes

STRUCTURE ATTENDUE :
- Introduction contextuelle
- Développement détaillé par sections
- Analyses et commentaires pertinents
- Conclusion avec recommandations

FORMAT DE RÉPONSE :
{
  \"content\": \"[Contenu principal du document]\",
  \"suggestions\": [
    \"[Suggestion 1]\",
    \"[Suggestion 2]\"
  ],
  \"confidence\": 0.9
}

Générez un contenu complet, structuré et professionnel :";

        return $prompt;
    }

    /**
     * Construction du prompt d'amélioration
     */
    private function buildImprovementPrompt(string $content, string $templateKey, array $context): string
    {
        return "En tant qu'{$context['expertise_role']}, analysez et améliorez ce contenu pour un document {$templateKey} :

CONTENU ORIGINAL :
{$content}

CONTEXTE :
- Cadre réglementaire : {$context['regulatory_framework']}
- Entité : " . ($context['entity']['name'] ?? 'EPE') . "
- Ton requis : {$context['tone']}

AMÉLIORATIONS DEMANDÉES :
1. Clarté et précision du langage
2. Conformité réglementaire
3. Structuration et logique
4. Enrichissement du contenu
5. Cohérence terminologique

FORMAT DE RÉPONSE :
{
  \"content\": \"[Contenu amélioré]\",
  \"improvements\": [
    \"[Amélioration 1]\",
    \"[Amélioration 2]\"
  ],
  \"improvement_score\": 0.85
}";
    }

    /**
     * Construction du prompt de suggestions
     */
    private function buildSuggestionsPrompt(string $templateKey, array $context, string $sectionType): string
    {
        return "En tant qu'{$context['expertise_role']}, proposez des suggestions de contenu pour la section '{$sectionType}' d'un document {$templateKey} :

CONTEXTE :
- Entité : " . ($context['entity']['name'] ?? 'EPE') . " (" . ($context['entity']['sector'] ?? 'Secteur non spécifié') . ")
- Type de structure : " . ($context['entity']['type_label'] ?? 'EPE') . "
- Exercice : " . ($context['fiscal_year'] ?? date('Y')) . "

SUGGESTIONS DEMANDÉES :
1. 5 points clés à développer
2. Éléments réglementaires à mentionner
3. Indicateurs pertinents à inclure
4. Recommandations pratiques

FORMAT DE RÉPONSE :
{
  \"suggestions\": [
    {\"type\": \"key_point\", \"content\": \"[Point clé]\"},
    {\"type\": \"regulatory\", \"content\": \"[Élément réglementaire]\"},
    {\"type\": \"indicator\", \"content\": \"[Indicateur]\"},
    {\"type\": \"recommendation\", \"content\": \"[Recommandation]\"}
  ],
  \"relevance\": 0.9
}";
    }

    /**
     * Construction du prompt de vérification conformité
     */
    private function buildCompliancePrompt(string $content, string $templateKey, array $context): string
    {
        return "En tant qu'expert en conformité {$context['regulatory_framework']}, analysez ce contenu de document {$templateKey} :

CONTENU À ANALYSER :
{$content}

VÉRIFICATIONS REQUISES :
1. Conformité SYSCOHADA/UEMOA
2. Respect du cadre réglementaire burkinabè
3. Cohérence terminologique
4. Complétude des informations obligatoires
5. Qualité de la présentation

FORMAT DE RÉPONSE :
{
  \"compliance_score\": 0.85,
  \"issues\": [
    {\"level\": \"warning\", \"message\": \"[Problème détecté]\"},
    {\"level\": \"error\", \"message\": \"[Erreur critique]\"}
  ],
  \"recommendations\": [
    \"[Recommandation 1]\",
    \"[Recommandation 2]\"
  ],
  \"regulatory_checks\": {
    \"syscohada_compliance\": true,
    \"uemoa_compliance\": true,
    \"local_regulation\": false
  }
}";
    }

    /**
     * Appel à l'API IA
     */
    public function callAI(string $prompt): array
    {
        // Vérifier si l'API key est configurée
        if (!$this->apiKey) {
            throw new \Exception('Clé API OpenAI non configurée');
        }

        // Cache pour éviter les appels répétitifs
        $cacheKey = 'ai_response_' . md5($prompt);
        
        return Cache::remember($cacheKey, 3600, function () use ($prompt) {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(60)->post($this->baseUrl . '/chat/completions', [
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'Vous êtes un expert en documentation administrative et financière pour les entreprises publiques du Burkina Faso. Vous maîtrisez parfaitement le SYSCOHADA, les directives UEMOA, et la réglementation burkinabè. Répondez toujours en JSON valide et en français.'
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'temperature' => 0.7,
                'max_tokens' => 2000,
            ]);

            if (!$response->successful()) {
                throw new \Exception('Erreur API IA: ' . $response->body());
            }

            $data = $response->json();
            $content = $data['choices'][0]['message']['content'] ?? '';
            
            // Tenter de parser le JSON de la réponse
            $jsonContent = json_decode($content, true);
            
            if (json_last_error() === JSON_ERROR_NONE) {
                return $jsonContent;
            } else {
                // Fallback si le JSON n'est pas valide
                return [
                    'content' => $content,
                    'suggestions' => [],
                    'confidence' => 0.7,
                ];
            }
        });
    }

    /**
     * Contenu de fallback en cas d'erreur
     */
    private function getFallbackContent(string $templateKey): string
    {
        $fallbacks = [
            'budget_annuel_societe_etat' => 'Le budget annuel présente les prévisions de recettes et dépenses pour l\'exercice, établi conformément aux normes SYSCOHADA et aux principes de gestion des sociétés d\'État.',
            'etats_financiers_syscohada' => 'Les états financiers comprennent le bilan, le compte de résultat, le TAFIRE et l\'état annexé, établis selon le plan comptable SYSCOHADA révisé.',
            'plan_passation_marches' => 'Le plan de passation des marchés respecte le code des marchés publics et assure la transparence des procédures d\'achat.',
        ];

        return $fallbacks[$templateKey] ?? 'Contenu du document à développer selon les exigences réglementaires en vigueur.';
    }

    /**
     * Suggestions de fallback
     */
    private function getFallbackSuggestions(string $templateKey, string $sectionType): array
    {
        return [
            [
                'type' => 'general',
                'content' => 'Respecter les normes SYSCOHADA en vigueur'
            ],
            [
                'type' => 'regulatory',
                'content' => 'Mentionner le cadre réglementaire applicable'
            ],
            [
                'type' => 'structure',
                'content' => 'Organiser le contenu en sections claires'
            ],
        ];
    }

    /**
     * Génère du contenu adaptatif basé sur l'historique de l'utilisateur
     */
    public function generateAdaptiveContent(string $templateKey, array $contextData, User $user): array
    {
        // Analyser l'historique de l'utilisateur
        $userPreferences = $this->analyzeUserPreferences($user);
        
        // Intégrer les préférences dans le contexte
        $contextData['user_preferences'] = $userPreferences;
        
        return $this->generateDocumentContent($templateKey, $contextData);
    }

    /**
     * Analyse les préférences utilisateur
     */
    private function analyzeUserPreferences(User $user): array
    {
        // À implémenter : analyse des documents précédents, préférences de style, etc.
        return [
            'writing_style' => 'professional',
            'detail_level' => 'comprehensive',
            'preferred_sections' => ['introduction', 'analysis', 'recommendations'],
        ];
    }

    /**
     * Génère un résumé exécutif IA
     */
    public function generateExecutiveSummary(string $fullContent, array $contextData): array
    {
        $prompt = "Créez un résumé exécutif de ce document EPE en 150 mots maximum :

CONTENU COMPLET :
{$fullContent}

Le résumé doit :
1. Synthétiser les points clés
2. Mettre en avant les éléments financiers
3. Mentionner la conformité réglementaire
4. Être accessible aux décideurs

FORMAT JSON :
{
  \"summary\": \"[Résumé exécutif]\",
  \"key_figures\": [\"[Chiffre clé 1]\", \"[Chiffre clé 2]\"],
  \"main_conclusions\": [\"[Conclusion 1]\", \"[Conclusion 2]\"]
}";

        try {
            $response = $this->callAI($prompt);
            return [
                'success' => true,
                'executive_summary' => $response,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}