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
        // Table des cours
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            
            // Informations de base
            $table->string('code')->unique()->comment('Code unique du cours');
            $table->string('title')->comment('Titre du cours');
            $table->string('title_fr')->nullable()->comment('Titre en français');
            $table->string('title_en')->nullable()->comment('Titre en anglais');
            $table->text('description')->nullable()->comment('Description du cours');
            $table->text('description_fr')->nullable()->comment('Description en français');
            $table->text('description_en')->nullable()->comment('Description en anglais');
            
            // Catégorisation
            $table->enum('category', [
                'governance', 'financial_management', 'compliance', 'strategy',
                'leadership', 'audit', 'risk_management', 'public_policy',
                'digital_transformation', 'sustainability', 'procurement', 'human_resources'
            ])->comment('Catégorie du cours');
            $table->enum('level', ['beginner', 'intermediate', 'advanced', 'expert'])->default('intermediate');
            $table->decimal('duration_hours', 5, 2)->comment('Durée estimée en heures');
            
            // Instructeur
            $table->string('instructor_name')->nullable();
            $table->text('instructor_bio')->nullable();
            $table->text('instructor_credentials')->nullable();
            
            // Objectifs et prérequis
            $table->json('learning_objectives')->nullable()->comment('Objectifs pédagogiques');
            $table->json('prerequisites')->nullable()->comment('Prérequis');
            $table->json('target_audience')->nullable()->comment('Public cible');
            
            // Certification
            $table->boolean('certification_available')->default(false);
            $table->string('certification_body')->nullable()->comment('Organisme de certification');
            $table->integer('certification_validity_months')->nullable()->comment('Validité du certificat');
            
            // Contrôle d'accès
            $table->json('required_subscription_plans')->nullable()->comment('Plans requis pour accès');
            
            // Média
            $table->string('thumbnail_url')->nullable();
            $table->string('trailer_video_url')->nullable();
            
            // Métadonnées
            $table->json('tags')->nullable()->comment('Tags pour recherche');
            $table->json('regulatory_framework')->nullable()->comment('Cadres réglementaires');
            $table->json('applicable_countries')->nullable()->comment('Pays d\'application');
            $table->string('language', 5)->default('fr')->comment('Langue du cours');
            
            // Tarification (optionnel)
            $table->decimal('price', 10, 2)->nullable()->comment('Prix du cours');
            $table->string('currency', 3)->nullable();
            
            // Gestion
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_mandatory')->default(false);
            $table->integer('sort_order')->default(0);
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Index
            $table->index(['status', 'published_at']);
            $table->index(['category', 'level']);
            $table->index('is_featured');
            $table->index('language');
        });

        // Table des modules de cours
        Schema::create('course_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            
            $table->string('title')->comment('Titre du module');
            $table->text('description')->nullable();
            $table->json('learning_objectives')->nullable();
            $table->decimal('duration_hours', 4, 2)->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_required')->default(true);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            
            $table->index(['course_id', 'sort_order']);
        });

        // Table des leçons
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_module_id')->constrained()->onDelete('cascade');
            
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['video', 'text', 'interactive', 'quiz', 'assignment', 'webinar'])->default('text');
            $table->text('content')->nullable()->comment('Contenu de la leçon');
            $table->string('video_url')->nullable();
            $table->string('document_url')->nullable();
            $table->decimal('duration_minutes', 5, 2)->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_required')->default(true);
            $table->decimal('passing_score', 5, 2)->nullable()->comment('Score minimum si quiz');
            $table->json('resources')->nullable()->comment('Ressources additionnelles');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            
            $table->index(['course_module_id', 'sort_order']);
        });

        // Table des inscriptions aux cours
        Schema::create('course_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            $table->timestamp('enrolled_at')->default(now());
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->enum('status', ['enrolled', 'active', 'completed', 'dropped', 'suspended'])->default('enrolled');
            $table->integer('progress_percentage')->default(0);
            
            // Position actuelle
            $table->foreignId('current_module_id')->nullable()->constrained('course_modules')->onDelete('set null');
            $table->foreignId('current_lesson_id')->nullable()->constrained('lessons')->onDelete('set null');
            
            // Statistiques
            $table->integer('time_spent_minutes')->default(0);
            $table->timestamp('last_accessed_at')->nullable();
            
            // Certificat
            $table->foreignId('completion_certificate_id')->nullable()->constrained('course_certificates')->onDelete('set null');
            
            $table->json('metadata')->nullable();
            $table->timestamps();
            
            // Contrainte unique : un utilisateur ne peut s'inscrire qu'une fois par cours
            $table->unique(['course_id', 'user_id']);
            $table->index(['user_id', 'status']);
            $table->index(['course_id', 'status']);
        });

        // Table de progression d'apprentissage
        Schema::create('learning_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_enrollment_id')->constrained()->onDelete('cascade');
            $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
            
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->enum('status', ['not_started', 'in_progress', 'completed', 'skipped'])->default('not_started');
            $table->integer('time_spent_minutes')->default(0);
            $table->decimal('score', 5, 2)->nullable()->comment('Score si évaluation');
            $table->integer('attempts')->default(0)->comment('Nombre de tentatives');
            $table->json('answers')->nullable()->comment('Réponses si quiz');
            $table->text('notes')->nullable()->comment('Notes personnelles');
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            
            $table->unique(['course_enrollment_id', 'lesson_id']);
            $table->index(['lesson_id', 'status']);
        });

        // Table des certificats
        Schema::create('course_certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->onDelete('restrict');
            $table->foreignId('user_id')->constrained()->onDelete('restrict');
            $table->foreignId('enrollment_id')->constrained('course_enrollments')->onDelete('restrict');
            
            // Informations du certificat
            $table->string('certificate_number')->unique()->comment('Numéro unique du certificat');
            $table->timestamp('issued_at')->default(now());
            $table->timestamp('expires_at')->nullable();
            
            // Organisme de délivrance
            $table->string('issuing_body')->comment('Organisme émetteur');
            $table->string('issuing_authority')->nullable()->comment('Autorité signataire');
            $table->string('issuing_authority_title')->nullable();
            $table->string('issuing_authority_signature')->nullable();
            
            // Statut et validation
            $table->enum('status', ['issued', 'expired', 'revoked', 'suspended', 'renewed'])->default('issued');
            $table->string('verification_code')->comment('Code de vérification');
            $table->string('verification_url')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->text('revocation_reason')->nullable();
            
            // Performance
            $table->decimal('final_score', 5, 2)->nullable();
            $table->string('grade', 5)->nullable()->comment('Note finale (A+, A, B+, etc.)');
            $table->decimal('completion_time_hours', 6, 2)->nullable();
            
            // Génération et stockage
            $table->string('certificate_template')->nullable()->comment('Template utilisé');
            $table->string('generated_pdf_path')->nullable();
            $table->string('blockchain_hash')->nullable()->comment('Hash blockchain pour vérification');
            
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['user_id', 'status']);
            $table->index(['course_id', 'status']);
            $table->index('verification_code');
            $table->index('expires_at');
        });

        // Table des évaluations de cours
        Schema::create('course_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            $table->integer('rating')->comment('Note de 1 à 5');
            $table->text('comment')->nullable();
            $table->json('detailed_ratings')->nullable()->comment('Notes détaillées par critère');
            $table->boolean('is_verified')->default(false)->comment('Avis vérifié (utilisateur a terminé le cours)');
            $table->boolean('is_featured')->default(false);
            $table->enum('status', ['published', 'pending', 'rejected'])->default('pending');
            
            $table->timestamps();
            
            $table->unique(['course_id', 'user_id']);
            $table->index(['course_id', 'status', 'rating']);
        });

        // Table de liaison entre plans d'abonnement et cours
        Schema::create('course_subscription_plan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->foreignId('subscription_plan_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['course_id', 'subscription_plan_id']);
        });

        // Table des quiz/évaluations
        Schema::create('lesson_quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
            
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['multiple_choice', 'true_false', 'short_answer', 'essay'])->default('multiple_choice');
            $table->text('question');
            $table->json('options')->nullable()->comment('Options pour QCM');
            $table->json('correct_answers')->comment('Bonnes réponses');
            $table->integer('points')->default(1)->comment('Points attribués');
            $table->text('explanation')->nullable()->comment('Explication de la réponse');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_required')->default(true);
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            
            $table->index(['lesson_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lesson_quizzes');
        Schema::dropIfExists('course_subscription_plan');
        Schema::dropIfExists('course_reviews');
        Schema::dropIfExists('course_certificates');
        Schema::dropIfExists('learning_progress');
        Schema::dropIfExists('course_enrollments');
        Schema::dropIfExists('lessons');
        Schema::dropIfExists('course_modules');
        Schema::dropIfExists('courses');
    }
};