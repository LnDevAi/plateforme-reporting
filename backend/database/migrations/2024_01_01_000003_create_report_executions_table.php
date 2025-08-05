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
        Schema::create('report_executions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('reports')->onDelete('cascade');
            $table->foreignId('executed_by')->constrained('users');
            $table->enum('status', ['pending', 'running', 'completed', 'failed'])->default('pending');
            $table->json('parameters_used')->nullable();
            $table->decimal('execution_time', 8, 2)->nullable();
            $table->integer('records_count')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_type')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_executions');
    }
};