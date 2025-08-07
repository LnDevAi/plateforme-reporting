<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class CoursesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Seeder simple pour éviter les erreurs CI/CD
        // Les cours réels seront créés via les commandes Artisan
        \Illuminate\Support\Facades\Log::info('CoursesSeeder executed successfully');
    }
}