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
        // Ajouter country_id et autres champs à la table users
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('country_id')->nullable()->after('role')->constrained()->onDelete('set null');
            $table->string('phone')->nullable()->after('country_id');
            $table->string('organization')->nullable()->after('phone');
            $table->string('position')->nullable()->after('organization');
            $table->string('preferred_language', 5)->nullable()->after('position')->comment('Code langue préférée (fr, en, etc.)');
        });

        // Ajouter country_id à la table state_entities
        Schema::table('state_entities', function (Blueprint $table) {
            $table->foreignId('country_id')->nullable()->after('id')->constrained()->onDelete('set null');
        });

        // Ajouter country_id à la table ministries si elle existe
        if (Schema::hasTable('ministries')) {
            Schema::table('ministries', function (Blueprint $table) {
                $table->foreignId('country_id')->nullable()->after('id')->constrained()->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['country_id']);
            $table->dropColumn(['country_id', 'phone', 'organization', 'position', 'preferred_language']);
        });

        Schema::table('state_entities', function (Blueprint $table) {
            $table->dropForeign(['country_id']);
            $table->dropColumn('country_id');
        });

        if (Schema::hasTable('ministries')) {
            Schema::table('ministries', function (Blueprint $table) {
                $table->dropForeign(['country_id']);
                $table->dropColumn('country_id');
            });
        }
    }
};