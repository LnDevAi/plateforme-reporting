<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\User;
use App\Models\Country;
use App\Models\StateEntity;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Services\AIAssistantService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class AIAssistantControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Country $country;
    private StateEntity $entity;
    private SubscriptionPlan $plan;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->country = Country::create([
            'name' => 'Burkina Faso',
            'code' => 'BF',
            'currency_code' => 'XOF',
            'is_ohada_member' => true,
            'is_uemoa_member' => true,
        ]);

        $this->entity = StateEntity::create([
            'name' => 'SONABEL',
            'type' => 'SOCIETE_ETAT',
            'sector' => 'Énergie',
            'country_id' => $this->country->id,
            'size' => 'large',
            'establishment_date' => '1968-01-01',
        ]);

        $this->plan = SubscriptionPlan::create([
            'name' => 'Professional EPE',
            'code' => 'professional',
            'price' => 50000,
            'currency' => 'XOF',
            'billing_period' => 'monthly',
            'features' => [
                'ai_assistance',
                'advanced_reports',
                'document_collaboration',
            ],
            'limits' => [
                'max_ai_requests_monthly' => 500,
                'max_users' => 25,
            ],
            'status' => 'active',
        ]);

        $this->user = User::create([
            'name' => 'Expert EPE',
            'email' => 'expert@sonabel.bf',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'position' => 'Directeur Général',
            'state_entity_id' => $this->entity->id,
            'country_id' => $this->country->id,
        ]);

        // Créer un abonnement actif
        Subscription::create([
            'user_id' => $this->user->id,
            'subscription_plan_id' => $this->plan->id,
            'status' => 'active',
            'current_period_start' => now(),
            'current_period_end' => now()->addMonth(),
            'usage_data' => [],
        ]);
    }

    /** @test */
    public function authenticated_user_can_chat_with_ai_assistant()
    {
        // Mock de la réponse OpenAI
        Http::fake([
            'api.openai.com/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'Bonjour ! En tant qu\'expert en gouvernance EPE, je vous recommande de suivre les directives OHADA pour votre conseil d\'administration.'
                        ]
                    ]
                ],
                'usage' => ['total_tokens' => 150],
                'model' => 'gpt-4-turbo-preview'
            ])
        ]);

        $chatData = [
            'message' => 'Comment améliorer la gouvernance de mon conseil d\'administration ?',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/ai/chat', $chatData);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'conversation_id',
                    'message',
                    'suggestions',
                    'context_used',
                    'provider',
                    'timestamp'
                ])
                ->assertJson([
                    'success' => true,
                    'provider' => 'openai'
                ]);

        $this->assertStringContainsString('gouvernance', $response->json('message'));
    }

    /** @test */
    public function ai_chat_requires_authentication()
    {
        $chatData = [
            'message' => 'Test question',
        ];

        $response = $this->postJson('/api/ai/chat', $chatData);

        $response->assertStatus(401);
    }

    /** @test */
    public function ai_chat_validates_message_input()
    {
        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/ai/chat', []);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['message']);
    }

    /** @test */
    public function ai_chat_respects_subscription_limits()
    {
        // Épuiser les limites d'utilisation
        $subscription = $this->user->subscription;
        $subscription->usage_data = [
            'ai_assistance' => 500 // Limite atteinte
        ];
        $subscription->save();

        $chatData = [
            'message' => 'Test question',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/ai/chat', $chatData);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => false,
                    'error' => [
                        'code' => 'subscription_limit_exceeded'
                    ]
                ]);
    }

    /** @test */
    public function ai_chat_includes_user_context()
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'Réponse contextualisée pour SONABEL'
                        ]
                    ]
                ],
                'usage' => ['total_tokens' => 100],
                'model' => 'gpt-4-turbo-preview'
            ])
        ]);

        $chatData = [
            'message' => 'Quelles sont mes obligations OHADA ?',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/ai/chat', $chatData);

        $context = $response->json('context_used');
        
        $this->assertEquals('SONABEL', $context['entity']['name']);
        $this->assertEquals('SOCIETE_ETAT', $context['entity']['type']);
        $this->assertEquals('Burkina Faso', $context['country']['name']);
        $this->assertTrue($context['country']['is_ohada_member']);
    }

    /** @test */
    public function user_can_get_conversation_history()
    {
        $conversationId = 'conv_' . uniqid() . '_' . $this->user->id;
        
        // Simuler un historique de conversation
        Cache::put("ai_conversation_{$conversationId}", [
            [
                'role' => 'user',
                'content' => 'Première question',
                'timestamp' => now()->toISOString(),
            ],
            [
                'role' => 'assistant',
                'content' => 'Première réponse',
                'timestamp' => now()->toISOString(),
            ]
        ], now()->addDay());

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson("/api/ai/conversations/{$conversationId}");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'conversation_id',
                    'history',
                    'message_count'
                ])
                ->assertJson([
                    'success' => true,
                    'conversation_id' => $conversationId,
                    'message_count' => 2
                ]);
    }

    /** @test */
    public function user_cannot_access_other_user_conversations()
    {
        $otherUser = User::create([
            'name' => 'Other User',
            'email' => 'other@example.com',
            'password' => bcrypt('password'),
            'role' => 'viewer',
        ]);

        $conversationId = 'conv_' . uniqid() . '_' . $otherUser->id;

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson("/api/ai/conversations/{$conversationId}");

        $response->assertStatus(403)
                ->assertJson([
                    'success' => false,
                    'error' => [
                        'code' => 'unauthorized_access'
                    ]
                ]);
    }

    /** @test */
    public function user_can_get_contextual_suggestions()
    {
        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/ai/suggestions');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'suggestions' => [
                        '*' => [
                            'text',
                            'category'
                        ]
                    ]
                ]);

        $suggestions = $response->json('suggestions');
        $this->assertNotEmpty($suggestions);

        // Vérifier que les suggestions sont contextuelles OHADA/UEMOA
        $suggestionTexts = array_column($suggestions, 'text');
        $this->assertTrue(
            collect($suggestionTexts)->contains(function ($text) {
                return str_contains($text, 'OHADA') || str_contains($text, 'UEMOA');
            })
        );
    }

    /** @test */
    public function user_can_search_knowledge_base()
    {
        $searchData = [
            'query' => 'assemblée générale OHADA',
            'domain' => 'ohada'
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/ai/search', $searchData);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'query',
                    'domain',
                    'results',
                    'result_count'
                ])
                ->assertJson([
                    'success' => true,
                    'query' => 'assemblée générale OHADA',
                    'domain' => 'ohada'
                ]);
    }

    /** @test */
    public function user_can_get_contextual_advice()
    {
        $adviceData = [
            'domain' => 'governance'
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/ai/advice?' . http_build_query($adviceData));

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'domain',
                    'advice',
                    'context'
                ])
                ->assertJson([
                    'success' => true,
                    'domain' => 'governance'
                ]);

        $this->assertNotEmpty($response->json('advice'));
    }

    /** @test */
    public function user_can_rate_ai_responses()
    {
        $conversationId = 'conv_' . uniqid() . '_' . $this->user->id;
        
        $ratingData = [
            'conversation_id' => $conversationId,
            'message_index' => 1,
            'rating' => 5,
            'feedback' => 'Excellente réponse, très utile!'
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/ai/rate', $ratingData);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Merci pour votre évaluation ! Cela nous aide à améliorer l\'assistant IA.'
                ]);

        // Vérifier que l'évaluation est sauvegardée
        $ratings = Cache::get("ai_ratings_{$conversationId}");
        $this->assertNotEmpty($ratings);
        $this->assertEquals(5, $ratings[0]['rating']);
    }

    /** @test */
    public function user_can_get_usage_statistics()
    {
        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/ai/usage-stats');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'available',
                        'usage',
                        'limit',
                        'remaining',
                        'percentage_used'
                    ]
                ]);

        $data = $response->json('data');
        $this->assertTrue($data['available']);
        $this->assertEquals(500, $data['limit']);
    }

    /** @test */
    public function ai_chat_fallback_works_when_primary_provider_fails()
    {
        // Simuler l'échec d'OpenAI et le succès de Claude
        Http::fake([
            'api.openai.com/*' => Http::response('Service unavailable', 503),
            'api.anthropic.com/*' => Http::response([
                'content' => [
                    ['text' => 'Réponse de Claude en fallback']
                ],
                'model' => 'claude-3-sonnet-20240229'
            ])
        ]);

        $chatData = [
            'message' => 'Test question for fallback',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/ai/chat', $chatData);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'provider' => 'claude'
                ]);
    }

    /** @test */
    public function ai_chat_provides_epe_specific_suggestions()
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'Voici mes recommandations pour votre EPE'
                        ]
                    ]
                ],
                'usage' => ['total_tokens' => 100],
                'model' => 'gpt-4-turbo-preview'
            ])
        ]);

        $chatData = [
            'message' => 'Comment améliorer la performance de SONABEL ?',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/ai/chat', $chatData);

        $suggestions = $response->json('suggestions');
        $this->assertNotEmpty($suggestions);

        // Vérifier que les suggestions sont pertinentes pour les EPE
        $hasEpeRelevantSuggestion = collect($suggestions)->contains(function ($suggestion) {
            return str_contains(strtolower($suggestion), 'epe') ||
                   str_contains(strtolower($suggestion), 'gouvernance') ||
                   str_contains(strtolower($suggestion), 'conseil') ||
                   str_contains(strtolower($suggestion), 'performance');
        });

        $this->assertTrue($hasEpeRelevantSuggestion);
    }

    /** @test */
    public function ai_response_includes_regulatory_context()
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'Selon les directives OHADA et UEMOA...'
                        ]
                    ]
                ],
                'usage' => ['total_tokens' => 120],
                'model' => 'gpt-4-turbo-preview'
            ])
        ]);

        $chatData = [
            'message' => 'Quelles sont mes obligations réglementaires ?',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/ai/chat', $chatData);

        $context = $response->json('context_used');
        
        // Vérifier que le contexte réglementaire est inclus
        $this->assertArrayHasKey('country', $context);
        $this->assertTrue($context['country']['is_ohada_member']);
        $this->assertTrue($context['country']['is_uemoa_member']);
        $this->assertEquals('SYSCOHADA', $context['country']['accounting_system']);
    }
}