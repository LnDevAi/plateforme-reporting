<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;
use Database\Seeders\CustomCoursesSeeder;

class SetupCustomModulesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'elearning:setup-custom-modules {--force : Force setup even if modules exist}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Setup custom e-learning modules for EPE training';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🎓 Setting up custom e-learning modules...');

        // Vérifier si les modules existent déjà
        if (!$this->option('force') && Course::where('code', 'EPE-GOV-BF-2024')->exists()) {
            $this->info('Custom modules already exist. Use --force to override.');
            return 0;
        }

        try {
            // Exécuter le seeder pour les modules personnalisés
            $seeder = new CustomCoursesSeeder();
            $seeder->run();

            $this->info('✅ Custom e-learning modules setup completed successfully!');
            
            // Afficher un résumé
            $coursesCount = Course::count();
            $modulesCount = CourseModule::count();
            $lessonsCount = Lesson::count();
            
            $this->table(
                ['Resource', 'Count'],
                [
                    ['Courses', $coursesCount],
                    ['Modules', $modulesCount],
                    ['Lessons', $lessonsCount],
                ]
            );

            return 0;

        } catch (\Exception $e) {
            $this->error('❌ Error setting up custom modules: ' . $e->getMessage());
            
            if ($this->output->isVerbose()) {
                $this->error($e->getTraceAsString());
            }
            
            return 1;
        }
    }
}