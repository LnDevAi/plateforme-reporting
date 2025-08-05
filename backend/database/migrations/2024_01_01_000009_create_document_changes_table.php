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
        Schema::create('document_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_version_id')->constrained('document_versions')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users');
            $table->string('change_type', 50);
            $table->text('description');
            $table->longText('old_value')->nullable();
            $table->longText('new_value')->nullable();
            $table->string('field_changed', 100)->nullable();
            $table->integer('change_size')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['document_version_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index(['change_type', 'created_at']);
            $table->index('field_changed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_changes');
    }
};