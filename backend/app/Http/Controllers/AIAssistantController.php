<?php

namespace App\Http\Controllers;

use App\Services\AIAssistantService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use App\Http\Middleware\CheckSubscription;

class AIAssistantController extends Controller
{
    protected $aiAssistant;

    public function __construct(AIAssistantService $aiAssistant)
    {
        $this->aiAssistant = $aiAssistant;
        
        // Middleware pour vérifier l'accès IA
        $this->middleware(['auth:sanctum', CheckSubscription::class . ':ai_assistance,use']);
    }

    /**
     * Conversation avec l'assistant IA
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function chat(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:2000',
            'conversation_id' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => [
                    'message' => 'Données de requête invalides',
                    'code' => 'validation_error',
                    'details' => $validator->errors()
                ]
            ], 422);
        }

        $user = $request->user();
        $message = $request->input('message');
        $conversationId = $request->input('conversation_id');

        try {
            $response = $this->aiAssistant->chat($user, $message, $conversationId);
            
            return response()->json($response);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'message' => 'Erreur lors du traitement de votre demande. Veuillez réessayer.',
                    'code' => 'processing_error'
                ]
            ], 500);
        }
    }

    /**
     * Obtient les statistiques d'utilisation de l'IA
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getUsageStats(Request $request): JsonResponse
    {
        $user = $request->user();
        $stats = $this->aiAssistant->getUsageStats($user);

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Suggestions de questions basées sur le contexte utilisateur
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getSuggestions(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $suggestions = $this->generateContextualSuggestions($user);

        return response()->json([
            'success' => true,
            'suggestions' => $suggestions
        ]);
    }

    /**
     * Obtient l'historique d'une conversation
     * 
     * @param Request $request
     * @param string $conversationId
     * @return JsonResponse
     */
    public function getConversationHistory(Request $request, string $conversationId): JsonResponse
    {
        $user = $request->user();
        
        // Vérifier que la conversation appartient à l'utilisateur
        if (!str_ends_with($conversationId, '_' . $user->id)) {
            return response()->json([
                'success' => false,
                'error' => [
                    'message' => 'Accès non autorisé à cette conversation',
                    'code' => 'unauthorized_access'
                ]
            ], 403);
        }

        $history = \Cache::get("ai_conversation_{$conversationId}", []);

        return response()->json([
            'success' => true,
            'conversation_id' => $conversationId,
            'history' => $history,
            'message_count' => count($history)
        ]);
    }

    /**
     * Génère des suggestions contextuelles
     */
    protected function generateContextualSuggestions($user): array
    {
        $suggestions = [];

        // Suggestions basées sur le pays et les régulations
        if ($user->country) {
            if ($user->country->is_ohada_member) {
                $suggestions[] = [
                    'text' => 'Quelles sont les obligations OHADA pour mon conseil d\'administration ?',
                    'category' => 'governance'
                ];
                $suggestions[] = [
                    'text' => 'Comment préparer une assemblée générale conforme OHADA ?',
                    'category' => 'governance'
                ];
            }

            if ($user->country->is_uemoa_member) {
                $suggestions[] = [
                    'text' => 'Quels sont les critères de convergence UEMOA que je dois respecter ?',
                    'category' => 'compliance'
                ];
                $suggestions[] = [
                    'text' => 'Comment appliquer le code des marchés publics UEMOA ?',
                    'category' => 'procurement'
                ];
            }

            if ($user->country->getApplicableAccountingSystem() === 'SYSCOHADA') {
                $suggestions[] = [
                    'text' => 'Comment préparer mes états financiers selon le SYSCOHADA ?',
                    'category' => 'accounting'
                ];
            }
        }

        // Suggestions basées sur le type d'entité
        if ($user->stateEntity) {
            switch ($user->stateEntity->type) {
                case 'SOCIETE_ETAT':
                    $suggestions[] = [
                        'text' => 'Quelles sont mes obligations spécifiques en tant que société d\'État ?',
                        'category' => 'governance'
                    ];
                    break;
                case 'ETABLISSEMENT_PUBLIC':
                    $suggestions[] = [
                        'text' => 'Comment organiser la gouvernance d\'un établissement public ?',
                        'category' => 'governance'
                    ];
                    break;
            }
        }

        // Suggestions basées sur le rôle
        switch ($user->role) {
            case 'admin':
            case 'manager':
                $suggestions[] = [
                    'text' => 'Quels KPIs dois-je suivre pour mon EPE ?',
                    'category' => 'performance'
                ];
                $suggestions[] = [
                    'text' => 'Comment mettre en place un système de gestion des risques ?',
                    'category' => 'risk_management'
                ];
                break;
            case 'analyst':
                $suggestions[] = [
                    'text' => 'Quels sont les ratios financiers importants pour une EPE ?',
                    'category' => 'finance'
                ];
                break;
        }

        // Suggestions générales
        $generalSuggestions = [
            [
                'text' => 'Comment améliorer la transparence de ma gouvernance ?',
                'category' => 'governance'
            ],
            [
                'text' => 'Quelles formations recommandez-vous pour mon équipe ?',
                'category' => 'training'
            ],
            [
                'text' => 'Comment préparer mon rapport annuel de gestion ?',
                'category' => 'reporting'
            ],
            [
                'text' => 'Quelles sont les meilleures pratiques ESG pour les EPE ?',
                'category' => 'sustainability'
            ]
        ];

        $suggestions = array_merge($suggestions, $generalSuggestions);

        // Retourner un échantillon aléatoire de 6-8 suggestions
        $suggestions = collect($suggestions)->shuffle()->take(8)->values()->all();

        return $suggestions;
    }

    /**
     * Recherche dans la base de connaissances
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function searchKnowledge(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|max:200',
            'domain' => 'nullable|string|in:ohada,uemoa,syscohada,governance,all'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => [
                    'message' => 'Paramètres de recherche invalides',
                    'code' => 'validation_error',
                    'details' => $validator->errors()
                ]
            ], 422);
        }

        $query = $request->input('query');
        $domain = $request->input('domain', 'all');
        $user = $request->user();

        try {
            $knowledgeBase = new \App\Services\AIKnowledgeBaseService();
            $context = $this->aiAssistant->buildUserContext($user);
            
            $results = $knowledgeBase->search($query, $context);

            return response()->json([
                'success' => true,
                'query' => $query,
                'domain' => $domain,
                'results' => $results,
                'result_count' => count($results)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'message' => 'Erreur lors de la recherche',
                    'code' => 'search_error'
                ]
            ], 500);
        }
    }

    /**
     * Obtient des conseils pratiques selon un domaine
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getAdvice(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'domain' => 'required|string|in:governance,financial_reporting,compliance,risk_management'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => [
                    'message' => 'Domaine non valide',
                    'code' => 'validation_error',
                    'details' => $validator->errors()
                ]
            ], 422);
        }

        $domain = $request->input('domain');
        $user = $request->user();

        try {
            $knowledgeBase = new \App\Services\AIKnowledgeBaseService();
            $context = [
                'user' => [
                    'role' => $user->role,
                    'position' => $user->position,
                ],
                'entity' => $user->stateEntity ? [
                    'type' => $user->stateEntity->type,
                    'sector' => $user->stateEntity->sector,
                ] : null,
                'country' => $user->country ? [
                    'code' => $user->country->code,
                    'name' => $user->country->name,
                    'is_ohada_member' => $user->country->is_ohada_member,
                    'is_uemoa_member' => $user->country->is_uemoa_member,
                    'accounting_system' => $user->country->getApplicableAccountingSystem(),
                ] : null,
            ];
            
            $advice = $knowledgeBase->getContextualAdvice($domain, $context);

            return response()->json([
                'success' => true,
                'domain' => $domain,
                'advice' => $advice,
                'context' => $context
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'message' => 'Erreur lors de la génération des conseils',
                    'code' => 'advice_error'
                ]
            ], 500);
        }
    }

    /**
     * Évalue la satisfaction d'une réponse IA
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function rateResponse(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'conversation_id' => 'required|string',
            'message_index' => 'required|integer|min:0',
            'rating' => 'required|integer|min:1|max:5',
            'feedback' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => [
                    'message' => 'Données d\'évaluation invalides',
                    'code' => 'validation_error',
                    'details' => $validator->errors()
                ]
            ], 422);
        }

        $user = $request->user();
        $conversationId = $request->input('conversation_id');
        $messageIndex = $request->input('message_index');
        $rating = $request->input('rating');
        $feedback = $request->input('feedback');

        // Vérifier l'accès à la conversation
        if (!str_ends_with($conversationId, '_' . $user->id)) {
            return response()->json([
                'success' => false,
                'error' => [
                    'message' => 'Accès non autorisé à cette conversation',
                    'code' => 'unauthorized_access'
                ]
            ], 403);
        }

        try {
            // Sauvegarder l'évaluation
            $ratingData = [
                'user_id' => $user->id,
                'conversation_id' => $conversationId,
                'message_index' => $messageIndex,
                'rating' => $rating,
                'feedback' => $feedback,
                'timestamp' => now()->toISOString(),
            ];

            // Utiliser le cache pour stocker les évaluations
            $ratingsKey = "ai_ratings_{$conversationId}";
            $ratings = \Cache::get($ratingsKey, []);
            $ratings[] = $ratingData;
            \Cache::put($ratingsKey, $ratings, now()->addMonth());

            return response()->json([
                'success' => true,
                'message' => 'Merci pour votre évaluation ! Cela nous aide à améliorer l\'assistant IA.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'message' => 'Erreur lors de l\'enregistrement de l\'évaluation',
                    'code' => 'rating_error'
                ]
            ], 500);
        }
    }
}