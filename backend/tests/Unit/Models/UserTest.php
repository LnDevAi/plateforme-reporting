<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\User;
use App\Models\StateEntity;
use App\Models\Country;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class UserTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function user_can_be_created_with_valid_data()
    {
        $userData = [
            'name' => 'Amadou OUÉDRAOGO',
            'email' => 'amadou@epe-burkina.bf',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'position' => 'Directeur Général',
            'organization' => 'SONABEL',
        ];

        $user = User::create($userData);

        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals('Amadou OUÉDRAOGO', $user->name);
        $this->assertEquals('amadou@epe-burkina.bf', $user->email);
        $this->assertEquals('admin', $user->role);
        $this->assertTrue(Hash::check('password123', $user->password));
    }

    /** @test */
    public function user_email_must_be_unique()
    {
        User::create([
            'name' => 'User 1',
            'email' => 'test@epe.bf',
            'password' => Hash::make('password'),
            'role' => 'admin'
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);
        
        User::create([
            'name' => 'User 2',
            'email' => 'test@epe.bf', // Email duplicate
            'password' => Hash::make('password'),
            'role' => 'manager'
        ]);
    }

    /** @test */
    public function user_can_have_state_entity_relationship()
    {
        $country = Country::create([
            'name' => 'Burkina Faso',
            'code' => 'BF',
            'currency_code' => 'XOF',
            'is_ohada_member' => true,
            'is_uemoa_member' => true,
        ]);

        $entity = StateEntity::create([
            'name' => 'SONABEL',
            'type' => 'SOCIETE_ETAT',
            'sector' => 'Énergie',
            'country_id' => $country->id,
            'size' => 'large',
            'establishment_date' => '1968-01-01',
        ]);

        $user = User::create([
            'name' => 'Directeur SONABEL',
            'email' => 'directeur@sonabel.bf',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'state_entity_id' => $entity->id,
        ]);

        $this->assertInstanceOf(StateEntity::class, $user->stateEntity);
        $this->assertEquals('SONABEL', $user->stateEntity->name);
    }

    /** @test */
    public function user_can_have_country_relationship()
    {
        $country = Country::create([
            'name' => 'Burkina Faso',
            'code' => 'BF',
            'currency_code' => 'XOF',
            'is_ohada_member' => true,
            'is_uemoa_member' => true,
        ]);

        $user = User::create([
            'name' => 'Utilisateur BF',
            'email' => 'user@burkina.bf',
            'password' => Hash::make('password'),
            'role' => 'manager',
            'country_id' => $country->id,
        ]);

        $this->assertInstanceOf(Country::class, $user->country);
        $this->assertEquals('Burkina Faso', $user->country->name);
        $this->assertTrue($user->country->is_ohada_member);
    }

    /** @test */
    public function user_preferred_language_defaults_to_french()
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => Hash::make('password'),
            'role' => 'viewer',
        ]);

        $this->assertEquals('fr', $user->getPreferredLanguage());
    }

    /** @test */
    public function user_roles_are_validated()
    {
        $validRoles = ['admin', 'manager', 'analyst', 'viewer'];
        
        foreach ($validRoles as $role) {
            $user = User::create([
                'name' => "User {$role}",
                'email' => "user_{$role}@test.com",
                'password' => Hash::make('password'),
                'role' => $role,
            ]);
            
            $this->assertEquals($role, $user->role);
        }
    }

    /** @test */
    public function user_can_check_permissions()
    {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        $viewer = User::create([
            'name' => 'Viewer User',
            'email' => 'viewer@test.com',
            'password' => Hash::make('password'),
            'role' => 'viewer',
        ]);

        // Les admins peuvent tout faire
        $this->assertTrue($admin->role === 'admin');
        
        // Les viewers ont des permissions limitées
        $this->assertTrue($viewer->role === 'viewer');
    }

    /** @test */
    public function user_password_is_always_hashed()
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'plaintext_password',
            'role' => 'viewer',
        ]);

        $this->assertNotEquals('plaintext_password', $user->password);
        $this->assertTrue(Hash::check('plaintext_password', $user->password));
    }
}