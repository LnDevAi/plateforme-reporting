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
        Schema::create('report_data', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('reports')->onDelete('cascade');
            $table->foreignId('execution_id')->constrained('report_executions')->onDelete('cascade');
            $table->json('data');
            $table->json('metadata')->nullable();
            $table->integer('row_number');
            $table->timestamps();

            $table->index(['report_id', 'execution_id']);
            $table->index('row_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_data');
    }
};