<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;

class CustomCoursesSeeder extends Seeder
{
    /**
     * Modules de formation basés sur les documents fournis
     * Créés spécialement pour vos formations EPE Burkina Faso
     */
    public function run()
    {
        // Module 1: Gouvernance et Administration des EPE
        $this->createGovernanceModule();
        
        // Module 2: Audit Interne et Analyse Financière des EPE
        $this->createAuditModule();
    }

    /**
     * MODULE 1: Gouvernance et Administration des EPE
     * Basé sur vos documents de gouvernance et formation administrateurs
     */
    private function createGovernanceModule()
    {
        $course = Course::updateOrCreate(
            ['code' => 'EPE-GOV-BF-2024'],
            [
                'title' => 'Gouvernance et Administration des EPE - Burkina Faso',
                'description' => 'Formation complète sur la gouvernance des entreprises publiques au Burkina Faso, basée sur les documents officiels et les meilleures pratiques.',
                'category' => 'governance',
                'level' => 'intermediate',
                'duration_hours' => 20,
                'instructor_name' => 'Expert EPE Burkina Faso',
                'instructor_bio' => 'Formation développée à partir des documents officiels et de l\'expertise terrain des EPE burkinabé.',
                'instructor_credentials' => 'Documents officiels EPE + Formation MISSIONS ET ATTRIBUTIONS DE L\'ADMINISTRATEUR',
                'objectives' => [
                    'Maîtriser les missions et attributions des administrateurs d\'EPE',
                    'Comprendre le cadre réglementaire burkinabé des EPE',
                    'Appliquer les bonnes pratiques de gouvernance BPGSE',
                    'Organiser et animer efficacement les conseils d\'administration',
                    'Gérer les assemblées générales selon les normes OHADA',
                    'Assurer la transparence et la redevabilité'
                ],
                'prerequisites' => [
                    'Connaissance de base du droit des sociétés',
                    'Expérience en gestion d\'entreprise (recommandée)',
                    'Familiarité avec le contexte EPE africain'
                ],
                'target_audience' => [
                    'Administrateurs d\'EPE',
                    'Présidents de Conseil d\'Administration (PCA)',
                    'Directeurs Généraux d\'EPE',
                    'Membres de comités spécialisés',
                    'Responsables de gouvernance'
                ],
                'certification_body' => 'platform_internal',
                'certification_level' => 'professional',
                'subscription_plan_requirements' => ['professional', 'enterprise', 'government'],
                'is_mandatory' => false,
                'media_urls' => [
                    'presentation' => 'formations/modules-gouvernance/administrateurs/FORMATION MISSIONS ET ATTRIBUTIONS DE L\'ADMINISTRATEUR.pptx',
                    'documents' => [
                        'docs/knowledge-base/epe-burkina/modeles-documents/Code BPGSE adopté AGSE 30 juin 2015.pdf',
                        'docs/knowledge-base/epe-burkina/modeles-documents/décret portant attributions des PCA des SE.pdf',
                        'docs/knowledge-base/epe-burkina/modeles-documents/décret portant organisation de l\'AG-SE.pdf'
                    ]
                ],
                'tags' => ['EPE', 'Gouvernance', 'Burkina Faso', 'OHADA', 'Administrateurs', 'PCA'],
                'regulatory_framework' => 'OHADA',
                'applicable_countries' => ['BF'],
                'language' => 'fr',
                'price' => 0, // Gratuit pour les utilisateurs avec abonnement approprié
                'status' => 'published'
            ]
        );

        // Modules du cours de gouvernance
        $this->createGovernanceModules($course);
    }

    /**
     * Créer les modules pour le cours de gouvernance
     */
    private function createGovernanceModules($course)
    {
        // Module 1: Fondamentaux des EPE au Burkina Faso
        $module1 = CourseModule::updateOrCreate(
            ['course_id' => $course->id, 'sort_order' => 1],
            [
                'title' => 'Fondamentaux des EPE au Burkina Faso',
                'description' => 'Cadre légal et réglementaire des entreprises publiques burkinabé',
                'objectives' => [
                    'Comprendre le statut juridique des EPE',
                    'Maîtriser les textes fondateurs',
                    'Identifier les spécificités burkinabé'
                ],
                'duration_hours' => 4,
                'sort_order' => 1,
                'status' => 'published'
            ]
        );

        $this->createLessonsForModule($module1, [
            [
                'title' => 'Introduction aux EPE : Définitions et Classifications',
                'type' => 'text',
                'content' => 'Les entreprises publiques constituent un pilier essentiel de l\'économie burkinabé. Selon la loi 025-99 AN du 16 novembre 1999, elles se déclinent en trois catégories principales : les Sociétés d\'État, les Établissements Publics à caractère industriel et commercial, et les Sociétés d\'économie mixte.',
                'duration_minutes' => 45
            ],
            [
                'title' => 'Cadre Législatif et Réglementaire',
                'type' => 'text',
                'content' => 'Le cadre juridique des EPE burkinabé s\'articule autour de plusieurs textes fondamentaux : la loi 025-99 AN, les décrets d\'application, et les statuts spécifiques. Ces textes définissent l\'organisation, le fonctionnement et le contrôle des EPE.',
                'duration_minutes' => 60
            ],
            [
                'title' => 'Types d\'EPE et Spécificités',
                'type' => 'interactive',
                'content' => 'Étude comparative des trois types d\'EPE avec cas pratiques d\'application.',
                'duration_minutes' => 45
            ]
        ]);

        // Module 2: Missions et Attributions des Administrateurs
        $module2 = CourseModule::updateOrCreate(
            ['course_id' => $course->id, 'sort_order' => 2],
            [
                'title' => 'Missions et Attributions des Administrateurs',
                'description' => 'Rôles, responsabilités et devoirs des administrateurs d\'EPE',
                'objectives' => [
                    'Définir les missions de l\'administrateur',
                    'Comprendre les responsabilités fiduciaires',
                    'Maîtriser les processus décisionnels'
                ],
                'duration_hours' => 5,
                'sort_order' => 2,
                'status' => 'published'
            ]
        );

        $this->createLessonsForModule($module2, [
            [
                'title' => 'Rôles et Responsabilités Fiduciaires',
                'type' => 'video',
                'content' => 'Formation complète sur les devoirs de diligence, de loyauté et de surveillance des administrateurs.',
                'duration_minutes' => 75
            ],
            [
                'title' => 'Processus Décisionnels au Conseil',
                'type' => 'text',
                'content' => 'Méthodologie de prise de décision au sein du conseil d\'administration : préparation, délibération, vote et suivi.',
                'duration_minutes' => 60
            ],
            [
                'title' => 'Gestion des Conflits d\'Intérêts',
                'type' => 'quiz',
                'content' => 'Cas pratiques de gestion des situations de conflits d\'intérêts.',
                'duration_minutes' => 30
            ]
        ]);

        // Module 3: Organisation et Fonctionnement du CA
        $module3 = CourseModule::updateOrCreate(
            ['course_id' => $course->id, 'sort_order' => 3],
            [
                'title' => 'Organisation et Fonctionnement du Conseil d\'Administration',
                'description' => 'Procédures d\'organisation et d\'animation du conseil d\'administration',
                'objectives' => [
                    'Organiser les réunions du CA',
                    'Animer efficacement les débats',
                    'Assurer le suivi des décisions'
                ],
                'duration_hours' => 4,
                'sort_order' => 3,
                'status' => 'published'
            ]
        );

        // Module 4: Assemblées Générales et Transparence
        $module4 = CourseModule::updateOrCreate(
            ['course_id' => $course->id, 'sort_order' => 4],
            [
                'title' => 'Assemblées Générales et Transparence',
                'description' => 'Organisation des AG et mise en œuvre de la transparence',
                'objectives' => [
                    'Organiser les assemblées générales',
                    'Assurer la transparence des activités',
                    'Respecter les obligations de publication'
                ],
                'duration_hours' => 3,
                'sort_order' => 4,
                'status' => 'published'
            ]
        );

        // Module 5: Code de Bonnes Pratiques BPGSE
        $module5 = CourseModule::updateOrCreate(
            ['course_id' => $course->id, 'sort_order' => 5],
            [
                'title' => 'Code de Bonnes Pratiques de Gouvernance (BPGSE)',
                'description' => 'Application du code BPGSE adopté le 30 juin 2015',
                'objectives' => [
                    'Comprendre les principes BPGSE',
                    'Appliquer les bonnes pratiques',
                    'Évaluer la gouvernance'
                ],
                'duration_hours' => 4,
                'sort_order' => 5,
                'status' => 'published'
            ]
        );
    }

    /**
     * MODULE 2: Audit Interne et Analyse Financière des EPE
     * Basé sur votre formation AUDCIF ET ANALYSE DES ETATS FINANCIERS
     */
    private function createAuditModule()
    {
        $course = Course::updateOrCreate(
            ['code' => 'EPE-AUDIT-BF-2024'],
            [
                'title' => 'Audit Interne et Analyse Financière des EPE',
                'description' => 'Formation spécialisée en audit interne et analyse financière adaptée aux spécificités des entreprises publiques burkinabé.',
                'category' => 'audit_finance',
                'level' => 'advanced',
                'duration_hours' => 25,
                'instructor_name' => 'Expert Audit EPE',
                'instructor_bio' => 'Formation développée à partir de l\'expertise audit interne et analyse financière spécialisée EPE.',
                'instructor_credentials' => 'Formation AUDCIF ET ANALYSE DES ETATS FINANCIERS + Documents EPE',
                'objectives' => [
                    'Maîtriser les méthodologies d\'audit interne des EPE',
                    'Analyser et interpréter les états financiers selon SYSCOHADA',
                    'Détecter les anomalies et risques financiers',
                    'Évaluer la performance financière des EPE',
                    'Rédiger des rapports d\'audit efficaces',
                    'Appliquer les normes internationales d\'audit'
                ],
                'prerequisites' => [
                    'Formation comptable de base (SYSCOHADA)',
                    'Expérience en audit ou contrôle de gestion',
                    'Connaissance des EPE africaines'
                ],
                'target_audience' => [
                    'Auditeurs internes d\'EPE',
                    'Contrôleurs de gestion',
                    'Analystes financiers',
                    'Commissaires aux comptes',
                    'Responsables financiers EPE'
                ],
                'certification_body' => 'platform_internal',
                'certification_level' => 'expert',
                'subscription_plan_requirements' => ['enterprise', 'government'],
                'is_mandatory' => false,
                'media_urls' => [
                    'presentation' => 'formations/modules-gouvernance/audit-interne/FORMATION AUDCIF ET ANALYSE DES ETATS FINANCIERS.pptx',
                    'documents' => [
                        'docs/knowledge-base/epe-burkina/modeles-documents/canevas de présentation du rapport de gestion du CA à l\'AG-SE.doc',
                        'docs/knowledge-base/epe-burkina/modeles-documents/Canevas du rapport du PCA sur le contrôle interne à l\'AG-SE.doc'
                    ]
                ],
                'tags' => ['Audit', 'Finance', 'EPE', 'SYSCOHADA', 'Analyse Financière', 'Contrôle Interne'],
                'regulatory_framework' => 'SYSCOHADA',
                'applicable_countries' => ['BF'],
                'language' => 'fr',
                'price' => 0,
                'status' => 'published'
            ]
        );

        // Modules du cours d'audit
        $this->createAuditModules($course);
    }

    /**
     * Créer les modules pour le cours d'audit
     */
    private function createAuditModules($course)
    {
        // Module 1: Fondamentaux de l'Audit Interne EPE
        $module1 = CourseModule::updateOrCreate(
            ['course_id' => $course->id, 'sort_order' => 1],
            [
                'title' => 'Fondamentaux de l\'Audit Interne EPE',
                'description' => 'Principes et méthodologies d\'audit interne adaptés aux EPE',
                'objectives' => [
                    'Comprendre les spécificités de l\'audit EPE',
                    'Maîtriser les normes internationales',
                    'Développer une approche par les risques'
                ],
                'duration_hours' => 6,
                'sort_order' => 1,
                'status' => 'published'
            ]
        );

        $this->createLessonsForModule($module1, [
            [
                'title' => 'Spécificités de l\'Audit des EPE',
                'type' => 'text',
                'content' => 'L\'audit des entreprises publiques présente des particularités liées à leur mission de service public, leur gouvernance spécifique et leur environnement réglementaire complexe.',
                'duration_minutes' => 90
            ],
            [
                'title' => 'Normes Internationales d\'Audit Interne',
                'type' => 'video',
                'content' => 'Application des normes IIA (Institute of Internal Auditors) dans le contexte des EPE africaines.',
                'duration_minutes' => 75
            ],
            [
                'title' => 'Approche par les Risques',
                'type' => 'interactive',
                'content' => 'Méthodologie d\'identification, d\'évaluation et de hiérarchisation des risques EPE.',
                'duration_minutes' => 75
            ]
        ]);

        // Module 2: États Financiers et SYSCOHADA
        $module2 = CourseModule::updateOrCreate(
            ['course_id' => $course->id, 'sort_order' => 2],
            [
                'title' => 'États Financiers et Référentiel SYSCOHADA',
                'description' => 'Lecture et analyse des états financiers selon SYSCOHADA',
                'objectives' => [
                    'Maîtriser le référentiel SYSCOHADA',
                    'Analyser les états financiers',
                    'Identifier les spécificités EPE'
                ],
                'duration_hours' => 7,
                'sort_order' => 2,
                'status' => 'published'
            ]
        );

        $this->createLessonsForModule($module2, [
            [
                'title' => 'Le Bilan SYSCOHADA des EPE',
                'type' => 'text',
                'content' => 'Structure et analyse du bilan selon le plan comptable SYSCOHADA, avec focus sur les spécificités des EPE.',
                'duration_minutes' => 105
            ],
            [
                'title' => 'Compte de Résultat et Performance',
                'type' => 'video',
                'content' => 'Analyse de la performance financière à travers le compte de résultat des EPE.',
                'duration_minutes' => 90
            ],
            [
                'title' => 'TAFIRE et Flux de Trésorerie',
                'type' => 'interactive',
                'content' => 'Tableau Financier des Ressources et Emplois : construction et analyse.',
                'duration_minutes' => 90
            ],
            [
                'title' => 'État Annexé et Informations Complémentaires',
                'type' => 'text',
                'content' => 'Exploitation de l\'état annexé pour une analyse financière complète.',
                'duration_minutes' => 75
            ]
        ]);

        // Module 3: Analyse Financière et Ratios
        $module3 = CourseModule::updateOrCreate(
            ['course_id' => $course->id, 'sort_order' => 3],
            [
                'title' => 'Analyse Financière et Ratios EPE',
                'description' => 'Techniques d\'analyse financière et calcul des ratios spécialisés',
                'objectives' => [
                    'Calculer et interpréter les ratios',
                    'Évaluer la performance financière',
                    'Identifier les signaux d\'alerte'
                ],
                'duration_hours' => 6,
                'sort_order' => 3,
                'status' => 'published'
            ]
        );

        // Module 4: Détection d'Anomalies et Contrôles
        $module4 = CourseModule::updateOrCreate(
            ['course_id' => $course->id, 'sort_order' => 4],
            [
                'title' => 'Détection d\'Anomalies et Contrôles',
                'description' => 'Techniques de détection des irrégularités et mise en place de contrôles',
                'objectives' => [
                    'Détecter les anomalies comptables',
                    'Concevoir des contrôles efficaces',
                    'Prévenir les risques de fraude'
                ],
                'duration_hours' => 6,
                'sort_order' => 4,
                'status' => 'published'
            ]
        );
    }

    /**
     * Créer les leçons pour un module donné
     */
    private function createLessonsForModule($module, $lessonsData)
    {
        foreach ($lessonsData as $index => $lessonData) {
            Lesson::updateOrCreate(
                [
                    'course_module_id' => $module->id,
                    'sort_order' => $index + 1
                ],
                [
                    'title' => $lessonData['title'],
                    'description' => $lessonData['content'],
                    'type' => $lessonData['type'],
                    'content' => $lessonData['content'],
                    'duration_minutes' => $lessonData['duration_minutes'],
                    'sort_order' => $index + 1,
                    'status' => 'published'
                ]
            );
        }
    }
}