<?php

namespace App\Http\Controllers;

use App\Services\AIWritingAssistantService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Exception;

class AIWritingAssistantController extends Controller
{
    protected $aiService;

    public function __construct(AIWritingAssistantService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Génère du contenu IA pour un document
     */
    public function generateContent(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'template_key' => 'required|string',
                'entity_id' => 'nullable|exists:state_entities,id',
                'exercice' => 'nullable|integer|min:2020|max:2030',
                'section_type' => 'nullable|string',
                'context_data' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $templateKey = $request->input('template_key');
            $contextData = [
                'entity_id' => $request->input('entity_id'),
                'exercice' => $request->input('exercice'),
                'section_type' => $request->input('section_type', 'general'),
                ...$request->input('context_data', [])
            ];

            $result = $this->aiService->generateDocumentContent($templateKey, $contextData);

            return response()->json([
                'success' => $result['success'],
                'data' => $result,
                'message' => $result['success'] 
                    ? 'Contenu généré avec succès par l\'IA' 
                    : 'Erreur lors de la génération IA'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du contenu IA',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Améliore un contenu existant avec l'IA
     */
    public function improveContent(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'content' => 'required|string|min:10',
                'template_key' => 'required|string',
                'entity_id' => 'nullable|exists:state_entities,id',
                'exercice' => 'nullable|integer',
                'context_data' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $content = $request->input('content');
            $templateKey = $request->input('template_key');
            $contextData = [
                'entity_id' => $request->input('entity_id'),
                'exercice' => $request->input('exercice'),
                ...$request->input('context_data', [])
            ];

            $result = $this->aiService->improveContent($content, $templateKey, $contextData);

            return response()->json([
                'success' => $result['success'],
                'data' => $result,
                'message' => $result['success'] 
                    ? 'Contenu amélioré avec succès' 
                    : 'Erreur lors de l\'amélioration'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'amélioration du contenu',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtient des suggestions de contenu
     */
    public function getSuggestions(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'template_key' => 'required|string',
                'section_type' => 'required|string',
                'entity_id' => 'nullable|exists:state_entities,id',
                'exercice' => 'nullable|integer',
                'context_data' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $templateKey = $request->input('template_key');
            $sectionType = $request->input('section_type');
            $contextData = [
                'entity_id' => $request->input('entity_id'),
                'exercice' => $request->input('exercice'),
                ...$request->input('context_data', [])
            ];

            $result = $this->aiService->getSuggestions($templateKey, $contextData, $sectionType);

            return response()->json([
                'success' => $result['success'],
                'data' => $result,
                'message' => $result['success'] 
                    ? 'Suggestions générées avec succès' 
                    : 'Erreur lors de la génération des suggestions'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération des suggestions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Analyse la conformité du contenu
     */
    public function analyzeCompliance(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'content' => 'required|string|min:10',
                'template_key' => 'required|string',
                'entity_id' => 'nullable|exists:state_entities,id',
                'context_data' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $content = $request->input('content');
            $templateKey = $request->input('template_key');
            $contextData = [
                'entity_id' => $request->input('entity_id'),
                ...$request->input('context_data', [])
            ];

            $result = $this->aiService->analyzeCompliance($content, $templateKey, $contextData);

            return response()->json([
                'success' => $result['success'],
                'data' => $result,
                'message' => $result['success'] 
                    ? 'Analyse de conformité effectuée' 
                    : 'Erreur lors de l\'analyse'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'analyse de conformité',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Génère un résumé exécutif
     */
    public function generateExecutiveSummary(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'content' => 'required|string|min:100',
                'entity_id' => 'nullable|exists:state_entities,id',
                'context_data' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $content = $request->input('content');
            $contextData = [
                'entity_id' => $request->input('entity_id'),
                ...$request->input('context_data', [])
            ];

            $result = $this->aiService->generateExecutiveSummary($content, $contextData);

            return response()->json([
                'success' => $result['success'],
                'data' => $result,
                'message' => $result['success'] 
                    ? 'Résumé exécutif généré avec succès' 
                    : 'Erreur lors de la génération du résumé'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du résumé exécutif',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Génère du contenu adaptatif basé sur l'utilisateur
     */
    public function generateAdaptiveContent(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'template_key' => 'required|string',
                'entity_id' => 'nullable|exists:state_entities,id',
                'exercice' => 'nullable|integer',
                'context_data' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $templateKey = $request->input('template_key');
            $contextData = [
                'entity_id' => $request->input('entity_id'),
                'exercice' => $request->input('exercice'),
                ...$request->input('context_data', [])
            ];

            $user = auth()->user();
            $result = $this->aiService->generateAdaptiveContent($templateKey, $contextData, $user);

            return response()->json([
                'success' => $result['success'],
                'data' => $result,
                'message' => $result['success'] 
                    ? 'Contenu adaptatif généré avec succès' 
                    : 'Erreur lors de la génération adaptative'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération de contenu adaptatif',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtient les contextes disponibles pour un type de document
     */
    public function getDocumentContexts(): JsonResponse
    {
        try {
            $contexts = AIWritingAssistantService::DOCUMENT_CONTEXTS;
            
            // Enrichir avec des informations supplémentaires
            $enrichedContexts = [];
            foreach ($contexts as $key => $context) {
                $enrichedContexts[$key] = [
                    ...$context,
                    'key' => $key,
                    'display_name' => ucfirst(str_replace('_', ' ', $key)),
                    'available_sections' => $this->getAvailableSections($key),
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $enrichedContexts,
                'message' => 'Contextes documentaires récupérés avec succès'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des contextes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test de connectivité IA
     */
    public function testAIConnectivity(): JsonResponse
    {
        try {
            // Test simple avec un prompt minimal
            $testPrompt = "Répondez simplement par 'OK' si vous recevez ce message.";
            
            $result = $this->aiService->callAI($testPrompt);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'connectivity' => 'OK',
                    'response_time' => 'Normal',
                    'api_status' => 'Fonctionnel',
                    'test_response' => $result,
                ],
                'message' => 'Connectivité IA vérifiée avec succès'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'data' => [
                    'connectivity' => 'ERROR',
                    'api_status' => 'Non disponible',
                    'error_details' => $e->getMessage(),
                ],
                'message' => 'Erreur de connectivité IA',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtient les sections disponibles pour un type de document
     */
    private function getAvailableSections(string $templateKey): array
    {
        $sections = [
            'budget_annuel_societe_etat' => [
                'introduction', 'contexte_economique', 'previsions_recettes', 
                'previsions_depenses', 'investissements', 'financement', 
                'analyses_ratios', 'risques_opportunites', 'conclusion'
            ],
            'etats_financiers_syscohada' => [
                'introduction', 'bilan', 'compte_resultat', 'tafire', 
                'annexes', 'rapport_audit', 'recommandations'
            ],
            'rapport_gestion_ca' => [
                'introduction', 'gouvernance', 'performance_operationnelle',
                'situation_financiere', 'ressources_humaines', 'strategie',
                'perspectives', 'conclusion'
            ],
            'plan_passation_marches' => [
                'introduction', 'cadre_reglementaire', 'programmation',
                'procedures', 'calendrier', 'suivi_evaluation'
            ],
            'inventaire_patrimoine' => [
                'introduction', 'methode_inventaire', 'biens_immobiliers',
                'biens_mobiliers', 'valorisation', 'recommandations'
            ],
        ];

        return $sections[$templateKey] ?? ['introduction', 'developpement', 'conclusion'];
    }
}