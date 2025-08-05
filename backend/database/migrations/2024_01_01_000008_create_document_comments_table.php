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
        Schema::create('document_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_version_id')->constrained('document_versions')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('parent_id')->nullable()->constrained('document_comments');
            $table->text('content');
            $table->integer('selection_start')->nullable();
            $table->integer('selection_end')->nullable();
            $table->text('selection_text')->nullable();
            $table->enum('comment_type', ['general', 'suggestion', 'correction', 'question'])->default('general');
            $table->enum('priority', ['low', 'normal', 'high'])->default('normal');
            $table->boolean('is_resolved')->default(false);
            $table->foreignId('resolved_by')->nullable()->constrained('users');
            $table->timestamp('resolved_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['document_version_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index(['is_resolved', 'priority']);
            $table->index('parent_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_comments');
    }
};