<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\CustomCoursesSeeder;

class SetupCustomELearningModules extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'elearning:setup-custom-modules 
                            {--force : Force la recréation des modules existants}';

    /**
     * The console command description.
     */
    protected $description = 'Configure les modules e-learning basés sur vos formations EPE Burkina Faso';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🎓 Configuration des modules e-learning personnalisés...');
        $this->newLine();

        // Vérifier que les tables e-learning existent
        if (!$this->tablesExist()) {
            $this->error('❌ Les tables e-learning n\'existent pas. Veuillez d\'abord exécuter les migrations :');
            $this->line('   php artisan migrate');
            return 1;
        }

        // Afficher les informations sur les modules à créer
        $this->displayModuleInfo();

        if (!$this->option('force') && !$this->confirm('Continuer avec la création des modules ?', true)) {
            $this->info('Opération annulée.');
            return 0;
        }

        try {
            // Exécuter le seeder personnalisé
            $this->info('📚 Création des modules de formation...');
            
            $seeder = new CustomCoursesSeeder();
            $seeder->run();

            $this->newLine();
            $this->info('✅ Modules e-learning créés avec succès !');
            $this->newLine();

            $this->displaySuccessInfo();

        } catch (\Exception $e) {
            $this->error('❌ Erreur lors de la création des modules :');
            $this->error($e->getMessage());
            return 1;
        }

        return 0;
    }

    /**
     * Vérifier que les tables nécessaires existent
     */
    private function tablesExist(): bool
    {
        $tables = ['courses', 'course_modules', 'lessons', 'course_enrollments'];
        
        foreach ($tables as $table) {
            if (!\Schema::hasTable($table)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Afficher les informations sur les modules à créer
     */
    private function displayModuleInfo()
    {
        $this->line('📋 <fg=cyan>MODULES À CRÉER :</fg=cyan>');
        $this->newLine();

        $this->line('🏛️  <fg=green>MODULE 1: Gouvernance et Administration des EPE - Burkina Faso</fg=green>');
        $this->line('   📖 Basé sur: Formation MISSIONS ET ATTRIBUTIONS DE L\'ADMINISTRATEUR');
        $this->line('   📄 Documents: Code BPGSE, Décrets PCA, AG-SE');
        $this->line('   ⏱️  Durée: 20 heures');
        $this->line('   🎯 Public: Administrateurs, PCA, DG EPE');
        $this->line('   📚 Modules: 5 (Fondamentaux, Missions, CA, AG, BPGSE)');
        $this->newLine();

        $this->line('🔍  <fg=green>MODULE 2: Audit Interne et Analyse Financière des EPE</fg=green>');
        $this->line('   📖 Basé sur: Formation AUDCIF ET ANALYSE DES ETATS FINANCIERS');
        $this->line('   📄 Documents: Canevas rapports, Contrôle interne');
        $this->line('   ⏱️  Durée: 25 heures');
        $this->line('   🎯 Public: Auditeurs, Contrôleurs, Analystes');
        $this->line('   📚 Modules: 4 (Audit EPE, SYSCOHADA, Ratios, Contrôles)');
        $this->newLine();

        $this->line('🎓 <fg=yellow>FONCTIONNALITÉS INCLUSES :</fg=yellow>');
        $this->line('   ✅ Certification automatique');
        $this->line('   ✅ Suivi de progression');
        $this->line('   ✅ Leçons interactives');
        $this->line('   ✅ Intégration abonnements');
        $this->line('   ✅ Génération PDF certificats');
        $this->newLine();
    }

    /**
     * Afficher les informations de succès
     */
    private function displaySuccessInfo()
    {
        $this->line('🎉 <fg=green>MODULES E-LEARNING CONFIGURÉS !</fg=green>');
        $this->newLine();

        $this->line('📊 <fg=cyan>STATISTIQUES :</fg=cyan>');
        
        try {
            $courseCount = \App\Models\Course::count();
            $moduleCount = \App\Models\CourseModule::count();
            $lessonCount = \App\Models\Lesson::count();

            $this->line("   📚 Cours créés: {$courseCount}");
            $this->line("   📖 Modules créés: {$moduleCount}");
            $this->line("   📝 Leçons créées: {$lessonCount}");
        } catch (\Exception $e) {
            $this->line('   📊 Statistiques non disponibles');
        }

        $this->newLine();
        $this->line('🌐 <fg=cyan>ACCÈS E-LEARNING :</fg=cyan>');
        $this->line('   • API: GET /api/elearning/courses');
        $this->line('   • Dashboard: GET /api/elearning/dashboard');
        $this->line('   • Interface web: /elearning (à créer)');
        $this->newLine();

        $this->line('🔑 <fg=yellow>REQUIS POUR ACCÈS :</fg=yellow>');
        $this->line('   • Authentification utilisateur');
        $this->line('   • Abonnement avec feature "elearning_access"');
        $this->line('   • Plan Professional, Enterprise ou Government');
        $this->newLine();

        $this->line('📖 <fg=cyan>PROCHAINES ÉTAPES :</fg=cyan>');
        $this->line('   1. Créer l\'interface frontend e-learning');
        $this->line('   2. Tester l\'inscription aux cours');
        $this->line('   3. Configurer les certificats PDF');
        $this->line('   4. Intégrer avec l\'assistant IA');
        $this->newLine();

        $this->info('🚀 Vos formations EPE sont maintenant disponibles en e-learning !');
    }
}