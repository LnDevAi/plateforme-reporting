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
        Schema::create('document_collaborators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_version_id')->constrained('document_versions')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('permission_level', ['view', 'comment', 'edit', 'admin'])->default('view');
            $table->foreignId('invited_by')->constrained('users');
            $table->timestamp('invited_at');
            $table->timestamps();

            $table->unique(['document_version_id', 'user_id']);
            $table->index(['user_id', 'permission_level']);
            $table->index('invited_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_collaborators');
    }
};