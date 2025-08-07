<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class CustomCoursesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Seeder simple pour éviter les erreurs CI/CD
        // Les cours personnalisés réels seront créés selon les besoins
        \Illuminate\Support\Facades\Log::info('CustomCoursesSeeder executed successfully');
    }
}