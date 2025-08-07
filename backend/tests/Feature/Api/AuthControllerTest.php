<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\User;
use App\Models\Country;
use App\Models\StateEntity;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    private Country $country;
    private StateEntity $entity;

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
    }

    /** @test */
    public function user_can_register_successfully()
    {
        $registrationData = [
            'name' => 'Amadou OUÉDRAOGO',
            'email' => 'amadou@sonabel.bf',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'admin',
            'position' => 'Directeur Général',
            'organization' => 'SONABEL',
            'country_id' => $this->country->id,
            'state_entity_id' => $this->entity->id,
        ];

        $response = $this->postJson('/api/auth/register', $registrationData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'user' => [
                            'id',
                            'name',
                            'email',
                            'role',
                            'position',
                            'organization',
                        ],
                        'token'
                    ],
                    'message'
                ]);

        $this->assertDatabaseHas('users', [
            'email' => 'amadou@sonabel.bf',
            'name' => 'Amadou OUÉDRAOGO',
            'role' => 'admin',
        ]);
    }

    /** @test */
    public function registration_requires_valid_email()
    {
        $registrationData = [
            'name' => 'Test User',
            'email' => 'invalid-email',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'viewer',
        ];

        $response = $this->postJson('/api/auth/register', $registrationData);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function registration_requires_password_confirmation()
    {
        $registrationData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'DifferentPassword',
            'role' => 'viewer',
        ];

        $response = $this->postJson('/api/auth/register', $registrationData);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['password']);
    }

    /** @test */
    public function user_cannot_register_with_duplicate_email()
    {
        User::create([
            'name' => 'Existing User',
            'email' => 'existing@sonabel.bf',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        $registrationData = [
            'name' => 'New User',
            'email' => 'existing@sonabel.bf',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'manager',
        ];

        $response = $this->postJson('/api/auth/register', $registrationData);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function user_can_login_with_valid_credentials()
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@sonabel.bf',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'state_entity_id' => $this->entity->id,
        ]);

        $loginData = [
            'email' => 'test@sonabel.bf',
            'password' => 'password123',
        ];

        $response = $this->postJson('/api/auth/login', $loginData);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'user' => [
                            'id',
                            'name',
                            'email',
                            'role',
                        ],
                        'token'
                    ],
                    'message'
                ]);

        $this->assertEquals($user->email, $response->json('data.user.email'));
    }

    /** @test */
    public function user_cannot_login_with_invalid_credentials()
    {
        User::create([
            'name' => 'Test User',
            'email' => 'test@sonabel.bf',
            'password' => Hash::make('correct_password'),
            'role' => 'admin',
        ]);

        $loginData = [
            'email' => 'test@sonabel.bf',
            'password' => 'wrong_password',
        ];

        $response = $this->postJson('/api/auth/login', $loginData);

        $response->assertStatus(401)
                ->assertJson([
                    'success' => false,
                    'message' => 'Identifiants invalides'
                ]);
    }

    /** @test */
    public function user_cannot_login_with_non_existent_email()
    {
        $loginData = [
            'email' => 'nonexistent@example.com',
            'password' => 'password123',
        ];

        $response = $this->postJson('/api/auth/login', $loginData);

        $response->assertStatus(401)
                ->assertJson([
                    'success' => false,
                    'message' => 'Identifiants invalides'
                ]);
    }

    /** @test */
    public function authenticated_user_can_get_profile()
    {
        $user = User::create([
            'name' => 'Profile User',
            'email' => 'profile@sonabel.bf',
            'password' => Hash::make('password'),
            'role' => 'manager',
            'position' => 'Contrôleur de Gestion',
            'state_entity_id' => $this->entity->id,
            'country_id' => $this->country->id,
        ]);

        $response = $this->actingAs($user, 'sanctum')
                         ->getJson('/api/auth/profile');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'user' => [
                            'id',
                            'name',
                            'email',
                            'role',
                            'position',
                            'state_entity',
                            'country',
                        ]
                    ]
                ]);

        $this->assertEquals($user->name, $response->json('data.user.name'));
        $this->assertEquals($user->email, $response->json('data.user.email'));
    }

    /** @test */
    public function unauthenticated_user_cannot_access_profile()
    {
        $response = $this->getJson('/api/auth/profile');

        $response->assertStatus(401);
    }

    /** @test */
    public function authenticated_user_can_logout()
    {
        $user = User::create([
            'name' => 'Logout User',
            'email' => 'logout@sonabel.bf',
            'password' => Hash::make('password'),
            'role' => 'viewer',
        ]);

        $response = $this->actingAs($user, 'sanctum')
                         ->postJson('/api/auth/logout');

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Déconnexion réussie'
                ]);

        // Vérifier que le token est révoqué
        $this->assertCount(0, $user->tokens);
    }

    /** @test */
    public function user_can_update_profile()
    {
        $user = User::create([
            'name' => 'Original Name',
            'email' => 'original@sonabel.bf',
            'password' => Hash::make('password'),
            'role' => 'manager',
            'position' => 'Original Position',
        ]);

        $updateData = [
            'name' => 'Updated Name',
            'position' => 'Updated Position',
            'organization' => 'Updated Organization',
        ];

        $response = $this->actingAs($user, 'sanctum')
                         ->putJson('/api/auth/profile', $updateData);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Profil mis à jour avec succès'
                ]);

        $user->refresh();
        $this->assertEquals('Updated Name', $user->name);
        $this->assertEquals('Updated Position', $user->position);
    }

    /** @test */
    public function user_can_change_password()
    {
        $user = User::create([
            'name' => 'Password User',
            'email' => 'password@sonabel.bf',
            'password' => Hash::make('old_password'),
            'role' => 'viewer',
        ]);

        $passwordData = [
            'current_password' => 'old_password',
            'password' => 'new_password123',
            'password_confirmation' => 'new_password123',
        ];

        $response = $this->actingAs($user, 'sanctum')
                         ->putJson('/api/auth/change-password', $passwordData);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Mot de passe modifié avec succès'
                ]);

        $user->refresh();
        $this->assertTrue(Hash::check('new_password123', $user->password));
    }

    /** @test */
    public function user_cannot_change_password_with_wrong_current_password()
    {
        $user = User::create([
            'name' => 'Password User',
            'email' => 'password@sonabel.bf',
            'password' => Hash::make('correct_password'),
            'role' => 'viewer',
        ]);

        $passwordData = [
            'current_password' => 'wrong_password',
            'password' => 'new_password123',
            'password_confirmation' => 'new_password123',
        ];

        $response = $this->actingAs($user, 'sanctum')
                         ->putJson('/api/auth/change-password', $passwordData);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['current_password']);
    }

    /** @test */
    public function registration_validates_role_values()
    {
        $registrationData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'invalid_role',
        ];

        $response = $this->postJson('/api/auth/register', $registrationData);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['role']);
    }

    /** @test */
    public function login_response_includes_user_relationships()
    {
        $user = User::create([
            'name' => 'Relationship User',
            'email' => 'relations@sonabel.bf',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'state_entity_id' => $this->entity->id,
            'country_id' => $this->country->id,
        ]);

        $loginData = [
            'email' => 'relations@sonabel.bf',
            'password' => 'password',
        ];

        $response = $this->postJson('/api/auth/login', $loginData);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        'user' => [
                            'state_entity' => [
                                'name',
                                'type',
                                'sector'
                            ],
                            'country' => [
                                'name',
                                'code'
                            ]
                        ]
                    ]
                ]);
    }
}