<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\AIAssistantService;
use App\Services\AIKnowledgeBaseService;
use App\Models\User;
use App\Models\Country;
use App\Models\StateEntity;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;

class AIAssistantServiceTest extends TestCase
{
    use RefreshDatabase;

    private AIAssistantService $aiService;
    private User $user;
    private Country $country;
    private StateEntity $entity;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->aiService = new AIAssistantService();
        
        // Configuration des clés API pour les tests
        Config::set('services.openai.api_key', 'test-openai-key');
        Config::set('services.claude.api_key', 'test-claude-key');
        
        $this->country = Country::create([
            'name' => 'Burkina Faso',
            'code' => 'BF',
            'currency_code' => 'XOF',
            'is_ohada_member' => true,
            'is_uemoa_member' => true,
            'is_cemac_member' => false,
        ]);

        $this->entity = StateEntity::create([
            'name' => 'SONABEL',
            'type' => 'SOCIETE_ETAT',
            'sector' => 'Énergie',
            'country_id' => $this->country->id,
            'size' => 'large',
            'establishment_date' => '1968-01-01',
        ]);

        $plan = SubscriptionPlan::create([
            'name' => 'Professional',
            'code' => 'professional',
            'price' => 50000,
            'currency' => 'XOF',
            'billing_period' => 'monthly',
            'features' => ['ai_assistance'],
            'limits' => ['max_ai_requests_monthly' => 500],
            'status' => 'active',
        ]);

        $this->user = User::create([
            'name' => 'Test User',
            'email' => 'test@sonabel.bf',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'position' => 'Directeur Général',
            'state_entity_id' => $this->entity->id,
            'country_id' => $this->country->id,
        ]);

        Subscription::create([
            'user_id' => $this->user->id,
            'subscription_plan_id' => $plan->id,
            'status' => 'active',
            'current_period_start' => now(),
            'current_period_end' => now()->addMonth(),
            'usage_data' => [],
        ]);
    }

    /** @test */
    public function it_can_build_user_context_correctly()
    {
        $reflection = new \ReflectionClass($this->aiService);
        $method = $reflection->getMethod('buildUserContext');
        $method->setAccessible(true);

        $context = $method->invoke($this->aiService, $this->user);

        // Vérifier le contexte utilisateur
        $this->assertEquals('Test User', $context['user']['name']);
        $this->assertEquals('admin', $context['user']['role']);
        $this->assertEquals('Directeur Général', $context['user']['position']);

        // Vérifier le contexte entité
        $this->assertEquals('SONABEL', $context['entity']['name']);
        $this->assertEquals('SOCIETE_ETAT', $context['entity']['type']);
        $this->assertEquals('Énergie', $context['entity']['sector']);

        // Vérifier le contexte pays
        $this->assertEquals('Burkina Faso', $context['country']['name']);
        $this->assertEquals('BF', $context['country']['code']);
        $this->assertTrue($context['country']['is_ohada_member']);
        $this->assertTrue($context['country']['is_uemoa_member']);

        // Vérifier le contexte réglementaire
        $this->assertArrayHasKey('ohada', $context['regulatory_context']);
        $this->assertArrayHasKey('uemoa', $context['regulatory_context']);
        $this->assertTrue($context['regulatory_context']['ohada']['applicable']);
        $this->assertTrue($context['regulatory_context']['uemoa']['applicable']);
    }

    /** @test */
    public function it_builds_correct_system_prompt_for_ohada_uemoa_context()
    {
        $reflection = new \ReflectionClass($this->aiService);
        $contextMethod = $reflection->getMethod('buildUserContext');
        $contextMethod->setAccessible(true);
        $promptMethod = $reflection->getMethod('buildSystemPrompt');
        $promptMethod->setAccessible(true);

        $context = $contextMethod->invoke($this->aiService, $this->user);
        $prompt = $promptMethod->invoke($this->aiService, $context);

        $this->assertStringContainsString('gouvernance des entreprises publiques africaines', $prompt);
        $this->assertStringContainsString('OHADA, UEMOA, CEMAC et SYSCOHADA', $prompt);
        $this->assertStringContainsString('Test User', $prompt);
        $this->assertStringContainsString('Directeur Général', $prompt);
        $this->assertStringContainsString('Burkina Faso', $prompt);
        $this->assertStringContainsString('SONABEL', $prompt);
        $this->assertStringContainsString('SOCIETE_ETAT', $prompt);
        $this->assertStringContainsString('Membre OHADA: Oui', $prompt);
        $this->assertStringContainsString('Membre UEMOA: Oui', $prompt);
    }

    /** @test */
    public function it_can_check_ai_usage_permissions()
    {
        $reflection = new \ReflectionClass($this->aiService);
        $method = $reflection->getMethod('canUseAI');
        $method->setAccessible(true);

        $canUse = $method->invoke($this->aiService, $this->user);
        $this->assertTrue($canUse);

        // Test avec utilisateur sans abonnement
        $userWithoutSub = User::create([
            'name' => 'No Sub User',
            'email' => 'nosub@test.com',
            'password' => bcrypt('password'),
            'role' => 'viewer',
        ]);

        $canUseWithoutSub = $method->invoke($this->aiService, $userWithoutSub);
        $this->assertFalse($canUseWithoutSub);
    }

    /** @test */
    public function it_successfully_processes_chat_with_openai()
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'Pour améliorer la gouvernance de votre conseil d\'administration SONABEL selon les directives OHADA...'
                        ]
                    ]
                ],
                'usage' => ['total_tokens' => 250],
                'model' => 'gpt-4-turbo-preview'
            ])
        ]);

        $response = $this->aiService->chat($this->user, 'Comment améliorer la gouvernance de mon CA ?');

        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('message', $response);
        $this->assertArrayHasKey('conversation_id', $response);
        $this->assertArrayHasKey('suggestions', $response);
        $this->assertArrayHasKey('context_used', $response);
        $this->assertEquals('openai', $response['provider']);
        $this->assertStringContainsString('gouvernance', $response['message']);
    }

    /** @test */
    public function it_falls_back_to_claude_when_openai_fails()
    {
        Http::fake([
            'api.openai.com/*' => Http::response('Service Unavailable', 503),
            'api.anthropic.com/*' => Http::response([
                'content' => [
                    ['text' => 'Réponse de Claude sur la gouvernance EPE...']
                ],
                'model' => 'claude-3-sonnet-20240229',
                'usage' => ['output_tokens' => 180]
            ])
        ]);

        $response = $this->aiService->chat($this->user, 'Test fallback question');

        $this->assertTrue($response['success']);
        $this->assertEquals('claude', $response['provider']);
        $this->assertStringContainsString('gouvernance EPE', $response['message']);
    }

    /** @test */
    public function it_handles_subscription_limits_correctly()
    {
        // Épuiser les limites d'utilisation
        $subscription = $this->user->subscription;
        $subscription->usage_data = ['ai_assistance' => 500];
        $subscription->save();

        $response = $this->aiService->chat($this->user, 'Test message');

        $this->assertFalse($response['success']);
        $this->assertEquals('subscription_limit_exceeded', $response['error']['code']);
        $this->assertStringContainsString('plan d\'abonnement', $response['error']['message']);
    }

    /** @test */
    public function it_generates_contextual_suggestions_based_on_user_profile()
    {
        $reflection = new \ReflectionClass($this->aiService);
        $method = $reflection->getMethod('generateSuggestions');
        $method->setAccessible(true);

        $suggestions = $method->invoke($this->aiService, $this->user, 'Comment améliorer la gouvernance ?');

        $this->assertIsArray($suggestions);
        $this->assertNotEmpty($suggestions);

        // Vérifier que les suggestions sont contextuelles
        $suggestionTexts = implode(' ', $suggestions);
        $this->assertTrue(
            str_contains($suggestionTexts, 'OHADA') || 
            str_contains($suggestionTexts, 'UEMOA') ||
            str_contains($suggestionTexts, 'EPE') ||
            str_contains($suggestionTexts, 'gouvernance')
        );
    }

    /** @test */
    public function it_saves_and_retrieves_conversation_history()
    {
        $conversationId = 'test_conv_' . $this->user->id;
        
        $reflection = new \ReflectionClass($this->aiService);
        $saveMethod = $reflection->getMethod('saveConversation');
        $saveMethod->setAccessible(true);
        $getMethod = $reflection->getMethod('getConversationHistory');
        $getMethod->setAccessible(true);

        // Sauvegarder une conversation
        $returnedId = $saveMethod->invoke(
            $this->aiService, 
            $this->user, 
            'Question utilisateur', 
            'Réponse IA', 
            $conversationId
        );

        $this->assertEquals($conversationId, $returnedId);

        // Récupérer l'historique
        $history = $getMethod->invoke($this->aiService, $conversationId);

        $this->assertCount(2, $history);
        $this->assertEquals('user', $history[0]['role']);
        $this->assertEquals('Question utilisateur', $history[0]['content']);
        $this->assertEquals('assistant', $history[1]['role']);
        $this->assertEquals('Réponse IA', $history[1]['content']);
    }

    /** @test */
    public function it_records_usage_statistics_correctly()
    {
        $reflection = new \ReflectionClass($this->aiService);
        $method = $reflection->getMethod('recordUsage');
        $method->setAccessible(true);

        $initialUsage = $this->user->subscription->getCurrentUsage('ai_assistance') ?? 0;
        
        $method->invoke($this->aiService, $this->user);
        
        $this->user->subscription->refresh();
        $newUsage = $this->user->subscription->getCurrentUsage('ai_assistance') ?? 0;
        
        $this->assertEquals($initialUsage + 1, $newUsage);
    }

    /** @test */
    public function it_provides_accurate_usage_statistics()
    {
        // Simuler une utilisation
        $subscription = $this->user->subscription;
        $subscription->usage_data = ['ai_assistance' => 150];
        $subscription->save();

        $stats = $this->aiService->getUsageStats($this->user);

        $this->assertTrue($stats['available']);
        $this->assertEquals(150, $stats['usage']);
        $this->assertEquals(500, $stats['limit']);
        $this->assertEquals(350, $stats['remaining']);
        $this->assertEquals(30.0, $stats['percentage_used']);
    }

    /** @test */
    public function it_builds_correct_message_history_with_context()
    {
        $reflection = new \ReflectionClass($this->aiService);
        $method = $reflection->getMethod('buildMessageHistory');
        $method->setAccessible(true);

        $systemPrompt = 'Tu es un expert EPE...';
        $history = [
            ['role' => 'user', 'content' => 'Question 1'],
            ['role' => 'assistant', 'content' => 'Réponse 1'],
        ];
        $newMessage = 'Nouvelle question';

        $messages = $method->invoke($this->aiService, $systemPrompt, $history, $newMessage);

        $this->assertCount(4, $messages); // system + 2 history + new message
        $this->assertEquals('system', $messages[0]['role']);
        $this->assertEquals($systemPrompt, $messages[0]['content']);
        $this->assertEquals('user', $messages[3]['role']);
        $this->assertEquals($newMessage, $messages[3]['content']);
    }

    /** @test */
    public function it_handles_api_errors_gracefully()
    {
        Http::fake([
            'api.openai.com/*' => Http::response('API Error', 500),
            'api.anthropic.com/*' => Http::response('API Error', 500),
        ]);

        $response = $this->aiService->chat($this->user, 'Test error handling');

        $this->assertFalse($response['success']);
        $this->assertEquals('technical_error', $response['error']['code']);
        $this->assertStringContainsString('problème technique', $response['error']['message']);
    }

    /** @test */
    public function it_respects_conversation_message_limits()
    {
        $conversationId = 'limit_test_' . $this->user->id;
        
        // Créer un long historique (plus de 50 messages)
        $longHistory = [];
        for ($i = 0; $i < 60; $i++) {
            $longHistory[] = [
                'role' => $i % 2 === 0 ? 'user' : 'assistant',
                'content' => "Message {$i}",
                'timestamp' => now()->toISOString(),
            ];
        }
        
        Cache::put("ai_conversation_{$conversationId}", $longHistory, now()->addDay());

        $reflection = new \ReflectionClass($this->aiService);
        $method = $reflection->getMethod('getConversationHistory');
        $method->setAccessible(true);

        $retrievedHistory = $method->invoke($this->aiService, $conversationId);
        
        $this->assertCount(50, $retrievedHistory); // Limité à 50 messages
    }

    /** @test */
    public function it_generates_appropriate_error_responses()
    {
        $reflection = new \ReflectionClass($this->aiService);
        $method = $reflection->getMethod('buildErrorResponse');
        $method->setAccessible(true);

        $errorResponse = $method->invoke(
            $this->aiService, 
            'Message d\'erreur test', 
            'test_error_code'
        );

        $this->assertFalse($errorResponse['success']);
        $this->assertEquals('Message d\'erreur test', $errorResponse['error']['message']);
        $this->assertEquals('test_error_code', $errorResponse['error']['code']);
        $this->assertArrayHasKey('suggestions', $errorResponse);
        $this->assertArrayHasKey('timestamp', $errorResponse);
    }

    /** @test */
    public function it_builds_regulatory_context_for_cemac_countries()
    {
        // Créer un pays CEMAC
        $cemacCountry = Country::create([
            'name' => 'Cameroun',
            'code' => 'CM',
            'currency_code' => 'XAF',
            'is_ohada_member' => true,
            'is_uemoa_member' => false,
            'is_cemac_member' => true,
        ]);

        $cemacEntity = StateEntity::create([
            'name' => 'CAMWATER',
            'type' => 'SOCIETE_ETAT',
            'sector' => 'Eau',
            'country_id' => $cemacCountry->id,
            'size' => 'large',
            'establishment_date' => '1967-01-01',
        ]);

        $cemacUser = User::create([
            'name' => 'CEMAC User',
            'email' => 'user@camwater.cm',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'state_entity_id' => $cemacEntity->id,
            'country_id' => $cemacCountry->id,
        ]);

        $reflection = new \ReflectionClass($this->aiService);
        $contextMethod = $reflection->getMethod('buildUserContext');
        $contextMethod->setAccessible(true);

        $context = $contextMethod->invoke($this->aiService, $cemacUser);

        $this->assertArrayHasKey('cemac', $context['regulatory_context']);
        $this->assertTrue($context['regulatory_context']['cemac']['applicable']);
        $this->assertEquals('XAF', $context['regulatory_context']['cemac']['currency']);
        $this->assertEquals('BEAC', $context['regulatory_context']['cemac']['central_bank']);
        $this->assertEquals('SYSCEBNAC', $context['regulatory_context']['cemac']['accounting_system']);
    }
}