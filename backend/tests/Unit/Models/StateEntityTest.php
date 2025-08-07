<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\StateEntity;
use App\Models\Country;
use App\Models\User;
use App\Models\Ministry;
use Illuminate\Foundation\Testing\RefreshDatabase;

class StateEntityTest extends TestCase
{
    use RefreshDatabase;

    private Country $country;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->country = Country::create([
            'name' => 'Burkina Faso',
            'code' => 'BF',
            'currency_code' => 'XOF',
            'is_ohada_member' => true,
            'is_uemoa_member' => true,
            'is_cemac_member' => false,
        ]);
    }

    /** @test */
    public function state_entity_can_be_created_with_all_required_fields()
    {
        $entityData = [
            'name' => 'SONABEL',
            'type' => 'SOCIETE_ETAT',
            'sector' => 'Énergie',
            'country_id' => $this->country->id,
            'size' => 'large',
            'establishment_date' => '1968-01-01',
            'registration_number' => 'BF-EPE-001',
            'headquarters_address' => '01 BP 54 Ouagadougou 01',
            'phone' => '+226 25 30 61 00',
            'email' => 'contact@sonabel.bf',
            'website' => 'https://www.sonabel.bf',
        ];

        $entity = StateEntity::create($entityData);

        $this->assertInstanceOf(StateEntity::class, $entity);
        $this->assertEquals('SONABEL', $entity->name);
        $this->assertEquals('SOCIETE_ETAT', $entity->type);
        $this->assertEquals('Énergie', $entity->sector);
        $this->assertEquals('large', $entity->size);
    }

    /** @test */
    public function state_entity_types_are_properly_validated()
    {
        $validTypes = ['SOCIETE_ETAT', 'ETABLISSEMENT_PUBLIC', 'AUTRES'];
        
        foreach ($validTypes as $type) {
            $entity = StateEntity::create([
                'name' => "EPE {$type}",
                'type' => $type,
                'sector' => 'Test',
                'country_id' => $this->country->id,
                'size' => 'medium',
                'establishment_date' => '2000-01-01',
            ]);
            
            $this->assertEquals($type, $entity->type);
        }
    }

    /** @test */
    public function state_entity_belongs_to_country()
    {
        $entity = StateEntity::create([
            'name' => 'ONEA',
            'type' => 'SOCIETE_ETAT',
            'sector' => 'Eau et Assainissement',
            'country_id' => $this->country->id,
            'size' => 'large',
            'establishment_date' => '1985-12-31',
        ]);

        $this->assertInstanceOf(Country::class, $entity->country);
        $this->assertEquals('Burkina Faso', $entity->country->name);
        $this->assertTrue($entity->country->is_ohada_member);
    }

    /** @test */
    public function state_entity_can_have_multiple_users()
    {
        $entity = StateEntity::create([
            'name' => 'CORIS BANK',
            'type' => 'ETABLISSEMENT_PUBLIC',
            'sector' => 'Banque',
            'country_id' => $this->country->id,
            'size' => 'large',
            'establishment_date' => '1995-06-15',
        ]);

        $user1 = User::create([
            'name' => 'Directeur Général',
            'email' => 'dg@corisbank.bf',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'state_entity_id' => $entity->id,
        ]);

        $user2 = User::create([
            'name' => 'Contrôleur de Gestion',
            'email' => 'controleur@corisbank.bf',
            'password' => bcrypt('password'),
            'role' => 'manager',
            'state_entity_id' => $entity->id,
        ]);

        $this->assertCount(2, $entity->users);
        $this->assertTrue($entity->users->contains($user1));
        $this->assertTrue($entity->users->contains($user2));
    }

    /** @test */
    public function state_entity_has_ministries_supervision()
    {
        $technicalMinistry = Ministry::create([
            'name' => 'Ministère de l\'Énergie',
            'type' => 'technical',
            'country_id' => $this->country->id,
            'contact_email' => 'contact@energie.gov.bf',
        ]);

        $financialMinistry = Ministry::create([
            'name' => 'Ministère de l\'Économie et des Finances',
            'type' => 'financial',
            'country_id' => $this->country->id,
            'contact_email' => 'contact@finances.gov.bf',
        ]);

        $entity = StateEntity::create([
            'name' => 'SONABEL',
            'type' => 'SOCIETE_ETAT',
            'sector' => 'Énergie',
            'country_id' => $this->country->id,
            'size' => 'large',
            'establishment_date' => '1968-01-01',
            'technical_ministry_id' => $technicalMinistry->id,
            'financial_ministry_id' => $financialMinistry->id,
        ]);

        $this->assertEquals('Ministère de l\'Énergie', $entity->technicalMinistry->name);
        $this->assertEquals('Ministère de l\'Économie et des Finances', $entity->financialMinistry->name);
    }

    /** @test */
    public function state_entity_can_get_applicable_session_types()
    {
        $societeDEtat = StateEntity::create([
            'name' => 'SONABEL',
            'type' => 'SOCIETE_ETAT',
            'sector' => 'Énergie',
            'country_id' => $this->country->id,
            'size' => 'large',
            'establishment_date' => '1968-01-01',
        ]);

        $etablissementPublic = StateEntity::create([
            'name' => 'CHU-YO',
            'type' => 'ETABLISSEMENT_PUBLIC',
            'sector' => 'Santé',
            'country_id' => $this->country->id,
            'size' => 'medium',
            'establishment_date' => '1975-03-20',
        ]);

        $societeSessions = $societeDEtat->getApplicableSessionTypes();
        $etablissementSessions = $etablissementPublic->getApplicableSessionTypes();

        // Société d'État a toutes les sessions
        $this->assertContains('session_budgetaire', $societeSessions);
        $this->assertContains('arret_comptes', $societeSessions);
        $this->assertContains('assemblee_generale', $societeSessions);

        // Établissement Public a des sessions limitées
        $this->assertContains('session_budgetaire', $etablissementSessions);
        $this->assertContains('arret_comptes', $etablissementSessions);
        $this->assertNotContains('assemblee_generale', $etablissementSessions);
    }

    /** @test */
    public function state_entity_can_determine_regulatory_framework()
    {
        $entity = StateEntity::create([
            'name' => 'BCEAO Burkina',
            'type' => 'ETABLISSEMENT_PUBLIC',
            'sector' => 'Finance',
            'country_id' => $this->country->id,
            'size' => 'large',
            'establishment_date' => '1962-05-12',
        ]);

        $framework = $entity->getRegulatoryFramework();

        $this->assertArrayHasKey('ohada_applicable', $framework);
        $this->assertArrayHasKey('uemoa_applicable', $framework);
        $this->assertArrayHasKey('accounting_system', $framework);
        
        $this->assertTrue($framework['ohada_applicable']);
        $this->assertTrue($framework['uemoa_applicable']);
        $this->assertEquals('SYSCOHADA', $framework['accounting_system']);
    }

    /** @test */
    public function state_entity_can_calculate_performance_indicators()
    {
        $entity = StateEntity::create([
            'name' => 'AIR BURKINA',
            'type' => 'SOCIETE_ETAT',
            'sector' => 'Transport',
            'country_id' => $this->country->id,
            'size' => 'medium',
            'establishment_date' => '1967-01-01',
        ]);

        // Test avec des données simulées
        $kpis = $entity->calculateKPIs([
            'revenue' => 10000000,
            'expenses' => 8000000,
            'assets' => 50000000,
            'liabilities' => 30000000,
            'employees' => 250,
        ]);

        $this->assertArrayHasKey('profitability', $kpis);
        $this->assertArrayHasKey('liquidity', $kpis);
        $this->assertArrayHasKey('efficiency', $kpis);
        
        $this->assertEquals(20, $kpis['profitability']); // (10M - 8M) / 10M * 100
    }

    /** @test */
    public function state_entity_can_check_compliance_requirements()
    {
        $entity = StateEntity::create([
            'name' => 'ONATEL',
            'type' => 'SOCIETE_ETAT',
            'sector' => 'Télécommunications',
            'country_id' => $this->country->id,
            'size' => 'large',
            'establishment_date' => '1998-12-23',
        ]);

        $requirements = $entity->getComplianceRequirements();

        $this->assertArrayHasKey('ohada_requirements', $requirements);
        $this->assertArrayHasKey('uemoa_requirements', $requirements);
        $this->assertArrayHasKey('national_requirements', $requirements);
        
        // Vérifications OHADA
        $this->assertContains('Acte uniforme des sociétés commerciales', $requirements['ohada_requirements']);
        $this->assertContains('États financiers SYSCOHADA', $requirements['ohada_requirements']);
        
        // Vérifications UEMOA
        $this->assertContains('Directive surveillance multilatérale', $requirements['uemoa_requirements']);
        $this->assertContains('Code des marchés publics UEMOA', $requirements['uemoa_requirements']);
    }

    /** @test */
    public function state_entity_can_get_required_reports()
    {
        $entity = StateEntity::create([
            'name' => 'SOFITEX',
            'type' => 'SOCIETE_ETAT',
            'sector' => 'Agriculture',
            'country_id' => $this->country->id,
            'size' => 'large',
            'establishment_date' => '1979-07-02',
        ]);

        $reports = $entity->getRequiredReports();

        $this->assertIsArray($reports);
        $this->assertNotEmpty($reports);
        
        // Vérifier la présence de rapports obligatoires
        $reportTypes = array_column($reports, 'type');
        $this->assertContains('budget_annuel', $reportTypes);
        $this->assertContains('rapport_gestion', $reportTypes);
        $this->assertContains('etats_financiers', $reportTypes);
    }

    /** @test */
    public function state_entity_name_must_be_unique_per_country()
    {
        StateEntity::create([
            'name' => 'SONABEL',
            'type' => 'SOCIETE_ETAT',
            'sector' => 'Énergie',
            'country_id' => $this->country->id,
            'size' => 'large',
            'establishment_date' => '1968-01-01',
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        StateEntity::create([
            'name' => 'SONABEL', // Nom dupliqué dans le même pays
            'type' => 'ETABLISSEMENT_PUBLIC',
            'sector' => 'Autre',
            'country_id' => $this->country->id,
            'size' => 'medium',
            'establishment_date' => '2000-01-01',
        ]);
    }
}