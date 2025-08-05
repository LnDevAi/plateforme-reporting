<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('report_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('reports')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('frequency', ['hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']);
            $table->json('frequency_config')->nullable();
            $table->time('time');
            $table->string('timezone', 50)->default('UTC');
            $table->boolean('is_active')->default(true);
            $table->json('parameters')->nullable();
            $table->json('recipients')->nullable();
            $table->enum('export_format', ['json', 'excel', 'pdf'])->default('excel');
            $table->timestamp('last_run_at')->nullable();
            $table->timestamp('next_run_at')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['is_active', 'next_run_at']);
            $table->index(['frequency', 'is_active']);
            $table->index('report_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_schedules');
    }
};