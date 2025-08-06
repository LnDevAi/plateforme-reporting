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
        Schema::create('countries', function (Blueprint $table) {
            $table->id();
            
            // Informations de base
            $table->string('code', 2)->unique()->comment('Code ISO 3166-1 alpha-2');
            $table->string('name')->comment('Nom du pays en français');
            $table->string('name_fr')->nullable()->comment('Nom officiel en français');
            $table->string('name_en')->nullable()->comment('Nom en anglais');
            $table->string('capital')->nullable()->comment('Capitale');
            
            // Informations monétaires
            $table->string('currency_code', 3)->comment('Code ISO 4217 de la devise');
            $table->string('currency_name')->comment('Nom de la devise');
            $table->string('currency_symbol', 10)->nullable()->comment('Symbole de la devise');
            
            // Informations géographiques et culturelles
            $table->string('phone_prefix', 10)->nullable()->comment('Préfixe téléphonique international');
            $table->string('flag_emoji', 10)->nullable()->comment('Emoji du drapeau');
            $table->string('region')->nullable()->comment('Région (Afrique de l\'Ouest, etc.)');
            $table->string('sub_region')->nullable()->comment('Sous-région');
            
            // Appartenance aux organisations régionales
            $table->boolean('is_uemoa_member')->default(false)->comment('Membre de l\'UEMOA');
            $table->boolean('is_ohada_member')->default(false)->comment('Membre de l\'OHADA');
            $table->boolean('is_ecowas_member')->default(false)->comment('Membre de la CEDEAO');
            $table->boolean('is_cemac_member')->default(false)->comment('Membre de la CEMAC');
            
            // Système comptable et fiscal
            $table->enum('accounting_system', [
                'SYSCOHADA', 
                'SYSCEBNAC', 
                'IFRS', 
                'LOCAL', 
                'MIXED'
            ])->default('IFRS')->comment('Système comptable principal');
            $table->enum('fiscal_year_type', [
                'calendar', 
                'april_march', 
                'july_june', 
                'october_september', 
                'custom'
            ])->default('calendar')->comment('Type d\'année fiscale');
            
            // Langues (JSON)
            $table->json('official_languages')->nullable()->comment('Langues officielles');
            $table->json('business_languages')->nullable()->comment('Langues d\'affaires');
            
            // Cadre réglementaire (JSON)
            $table->json('regulatory_framework')->nullable()->comment('Cadre réglementaire spécifique');
            $table->json('compliance_requirements')->nullable()->comment('Exigences de conformité');
            
            // Templates et IA (JSON)
            $table->json('document_templates')->nullable()->comment('Templates de documents spécifiques');
            $table->json('ai_prompt_adaptations')->nullable()->comment('Adaptations pour les prompts IA');
            
            // Métadonnées et statut
            $table->enum('status', ['active', 'inactive', 'coming_soon'])->default('active');
            $table->json('metadata')->nullable()->comment('Métadonnées diverses (année fiscale, etc.)');
            
            // Timestamps
            $table->timestamps();
            
            // Index
            $table->index(['is_uemoa_member', 'status']);
            $table->index(['is_ohada_member', 'status']);
            $table->index(['region', 'status']);
            $table->index('accounting_system');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('countries');
    }
};