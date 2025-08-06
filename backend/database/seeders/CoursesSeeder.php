<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Course;

class CoursesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $courses = Course::getDefaultCourses();

        foreach ($courses as $courseData) {
            Course::updateOrCreate(
                ['code' => $courseData['code']],
                $courseData
            );
        }

        $this->command->info('Cours de formation créés avec succès !');
        $this->command->table(
            ['Code', 'Titre', 'Catégorie', 'Niveau', 'Durée (h)', 'Certification', 'Langue'],
            collect($courses)->map(function ($course) {
                return [
                    $course['code'],
                    $course['title'],
                    $course['category'],
                    $course['level'],
                    $course['duration_hours'],
                    $course['certification_available'] ? '✓' : '✗',
                    $course['language'],
                ];
            })->toArray()
        );

        // Créer des modules et leçons de base pour chaque cours
        $this->createSampleModules();
    }

    /**
     * Crée des modules et leçons d'exemple pour les cours
     */
    protected function createSampleModules(): void
    {
        $courses = Course::all();

        foreach ($courses as $course) {
            $this->createModulesForCourse($course);
        }
    }

    /**
     * Crée des modules spécifiques pour un cours
     */
    protected function createModulesForCourse(Course $course): void
    {
        $moduleTemplates = $this->getModuleTemplates($course->category);

        foreach ($moduleTemplates as $index => $moduleData) {
            $module = \App\Models\CourseModule::updateOrCreate([
                'course_id' => $course->id,
                'sort_order' => $index + 1,
            ], array_merge($moduleData, [
                'course_id' => $course->id,
                'sort_order' => $index + 1,
                'status' => 'active',
            ]));

            $this->createLessonsForModule($module, $moduleData['lessons'] ?? []);
        }
    }

    /**
     * Crée des leçons pour un module
     */
    protected function createLessonsForModule(\App\Models\CourseModule $module, array $lessons): void
    {
        foreach ($lessons as $index => $lessonData) {
            \App\Models\Lesson::updateOrCreate([
                'course_module_id' => $module->id,
                'sort_order' => $index + 1,
            ], array_merge($lessonData, [
                'course_module_id' => $module->id,
                'sort_order' => $index + 1,
                'status' => 'active',
            ]));
        }
    }

    /**
     * Obtient les templates de modules selon la catégorie
     */
    protected function getModuleTemplates(string $category): array
    {
        $templates = [
            'governance' => [
                [
                    'title' => 'Introduction à la Gouvernance',
                    'description' => 'Concepts fondamentaux de la gouvernance d\'entreprise',
                    'duration_hours' => 2.5,
                    'learning_objectives' => [
                        'Comprendre les principes de base de la gouvernance',
                        'Identifier les parties prenantes clés',
                        'Maîtriser le cadre réglementaire OHADA'
                    ],
                    'lessons' => [
                        [
                            'title' => 'Définition et enjeux de la gouvernance',
                            'type' => 'video',
                            'duration_minutes' => 30,
                            'content' => 'Introduction aux concepts clés de la gouvernance d\'entreprise publique.'
                        ],
                        [
                            'title' => 'Cadre juridique OHADA',
                            'type' => 'text',
                            'duration_minutes' => 45,
                            'content' => 'Étude détaillée des textes OHADA applicables à la gouvernance.'
                        ],
                        [
                            'title' => 'Quiz : Concepts fondamentaux',
                            'type' => 'quiz',
                            'duration_minutes' => 15,
                            'passing_score' => 70
                        ]
                    ]
                ],
                [
                    'title' => 'Le Conseil d\'Administration',
                    'description' => 'Rôles, responsabilités et fonctionnement du CA',
                    'duration_hours' => 3.0,
                    'learning_objectives' => [
                        'Maîtriser le rôle et les responsabilités du CA',
                        'Comprendre les règles de fonctionnement',
                        'Appliquer les bonnes pratiques'
                    ],
                    'lessons' => [
                        [
                            'title' => 'Composition et nomination des administrateurs',
                            'type' => 'text',
                            'duration_minutes' => 40,
                            'content' => 'Critères de sélection et processus de nomination.'
                        ],
                        [
                            'title' => 'Responsabilités fiduciaires',
                            'type' => 'video',
                            'duration_minutes' => 50,
                            'content' => 'Obligations légales et éthiques des administrateurs.'
                        ],
                        [
                            'title' => 'Conduite des réunions du CA',
                            'type' => 'interactive',
                            'duration_minutes' => 45,
                            'content' => 'Simulation de séance du conseil d\'administration.'
                        ]
                    ]
                ],
                [
                    'title' => 'Transparence et Redevabilité',
                    'description' => 'Mécanismes de transparence et obligation de rendre compte',
                    'duration_hours' => 2.0,
                    'learning_objectives' => [
                        'Mettre en place des mécanismes de transparence',
                        'Gérer la communication avec les parties prenantes',
                        'Assurer la conformité réglementaire'
                    ],
                    'lessons' => [
                        [
                            'title' => 'Reporting financier et extra-financier',
                            'type' => 'text',
                            'duration_minutes' => 35,
                            'content' => 'Obligations de publication et de communication.'
                        ],
                        [
                            'title' => 'Relations avec les parties prenantes',
                            'type' => 'video',
                            'duration_minutes' => 40,
                            'content' => 'Stratégies de communication et d\'engagement.'
                        ],
                        [
                            'title' => 'Évaluation finale',
                            'type' => 'quiz',
                            'duration_minutes' => 45,
                            'passing_score' => 75
                        ]
                    ]
                ]
            ],

            'financial_management' => [
                [
                    'title' => 'Fondamentaux SYSCOHADA',
                    'description' => 'Principes comptables et plan de comptes',
                    'duration_hours' => 4.0,
                    'lessons' => [
                        [
                            'title' => 'Plan comptable SYSCOHADA révisé',
                            'type' => 'text',
                            'duration_minutes' => 60,
                            'content' => 'Structure et utilisation du plan comptable.'
                        ],
                        [
                            'title' => 'Principes comptables fondamentaux',
                            'type' => 'video',
                            'duration_minutes' => 90,
                            'content' => 'Application des principes dans le contexte EPE.'
                        ]
                    ]
                ],
                [
                    'title' => 'États Financiers',
                    'description' => 'Élaboration et présentation des états financiers',
                    'duration_hours' => 6.0,
                    'lessons' => [
                        [
                            'title' => 'Bilan SYSCOHADA',
                            'type' => 'interactive',
                            'duration_minutes' => 120,
                            'content' => 'Construction pas à pas du bilan.'
                        ],
                        [
                            'title' => 'Compte de résultat',
                            'type' => 'text',
                            'duration_minutes' => 90,
                            'content' => 'Présentation et analyse du compte de résultat.'
                        ]
                    ]
                ]
            ],

            'compliance' => [
                [
                    'title' => 'Cadre Réglementaire UEMOA',
                    'description' => 'Directives et obligations communautaires',
                    'duration_hours' => 3.0,
                    'lessons' => [
                        [
                            'title' => 'Directives de surveillance multilatérale',
                            'type' => 'text',
                            'duration_minutes' => 60,
                            'content' => 'Critères de convergence et obligations.'
                        ],
                        [
                            'title' => 'Code des marchés publics UEMOA',
                            'type' => 'video',
                            'duration_minutes' => 90,
                            'content' => 'Procédures et obligations de transparence.'
                        ]
                    ]
                ]
            ],

            'leadership' => [
                [
                    'title' => 'Leadership Transformationnel',
                    'description' => 'Développer un leadership efficace',
                    'duration_hours' => 4.0,
                    'lessons' => [
                        [
                            'title' => 'Styles de leadership',
                            'type' => 'interactive',
                            'duration_minutes' => 90,
                            'content' => 'Auto-évaluation et développement du style.'
                        ],
                        [
                            'title' => 'Communication et influence',
                            'type' => 'video',
                            'duration_minutes' => 120,
                            'content' => 'Techniques de communication persuasive.'
                        ]
                    ]
                ]
            ],

            'risk_management' => [
                [
                    'title' => 'Identification des Risques',
                    'description' => 'Méthodologies d\'identification et d\'évaluation',
                    'duration_hours' => 3.0,
                    'lessons' => [
                        [
                            'title' => 'Cartographie des risques',
                            'type' => 'interactive',
                            'duration_minutes' => 90,
                            'content' => 'Outils et techniques de cartographie.'
                        ]
                    ]
                ]
            ]
        ];

        return $templates[$category] ?? [
            [
                'title' => 'Module Général',
                'description' => 'Contenu de base',
                'duration_hours' => 2.0,
                'lessons' => [
                    [
                        'title' => 'Introduction',
                        'type' => 'text',
                        'duration_minutes' => 60,
                        'content' => 'Contenu introductif du module.'
                    ]
                ]
            ]
        ];
    }
}