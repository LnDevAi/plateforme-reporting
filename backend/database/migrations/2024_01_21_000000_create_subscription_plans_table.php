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
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            
            // Informations de base
            $table->string('code')->unique()->comment('Code unique du plan');
            $table->string('name')->comment('Nom du plan');
            $table->string('name_fr')->nullable()->comment('Nom en français');
            $table->string('name_en')->nullable()->comment('Nom en anglais');
            $table->text('description')->nullable()->comment('Description du plan');
            $table->text('description_fr')->nullable()->comment('Description en français');
            $table->text('description_en')->nullable()->comment('Description en anglais');
            
            // Tarification
            $table->decimal('price_monthly', 12, 2)->nullable()->comment('Prix mensuel');
            $table->decimal('price_yearly', 12, 2)->nullable()->comment('Prix annuel');
            $table->string('price_currency', 3)->default('XOF')->comment('Devise du prix');
            $table->enum('billing_cycle', ['monthly', 'yearly', 'quarterly', 'biannual'])->default('monthly');
            
            // Limites et quotas
            $table->integer('max_entities')->nullable()->comment('Nombre max d\'entités (null = illimité)');
            $table->integer('max_users')->nullable()->comment('Nombre max d\'utilisateurs');
            $table->integer('max_reports_monthly')->nullable()->comment('Nombre max de rapports par mois');
            $table->integer('max_documents_monthly')->nullable()->comment('Nombre max de documents par mois');
            $table->integer('max_storage_gb')->nullable()->comment('Stockage max en GB');
            $table->integer('max_ai_requests_monthly')->nullable()->comment('Requêtes IA max par mois');
            
            // Fonctionnalités et configuration
            $table->json('features')->nullable()->comment('Liste des fonctionnalités incluses');
            $table->json('limitations')->nullable()->comment('Limitations spécifiques par feature');
            $table->json('target_audience')->nullable()->comment('Public cible du plan');
            $table->json('regional_pricing')->nullable()->comment('Tarification par région/pays');
            
            // Période d'essai et marketing
            $table->integer('trial_days')->default(0)->comment('Nombre de jours d\'essai gratuit');
            $table->boolean('is_popular')->default(false)->comment('Plan populaire/recommandé');
            $table->boolean('is_enterprise')->default(false)->comment('Plan entreprise');
            $table->boolean('is_government')->default(false)->comment('Plan gouvernemental');
            
            // Gestion et affichage
            $table->integer('sort_order')->default(0)->comment('Ordre d\'affichage');
            $table->enum('status', ['active', 'inactive', 'archived'])->default('active');
            $table->json('metadata')->nullable()->comment('Métadonnées additionnelles');
            
            // Timestamps
            $table->timestamps();
            
            // Index
            $table->index(['status', 'sort_order']);
            $table->index('price_currency');
            $table->index('is_popular');
            $table->index('is_government');
            $table->index('is_enterprise');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_plans');
    }
};