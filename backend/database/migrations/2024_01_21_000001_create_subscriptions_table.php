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
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            
            // Relations
            $table->foreignId('subscription_plan_id')->constrained()->onDelete('restrict');
            $table->foreignId('state_entity_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('restrict')->comment('Utilisateur responsable');
            
            // Statut et configuration
            $table->enum('status', [
                'active',
                'trialing', 
                'past_due',
                'canceled',
                'unpaid',
                'incomplete',
                'suspended'
            ])->default('trialing');
            $table->enum('billing_cycle', ['monthly', 'yearly', 'quarterly', 'biannual'])->default('monthly');
            
            // Périodes
            $table->timestamp('current_period_start')->nullable();
            $table->timestamp('current_period_end')->nullable();
            $table->timestamp('trial_start')->nullable();
            $table->timestamp('trial_end')->nullable();
            $table->timestamp('canceled_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            
            // Facturation
            $table->decimal('price_amount', 12, 2)->comment('Montant facturé');
            $table->string('price_currency', 3)->default('XOF');
            $table->enum('payment_method', [
                'bank_transfer',
                'mobile_money',
                'credit_card', 
                'cash',
                'check',
                'government_budget',
                'development_fund'
            ])->nullable();
            $table->timestamp('last_payment_date')->nullable();
            $table->timestamp('next_payment_date')->nullable();
            $table->enum('payment_status', [
                'pending',
                'paid',
                'failed',
                'refunded',
                'partial'
            ])->default('pending');
            
            // Suivi d'utilisation et métadonnées
            $table->json('usage_tracking')->nullable()->comment('Suivi utilisation par mois/feature');
            $table->json('metadata')->nullable()->comment('Informations supplémentaires');
            
            // Timestamps et soft deletes
            $table->timestamps();
            $table->softDeletes();
            
            // Index
            $table->index(['status', 'current_period_end']);
            $table->index(['state_entity_id', 'status']);
            $table->index('payment_status');
            $table->index('next_payment_date');
            $table->index(['trial_end', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};