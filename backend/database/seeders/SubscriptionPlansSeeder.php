<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SubscriptionPlan;

class SubscriptionPlansSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = SubscriptionPlan::getDefaultPlans();

        foreach ($plans as $planData) {
            SubscriptionPlan::updateOrCreate(
                ['code' => $planData['code']],
                $planData
            );
        }

        $this->command->info('Plans d\'abonnement créés avec succès !');
        $this->command->table(
            ['Code', 'Nom', 'Prix Mensuel', 'Prix Annuel', 'Devise', 'Max Entités', 'Max Utilisateurs'],
            collect($plans)->map(function ($plan) {
                return [
                    $plan['code'],
                    $plan['name'],
                    number_format($plan['price_monthly'] ?? 0, 0, ',', ' '),
                    number_format($plan['price_yearly'] ?? 0, 0, ',', ' '),
                    $plan['price_currency'],
                    $plan['max_entities'] ?? 'Illimité',
                    $plan['max_users'] ?? 'Illimité',
                ];
            })->toArray()
        );
    }
}