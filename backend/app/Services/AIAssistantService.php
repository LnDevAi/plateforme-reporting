<?php

namespace App\Services;

use App\Models\User;
use App\Models\Country;
use App\Models\StateEntity;
use App\Models\Subscription;
use App\Http\Middleware\CheckSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AIAssistantService
{
    protected $openaiApiKey;
    protected $claudeApiKey;
    protected $defaultProvider;
    protected $knowledgeBase;

    public function __construct()
    {
        $this->openaiApiKey = config('services.openai.api_key');
        $this->claudeApiKey = config('services.claude.api_key');
        $this->defaultProvider = config('services.ai.default_provider', 'openai');
        $this->knowledgeBase = new AIKnowledgeBaseService();
    }

    /**
     * Point d'entrée principal pour les conversations
     */
    public function chat(User $user, string $message, ?string $conversationId = null): array
    {
        try {
            // Vérifier les limites d'abonnement
            if (!$this->canUseAI($user)) {
                return $this->buildErrorResponse(
                    'Votre plan d\'abonnement ne permet pas d\'utiliser l\'assistant IA. Veuillez upgrader pour accéder à cette fonctionnalité.',
                    'subscription_limit_exceeded'
                );
            }

            // Préparer le contexte de conversation
            $context = $this->buildUserContext($user);
            $conversationHistory = $this->getConversationHistory($conversationId);
            
            // Construire le prompt complet
            $systemPrompt = $this->buildSystemPrompt($context);
            $messages = $this->buildMessageHistory($systemPrompt, $conversationHistory, $message);

            // Obtenir la réponse de l'IA
            $response = $this->getAIResponse($messages, $user);

            // Sauvegarder la conversation
            $conversationId = $this->saveConversation($user, $message, $response['content'], $conversationId);

            // Enregistrer l'utilisation
            $this->recordUsage($user);

            return [
                'success' => true,
                'conversation_id' => $conversationId,
                'message' => $response['content'],
                'suggestions' => $this->generateSuggestions($user, $message),
                'context_used' => $context,
                'provider' => $response['provider'],
                'tokens_used' => $response['tokens_used'] ?? null,
                'timestamp' => now()->toISOString(),
            ];

        } catch (\Exception $e) {
            Log::error('AI Assistant Error: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'message' => $message,
                'trace' => $e->getTraceAsString()
            ]);

            return $this->buildErrorResponse(
                'Désolé, je rencontre un problème technique. Veuillez réessayer dans quelques instants.',
                'technical_error'
            );
        }
    }

    /**
     * Vérifie si l'utilisateur peut utiliser l'IA
     */
    protected function canUseAI(User $user): bool
    {
        return CheckSubscription::userHasFeature($user, 'ai_assistance') &&
               CheckSubscription::userCanUseFeature($user, 'ai_assistance', 'use');
    }

    /**
     * Construit le contexte utilisateur pour personnaliser les réponses
     */
    protected function buildUserContext(User $user): array
    {
        $context = [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
                'position' => $user->position,
                'organization' => $user->organization,
                'preferred_language' => $user->getPreferredLanguage(),
            ],
            'subscription' => [
                'plan' => null,
                'features' => [],
            ],
            'entity' => null,
            'country' => null,
            'regulatory_context' => [],
        ];

        // Informations sur l'entité
        if ($user->stateEntity) {
            $context['entity'] = [
                'name' => $user->stateEntity->name,
                'type' => $user->stateEntity->type,
                'sector' => $user->stateEntity->sector,
                'size' => $user->stateEntity->size,
                'establishment_date' => $user->stateEntity->establishment_date,
            ];
        }

        // Informations sur le pays
        if ($user->country) {
            $context['country'] = [
                'code' => $user->country->code,
                'name' => $user->country->name,
                'currency' => $user->country->currency_code,
                'regulatory_framework' => $user->country->regulatory_framework,
                'accounting_system' => $user->country->getApplicableAccountingSystem(),
                'is_uemoa_member' => $user->country->is_uemoa_member,
                'is_ohada_member' => $user->country->is_ohada_member,
                'compliance_requirements' => $user->country->getComplianceRequirements(),
            ];

            $context['regulatory_context'] = $this->buildRegulatoryContext($user->country);
        }

        // Informations sur l'abonnement
        $subscription = CheckSubscription::getUserSubscription($user);
        if ($subscription) {
            $context['subscription'] = [
                'plan' => $subscription->subscriptionPlan->name,
                'plan_code' => $subscription->subscriptionPlan->code,
                'features' => $subscription->subscriptionPlan->features,
                'expires_at' => $subscription->current_period_end,
            ];
        }

        return $context;
    }

    /**
     * Construit le contexte réglementaire spécifique au pays
     */
    protected function buildRegulatoryContext(Country $country): array
    {
        $context = [];

        if ($country->is_ohada_member) {
            $context['ohada'] = [
                'applicable' => true,
                'accounting_system' => $country->is_cemac_member ? 'SYSCEBNAC' : 'SYSCOHADA',
                'key_texts' => [
                    'Acte uniforme relatif au droit des sociétés commerciales',
                    'Acte uniforme portant organisation des procédures simplifiées',
                    'Acte uniforme relatif au droit comptable',
                ],
            ];
        }

        if ($country->is_uemoa_member) {
            $context['uemoa'] = [
                'applicable' => true,
                'currency' => 'XOF',
                'key_directives' => [
                    'Directive sur la surveillance multilatérale',
                    'Code des marchés publics UEMOA',
                    'Directive relative aux finances publiques',
                ],
                'institutions' => ['BCEAO', 'Commission UEMOA'],
            ];
        }

        if ($country->is_cemac_member) {
            $context['cemac'] = [
                'applicable' => true,
                'currency' => 'XAF',
                'central_bank' => 'BEAC',
                'accounting_system' => 'SYSCEBNAC',
            ];
        }

        return $context;
    }

    /**
     * Construit le prompt système personnalisé
     */
    protected function buildSystemPrompt(array $context): string
    {
        $basePrompt = "Tu es un assistant IA expert en gouvernance des entreprises publiques africaines, spécialisé dans les cadres réglementaires OHADA, UEMOA, CEMAC et SYSCOHADA.

CONTEXTE UTILISATEUR:
- Nom: {$context['user']['name']}
- Rôle: {$context['user']['role']}
- Position: {$context['user']['position']}
- Organisation: {$context['user']['organization']}
- Langue préférée: {$context['user']['preferred_language']}";

        if ($context['country']) {
            $basePrompt .= "\n- Pays: {$context['country']['name']} ({$context['country']['code']})";
            $basePrompt .= "\n- Système comptable: {$context['country']['accounting_system']}";
            
            if ($context['country']['is_ohada_member']) {
                $basePrompt .= "\n- Membre OHADA: Oui";
            }
            if ($context['country']['is_uemoa_member']) {
                $basePrompt .= "\n- Membre UEMOA: Oui";
            }
        }

        if ($context['entity']) {
            $basePrompt .= "\n- Entité: {$context['entity']['name']}";
            $basePrompt .= "\n- Type: {$context['entity']['type']}";
            $basePrompt .= "\n- Secteur: {$context['entity']['sector']}";
        }

        $basePrompt .= "\n\nCOMPORTEMENT ATTENDU:
1. Réponds TOUJOURS dans la langue préférée de l'utilisateur
2. Adapte tes conseils au contexte réglementaire spécifique du pays
3. Cite les textes légaux et réglementaires pertinents
4. Propose des actions concrètes et pratiques
5. Utilise un ton professionnel mais accessible
6. Fais référence aux bonnes pratiques EPE africaines
7. Propose des ressources de formation pertinentes
8. Alerte sur les échéances réglementaires importantes

DOMAINES D'EXPERTISE:
- Gouvernance d'entreprise et conseil d'administration
- Comptabilité SYSCOHADA/SYSCEBNAC
- Conformité réglementaire UEMOA/OHADA/CEMAC
- Reporting financier et extra-financier
- Gestion des risques dans les EPE
- Audit et contrôle interne
- Passation des marchés publics
- Leadership et management public
- Transformation digitale
- Critères ESG et développement durable

Tu as accès à une base de connaissances complète sur ces sujets mise à jour régulièrement.";

        return $basePrompt;
    }

    /**
     * Construit l'historique des messages pour l'IA
     */
    protected function buildMessageHistory(string $systemPrompt, array $history, string $newMessage): array
    {
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt]
        ];

        // Ajouter l'historique (limité aux 10 derniers échanges)
        foreach (array_slice($history, -20) as $msg) {
            $messages[] = ['role' => $msg['role'], 'content' => $msg['content']];
        }

        // Ajouter le nouveau message
        $messages[] = ['role' => 'user', 'content' => $newMessage];

        return $messages;
    }

    /**
     * Obtient une réponse de l'IA (avec fallback)
     */
    protected function getAIResponse(array $messages, User $user): array
    {
        // Essayer le provider principal
        try {
            return $this->callAIProvider($this->defaultProvider, $messages, $user);
        } catch (\Exception $e) {
            Log::warning("Primary AI provider failed: " . $e->getMessage());
            
            // Fallback sur l'autre provider
            $fallbackProvider = $this->defaultProvider === 'openai' ? 'claude' : 'openai';
            try {
                return $this->callAIProvider($fallbackProvider, $messages, $user);
            } catch (\Exception $e2) {
                Log::error("All AI providers failed: " . $e2->getMessage());
                throw $e2;
            }
        }
    }

    /**
     * Appelle un provider IA spécifique
     */
    protected function callAIProvider(string $provider, array $messages, User $user): array
    {
        switch ($provider) {
            case 'openai':
                return $this->callOpenAI($messages, $user);
            case 'claude':
                return $this->callClaude($messages, $user);
            default:
                throw new \Exception("Unknown AI provider: $provider");
        }
    }

    /**
     * Appel à OpenAI GPT-4
     */
    protected function callOpenAI(array $messages, User $user): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->openaiApiKey,
            'Content-Type' => 'application/json',
        ])->timeout(30)->post('https://api.openai.com/v1/chat/completions', [
            'model' => 'gpt-4-turbo-preview',
            'messages' => $messages,
            'max_tokens' => 2000,
            'temperature' => 0.7,
            'presence_penalty' => 0.1,
            'frequency_penalty' => 0.1,
            'user' => (string) $user->id,
        ]);

        if (!$response->successful()) {
            throw new \Exception('OpenAI API Error: ' . $response->body());
        }

        $data = $response->json();
        
        return [
            'content' => $data['choices'][0]['message']['content'],
            'provider' => 'openai',
            'model' => $data['model'],
            'tokens_used' => $data['usage']['total_tokens'] ?? null,
        ];
    }

    /**
     * Appel à Claude (Anthropic)
     */
    protected function callClaude(array $messages, User $user): array
    {
        // Adapter le format pour Claude
        $systemMessage = '';
        $claudeMessages = [];
        
        foreach ($messages as $msg) {
            if ($msg['role'] === 'system') {
                $systemMessage = $msg['content'];
            } else {
                $claudeMessages[] = $msg;
            }
        }

        $response = Http::withHeaders([
            'x-api-key' => $this->claudeApiKey,
            'Content-Type' => 'application/json',
            'anthropic-version' => '2023-06-01',
        ])->timeout(30)->post('https://api.anthropic.com/v1/messages', [
            'model' => 'claude-3-sonnet-20240229',
            'max_tokens' => 2000,
            'system' => $systemMessage,
            'messages' => $claudeMessages,
        ]);

        if (!$response->successful()) {
            throw new \Exception('Claude API Error: ' . $response->body());
        }

        $data = $response->json();
        
        return [
            'content' => $data['content'][0]['text'],
            'provider' => 'claude',
            'model' => $data['model'],
            'tokens_used' => $data['usage']['output_tokens'] ?? null,
        ];
    }

    /**
     * Génère des suggestions de questions
     */
    protected function generateSuggestions(User $user, string $lastMessage): array
    {
        $suggestions = [];
        
        // Suggestions basées sur le contexte utilisateur
        if ($user->country) {
            if ($user->country->is_ohada_member) {
                $suggestions[] = "Quelles sont mes obligations OHADA en tant qu'EPE ?";
                $suggestions[] = "Comment préparer une assemblée générale conforme OHADA ?";
            }
            
            if ($user->country->is_uemoa_member) {
                $suggestions[] = "Quels rapports dois-je soumettre à l'UEMOA ?";
                $suggestions[] = "Comment respecter les directives UEMOA sur les marchés publics ?";
            }
        }

        // Suggestions générales EPE
        $generalSuggestions = [
            "Comment améliorer la gouvernance de mon conseil d'administration ?",
            "Quels sont les KPIs essentiels pour une EPE ?",
            "Comment préparer mon rapport annuel de gestion ?",
            "Quelles formations recommandez-vous pour mon équipe ?",
            "Comment mettre en place un système de gestion des risques ?",
        ];

        $suggestions = array_merge($suggestions, $generalSuggestions);

        // Retourner 3-4 suggestions aléatoires
        return array_slice(array_values(array_unique($suggestions)), 0, 4);
    }

    /**
     * Sauvegarde la conversation
     */
    protected function saveConversation(User $user, string $userMessage, string $aiResponse, ?string $conversationId): string
    {
        if (!$conversationId) {
            $conversationId = 'conv_' . uniqid() . '_' . $user->id;
        }

        $conversation = Cache::get("ai_conversation_{$conversationId}", []);
        
        $conversation[] = [
            'role' => 'user',
            'content' => $userMessage,
            'timestamp' => now()->toISOString(),
        ];
        
        $conversation[] = [
            'role' => 'assistant', 
            'content' => $aiResponse,
            'timestamp' => now()->toISOString(),
        ];

        // Garder seulement les 50 derniers messages
        $conversation = array_slice($conversation, -50);
        
        // Sauvegarder pour 24h
        Cache::put("ai_conversation_{$conversationId}", $conversation, now()->addDay());

        return $conversationId;
    }

    /**
     * Récupère l'historique de conversation
     */
    protected function getConversationHistory(?string $conversationId): array
    {
        if (!$conversationId) {
            return [];
        }

        return Cache::get("ai_conversation_{$conversationId}", []);
    }

    /**
     * Enregistre l'utilisation pour les quotas
     */
    protected function recordUsage(User $user): void
    {
        $subscription = CheckSubscription::getUserSubscription($user);
        if ($subscription) {
            $subscription->recordUsage('ai_assistance', 1);
        }
    }

    /**
     * Construit une réponse d'erreur
     */
    protected function buildErrorResponse(string $message, string $code): array
    {
        return [
            'success' => false,
            'error' => [
                'message' => $message,
                'code' => $code,
            ],
            'suggestions' => [
                "Comment puis-je vous aider avec la gouvernance de votre EPE ?",
                "Avez-vous des questions sur la conformité réglementaire ?",
                "Souhaitez-vous des conseils sur le reporting financier ?",
            ],
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * Obtient les statistiques d'utilisation
     */
    public function getUsageStats(User $user): array
    {
        $subscription = CheckSubscription::getUserSubscription($user);
        if (!$subscription) {
            return ['available' => false];
        }

        $usage = $subscription->getCurrentUsage('ai_assistance') ?? 0;
        $limit = $subscription->subscriptionPlan->getFeatureLimit('ai_assistance') ?? 0;

        return [
            'available' => $subscription->canUseFeature('ai_assistance'),
            'usage' => $usage,
            'limit' => $limit,
            'remaining' => max(0, $limit - $usage),
            'percentage_used' => $limit > 0 ? round(($usage / $limit) * 100, 1) : 0,
        ];
    }
}