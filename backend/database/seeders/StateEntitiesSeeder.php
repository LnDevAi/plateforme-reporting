<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\StateEntity;
use App\Models\Ministry;
use Carbon\Carbon;

class StateEntitiesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // S'assurer que les ministères existent
        $this->ensureMinistries();

        // Récupérer les ministères
        $ministryEconomie = Ministry::where('code', 'MINEFID')->first();
        $ministryEnergie = Ministry::where('code', 'ME')->first();
        $ministryTransport = Ministry::where('code', 'MIT')->first();
        $ministryAgriculture = Ministry::where('code', 'MAAH')->first();
        $ministryCommerce = Ministry::where('code', 'MCIT')->first();
        $ministryEducation = Ministry::where('code', 'MENAPLN')->first();

        // Sociétés d'État
        $societesEtat = [
            [
                'name' => 'Société Nationale d\'Électricité du Burkina',
                'code' => 'SONABEL',
                'type' => StateEntity::TYPE_SOCIETE_ETAT,
                'sector' => 'Énergie',
                'status' => 'active',
                'description' => 'Production, transport et distribution d\'énergie électrique sur l\'ensemble du territoire national',
                'technical_ministry_id' => $ministryEnergie?->id,
                'financial_ministry_id' => $ministryEconomie?->id,
                'director_general' => 'Dr. Batio BASSIERE',
                'board_president' => 'Prof. Marie OUEDRAOGO',
                'headquarters_address' => '01 BP 54 Ouagadougou 01, Burkina Faso',
                'contact_email' => 'sonabel@sonabel.bf',
                'contact_phone' => '+226 25 30 61 00',
                'website' => 'https://www.sonabel.bf',
                'establishment_date' => Carbon::parse('1968-01-15'),
                'capital_amount' => 65000000000, // 65 milliards FCFA
                'employee_count' => 3500,
                'annual_revenue' => 280000000000, // 280 milliards FCFA
                'is_active' => true,
                'metadata' => [
                    'isin_code' => 'BF0000000001',
                    'stock_exchange' => 'BRVM',
                    'audit_firm' => 'Ernst & Young',
                    'last_audit_date' => '2024-06-30',
                ]
            ],
            [
                'name' => 'Office National de l\'Eau et de l\'Assainissement',
                'code' => 'ONEA',
                'type' => StateEntity::TYPE_SOCIETE_ETAT,
                'sector' => 'Eau et Assainissement',
                'status' => 'active',
                'description' => 'Production et distribution d\'eau potable, collecte et traitement des eaux usées',
                'technical_ministry_id' => $ministryEnergie?->id,
                'financial_ministry_id' => $ministryEconomie?->id,
                'director_general' => 'Ing. Souleymane SOULAMA',
                'board_president' => 'Dr. Aminata KONE',
                'headquarters_address' => '01 BP 170 Ouagadougou 01, Burkina Faso',
                'contact_email' => 'onea@onea.bf',
                'contact_phone' => '+226 25 43 19 00',
                'website' => 'https://www.onea.bf',
                'establishment_date' => Carbon::parse('1985-03-20'),
                'capital_amount' => 45000000000, // 45 milliards FCFA
                'employee_count' => 2800,
                'annual_revenue' => 85000000000, // 85 milliards FCFA
                'is_active' => true,
                'metadata' => [
                    'isin_code' => 'BF0000000002',
                    'concession_area' => '56 centres urbains',
                    'water_production_capacity' => '180000 m³/jour',
                ]
            ],
            [
                'name' => 'Société Nationale des Postes du Burkina',
                'code' => 'SONAPOST',
                'type' => StateEntity::TYPE_SOCIETE_ETAT,
                'sector' => 'Services Postaux',
                'status' => 'active',
                'description' => 'Services postaux, financiers et de télécommunications',
                'technical_ministry_id' => $ministryCommerce?->id,
                'financial_ministry_id' => $ministryEconomie?->id,
                'director_general' => 'Mme. Rasmata OUEDRAOGO',
                'board_president' => 'M. Issiaka OUEDRAOGO',
                'headquarters_address' => '01 BP 10 Ouagadougou 01, Burkina Faso',
                'contact_email' => 'sonapost@sonapost.bf',
                'contact_phone' => '+226 25 30 62 00',
                'website' => 'https://www.sonapost.bf',
                'establishment_date' => Carbon::parse('1978-11-10'),
                'capital_amount' => 8000000000, // 8 milliards FCFA
                'employee_count' => 1200,
                'annual_revenue' => 25000000000, // 25 milliards FCFA
                'is_active' => true,
                'metadata' => [
                    'postal_offices_count' => 147,
                    'financial_services' => true,
                    'express_services' => true,
                ]
            ],
        ];

        // Établissements Publics
        $etablissementsPublics = [
            [
                'name' => 'Centre Hospitalier Universitaire Yalgado Ouédraogo',
                'code' => 'CHU-YO',
                'type' => StateEntity::TYPE_ETABLISSEMENT_PUBLIC,
                'sector' => 'Santé',
                'status' => 'active',
                'description' => 'Soins de santé de référence, formation médicale et recherche',
                'technical_ministry_id' => $ministryEducation?->id, // Santé sous Education pour simplifier
                'financial_ministry_id' => $ministryEconomie?->id,
                'director_general' => 'Prof. Dr. Adama LENGANI',
                'board_president' => 'Dr. Claudine LOUGUE',
                'headquarters_address' => '03 BP 7022 Ouagadougou 03, Burkina Faso',
                'contact_email' => 'chu.yo@chu-yo.bf',
                'contact_phone' => '+226 25 30 70 00',
                'website' => 'https://www.chu-yo.bf',
                'establishment_date' => Carbon::parse('1970-06-15'),
                'capital_amount' => null,
                'employee_count' => 2500,
                'annual_revenue' => null,
                'is_active' => true,
                'metadata' => [
                    'bed_capacity' => 669,
                    'specialties_count' => 28,
                    'medical_students' => 1200,
                    'research_units' => 15,
                ]
            ],
            [
                'name' => 'Université Joseph Ki-Zerbo',
                'code' => 'UJKZ',
                'type' => StateEntity::TYPE_ETABLISSEMENT_PUBLIC,
                'sector' => 'Éducation',
                'status' => 'active',
                'description' => 'Enseignement supérieur, formation et recherche scientifique',
                'technical_ministry_id' => $ministryEducation?->id,
                'financial_ministry_id' => $ministryEconomie?->id,
                'director_general' => 'Prof. Dr. Rasmané SEMDE',
                'board_president' => 'Prof. Alkassoum MAIGA',
                'headquarters_address' => '03 BP 7021 Ouagadougou 03, Burkina Faso',
                'contact_email' => 'rectorat@ujkz.bf',
                'contact_phone' => '+226 25 30 70 64',
                'website' => 'https://www.ujkz.bf',
                'establishment_date' => Carbon::parse('1974-12-01'),
                'capital_amount' => null,
                'employee_count' => 1800,
                'annual_revenue' => null,
                'is_active' => true,
                'metadata' => [
                    'student_count' => 45000,
                    'faculties_count' => 7,
                    'research_laboratories' => 25,
                    'international_partnerships' => 85,
                ]
            ],
            [
                'name' => 'Agence Nationale de Promotion de l\'Emploi',
                'code' => 'ANPE',
                'type' => StateEntity::TYPE_ETABLISSEMENT_PUBLIC,
                'sector' => 'Emploi',
                'status' => 'active',
                'description' => 'Promotion de l\'emploi, placement et formation professionnelle',
                'technical_ministry_id' => $ministryEducation?->id, // Fonction publique sous Education pour simplifier
                'financial_ministry_id' => $ministryEconomie?->id,
                'director_general' => 'M. Boubacar SAWADOGO',
                'board_president' => 'Mme. Fatoumata OUATTARA',
                'headquarters_address' => '01 BP 1183 Ouagadougou 01, Burkina Faso',
                'contact_email' => 'anpe@anpe.bf',
                'contact_phone' => '+226 25 31 18 37',
                'website' => 'https://www.anpe.bf',
                'establishment_date' => Carbon::parse('1999-05-20'),
                'capital_amount' => null,
                'employee_count' => 350,
                'annual_revenue' => null,
                'is_active' => true,
                'metadata' => [
                    'regional_offices' => 13,
                    'job_seekers_registered' => 125000,
                    'training_programs' => 45,
                    'employer_partnerships' => 2800,
                ]
            ],
        ];

        // Autres entités
        $autresEntites = [
            [
                'name' => 'Conseil Économique et Social',
                'code' => 'CES',
                'type' => StateEntity::TYPE_AUTRES,
                'sector' => 'Conseil',
                'status' => 'active',
                'description' => 'Organe consultatif sur les questions économiques et sociales',
                'technical_ministry_id' => $ministryEconomie?->id,
                'financial_ministry_id' => $ministryEconomie?->id,
                'director_general' => 'M. Paul KABA',
                'board_president' => 'Prof. Gisèle GUIGMA',
                'headquarters_address' => '01 BP 6162 Ouagadougou 01, Burkina Faso',
                'contact_email' => 'ces@ces.bf',
                'contact_phone' => '+226 25 32 47 32',
                'website' => 'https://www.ces.bf',
                'establishment_date' => Carbon::parse('1995-04-10'),
                'capital_amount' => null,
                'employee_count' => 120,
                'annual_revenue' => null,
                'is_active' => true,
                'metadata' => [
                    'members_count' => 90,
                    'commissions' => 6,
                    'annual_sessions' => 4,
                    'advisory_reports' => 25,
                ]
            ],
            [
                'name' => 'Chambre de Commerce et d\'Industrie du Burkina Faso',
                'code' => 'CCI-BF',
                'type' => StateEntity::TYPE_AUTRES,
                'sector' => 'Commerce',
                'status' => 'active',
                'description' => 'Représentation et promotion du secteur privé',
                'technical_ministry_id' => $ministryCommerce?->id,
                'financial_ministry_id' => $ministryEconomie?->id,
                'director_general' => 'M. Idrissa NIKIEMA',
                'board_president' => 'Mme. Mariam OUEDRAOGO',
                'headquarters_address' => '01 BP 502 Ouagadougou 01, Burkina Faso',
                'contact_email' => 'cci@cci.bf',
                'contact_phone' => '+226 25 30 61 14',
                'website' => 'https://www.cci.bf',
                'establishment_date' => Carbon::parse('1962-07-01'),
                'capital_amount' => null,
                'employee_count' => 180,
                'annual_revenue' => null,
                'is_active' => true,
                'metadata' => [
                    'member_companies' => 3500,
                    'regional_chambers' => 8,
                    'business_services' => 15,
                    'trade_missions_annual' => 12,
                ]
            ],
            [
                'name' => 'Autorité de Régulation des Communications Électroniques',
                'code' => 'ARCEP',
                'type' => StateEntity::TYPE_AUTRES,
                'sector' => 'Télécommunications',
                'status' => 'active',
                'description' => 'Régulation du secteur des communications électroniques',
                'technical_ministry_id' => $ministryCommerce?->id,
                'financial_ministry_id' => $ministryEconomie?->id,
                'director_general' => 'M. Abdoul-Fatah KINDA',
                'board_president' => 'Prof. Télesphore BENON',
                'headquarters_address' => '01 BP 6437 Ouagadougou 01, Burkina Faso',
                'contact_email' => 'arcep@arcep.bf',
                'contact_phone' => '+226 25 37 59 00',
                'website' => 'https://www.arcep.bf',
                'establishment_date' => Carbon::parse('2008-12-31'),
                'capital_amount' => null,
                'employee_count' => 85,
                'annual_revenue' => null,
                'is_active' => true,
                'metadata' => [
                    'licensed_operators' => 6,
                    'spectrum_bands_managed' => 25,
                    'consumer_complaints' => 450,
                    'market_studies_annual' => 8,
                ]
            ],
        ];

        // Insérer toutes les entités
        $allEntities = array_merge($societesEtat, $etablissementsPublics, $autresEntites);

        foreach ($allEntities as $entityData) {
            StateEntity::create($entityData);
        }

        $this->command->info('✅ ' . count($allEntities) . ' structures EPE créées avec succès !');
        $this->command->info('📊 Répartition :');
        $this->command->info('   🏛️  Sociétés d\'État : ' . count($societesEtat));
        $this->command->info('   🏢  Établissements Publics : ' . count($etablissementsPublics));
        $this->command->info('   📋  Autres : ' . count($autresEntites));
    }

    /**
     * S'assurer que les ministères de base existent
     */
    private function ensureMinistries()
    {
        $ministries = [
            [
                'name' => 'Ministère de l\'Économie, des Finances et de la Prospective',
                'code' => 'MINEFID',
                'type' => 'financial',
                'description' => 'Politique économique, finances publiques et prospective',
                'minister_name' => 'Dr. Aboubakar NACANABO',
                'contact_email' => 'sg@minefid.gov.bf',
                'contact_phone' => '+226 25 32 42 11',
                'address' => '03 BP 7008 Ouagadougou 03',
                'is_active' => true,
            ],
            [
                'name' => 'Ministère de l\'Énergie, des Mines et des Carrières',
                'code' => 'ME',
                'type' => 'technical',
                'description' => 'Politique énergétique et des ressources minières',
                'minister_name' => 'Ing. Boubacar ZAKARIA',
                'contact_email' => 'sg@energie.gov.bf',
                'contact_phone' => '+226 25 32 49 99',
                'address' => '01 BP 644 Ouagadougou 01',
                'is_active' => true,
            ],
            [
                'name' => 'Ministère des Infrastructures et du Désenclavement',
                'code' => 'MIT',
                'type' => 'technical',
                'description' => 'Infrastructures de transport et désenclavement',
                'minister_name' => 'M. Eric Bougouma',
                'contact_email' => 'sg@mit.gov.bf',
                'contact_phone' => '+226 25 32 47 85',
                'address' => '03 BP 7004 Ouagadougou 03',
                'is_active' => true,
            ],
            [
                'name' => 'Ministère de l\'Agriculture, de l\'Hydraulique et des Ressources Halieutiques',
                'code' => 'MAAH',
                'type' => 'technical',
                'description' => 'Politique agricole, hydraulique et halieutique',
                'minister_name' => 'Dr. Paulin OUEDRAOGO',
                'contact_email' => 'sg@maah.gov.bf',
                'contact_phone' => '+226 25 49 99 00',
                'address' => '03 BP 7010 Ouagadougou 03',
                'is_active' => true,
            ],
            [
                'name' => 'Ministère du Commerce, de l\'Industrie et de l\'Artisanat',
                'code' => 'MCIT',
                'type' => 'technical',
                'description' => 'Politique commerciale, industrielle et artisanale',
                'minister_name' => 'Mme. Serge Poda',
                'contact_email' => 'sg@commerce.gov.bf',
                'contact_phone' => '+226 25 32 46 14',
                'address' => '01 BP 514 Ouagadougou 01',
                'is_active' => true,
            ],
            [
                'name' => 'Ministère de l\'Éducation Nationale, de l\'Alphabétisation et de la Promotion des Langues Nationales',
                'code' => 'MENAPLN',
                'type' => 'technical',
                'description' => 'Politique éducative et promotion des langues nationales',
                'minister_name' => 'Prof. André OUEDRAOGO',
                'contact_email' => 'sg@education.gov.bf',
                'contact_phone' => '+226 25 33 55 36',
                'address' => '03 BP 7032 Ouagadougou 03',
                'is_active' => true,
            ],
        ];

        foreach ($ministries as $ministryData) {
            Ministry::firstOrCreate(
                ['code' => $ministryData['code']],
                $ministryData
            );
        }
    }
}