<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Subscription;

class CheckSubscription
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $feature = null, string $action = 'use'): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'error' => 'Authentification requise',
                'code' => 'auth_required'
            ], 401);
        }

        // Super admin bypass
        if ($user->role === 'super_admin') {
            return $next($request);
        }

        // Obtenir l'abonnement actuel de l'entité
        $subscription = $this->getCurrentSubscription($user);
        
        if (!$subscription) {
            return response()->json([
                'error' => 'Aucun abonnement actif trouvé',
                'code' => 'no_active_subscription',
                'message' => 'Votre organisation n\'a pas d\'abonnement actif. Veuillez contacter votre administrateur.',
                'redirect' => '/subscription/plans'
            ], 403);
        }

        // Vérifier si l'abonnement est actif
        if (!$subscription->isActive() && !$subscription->onTrial()) {
            $status = $subscription->status;
            $message = $this->getSubscriptionStatusMessage($status);
            
            return response()->json([
                'error' => 'Abonnement inactif',
                'code' => 'subscription_inactive',
                'status' => $status,
                'message' => $message,
                'subscription' => $this->formatSubscriptionInfo($subscription),
                'redirect' => '/subscription/manage'
            ], 403);
        }

        // Vérifier l'accès à une feature spécifique
        if ($feature) {
            $canAccess = $this->checkFeatureAccess($subscription, $feature, $action);
            
            if (!$canAccess['allowed']) {
                return response()->json([
                    'error' => 'Fonctionnalité non disponible',
                    'code' => 'feature_not_available',
                    'feature' => $feature,
                    'message' => $canAccess['message'],
                    'current_plan' => $subscription->subscriptionPlan->name,
                    'upgrade_required' => true,
                    'suggested_plans' => $this->getSuggestedPlans($subscription, $feature),
                    'redirect' => '/subscription/upgrade'
                ], 403);
            }

            // Enregistrer l'utilisation si l'action le nécessite
            if ($action === 'use' && $canAccess['track_usage']) {
                $subscription->recordUsage($feature);
            }
        }

        // Ajouter les informations d'abonnement à la requête
        $request->attributes->set('subscription', $subscription);
        $request->attributes->set('subscription_plan', $subscription->subscriptionPlan);

        return $next($request);
    }

    /**
     * Obtient l'abonnement actuel de l'utilisateur
     */
    protected function getCurrentSubscription($user): ?Subscription
    {
        // Pour les utilisateurs liés à une entité
        if ($user->stateEntity) {
            return $user->stateEntity->subscriptions()
                ->whereIn('status', ['active', 'trialing'])
                ->orderByDesc('created_at')
                ->first();
        }

        // Pour les utilisateurs sans entité spécifique (admins multi-entités)
        return Subscription::whereHas('stateEntity', function($query) use ($user) {
            $query->whereJsonContains('metadata->admin_users', $user->id);
        })
        ->whereIn('status', ['active', 'trialing'])
        ->orderByDesc('created_at')
        ->first();
    }

    /**
     * Vérifie l'accès à une feature spécifique
     */
    protected function checkFeatureAccess(Subscription $subscription, string $feature, string $action): array
    {
        $plan = $subscription->subscriptionPlan;
        
        // Vérifier si la feature est incluse dans le plan
        if (!$plan->hasFeature($feature)) {
            return [
                'allowed' => false,
                'message' => "La fonctionnalité '{$feature}' n'est pas incluse dans votre plan {$plan->name}.",
                'reason' => 'feature_not_in_plan',
                'track_usage' => false
            ];
        }

        // Vérifier les limites d'utilisation
        if ($action === 'use') {
            $limit = $plan->getFeatureLimit($feature);
            
            if ($limit !== null) {
                $currentUsage = $subscription->getCurrentUsage($feature);
                
                if ($currentUsage >= $limit) {
                    return [
                        'allowed' => false,
                        'message' => "Limite d'utilisation atteinte pour '{$feature}' ({$currentUsage}/{$limit} utilisations ce mois).",
                        'reason' => 'usage_limit_reached',
                        'current_usage' => $currentUsage,
                        'limit' => $limit,
                        'track_usage' => false
                    ];
                }
                
                return [
                    'allowed' => true,
                    'message' => 'Accès autorisé',
                    'track_usage' => true,
                    'remaining' => $limit - $currentUsage
                ];
            }
        }

        return [
            'allowed' => true,
            'message' => 'Accès autorisé',
            'track_usage' => $action === 'use'
        ];
    }

    /**
     * Obtient le message selon le statut de l'abonnement
     */
    protected function getSubscriptionStatusMessage(string $status): string
    {
        $messages = [
            'trialing' => 'Votre période d\'essai est en cours.',
            'past_due' => 'Votre abonnement est en retard de paiement. Veuillez régulariser votre situation.',
            'canceled' => 'Votre abonnement a été annulé. Souscrivez à nouveau pour continuer.',
            'unpaid' => 'Votre abonnement n\'est pas payé. Effectuez le paiement pour continuer.',
            'incomplete' => 'Votre abonnement est incomplet. Finalisez votre souscription.',
            'suspended' => 'Votre abonnement est suspendu. Contactez le support pour plus d\'informations.'
        ];

        return $messages[$status] ?? 'Statut d\'abonnement non reconnu.';
    }

    /**
     * Formate les informations d'abonnement pour la réponse
     */
    protected function formatSubscriptionInfo(Subscription $subscription): array
    {
        return [
            'id' => $subscription->id,
            'plan' => $subscription->subscriptionPlan->name,
            'status' => $subscription->status,
            'status_label' => $subscription->status_label,
            'current_period_end' => $subscription->current_period_end?->toISOString(),
            'trial_end' => $subscription->trial_end?->toISOString(),
            'days_until_renewal' => $subscription->daysUntilRenewal(),
            'trial_days_remaining' => $subscription->trialDaysRemaining(),
            'on_trial' => $subscription->onTrial(),
            'price' => $subscription->formatted_price,
        ];
    }

    /**
     * Obtient les plans suggérés pour une feature
     */
    protected function getSuggestedPlans(Subscription $subscription, string $feature): array
    {
        $currentPlan = $subscription->subscriptionPlan;
        $countryCode = $subscription->stateEntity->country?->code ?? 'BF';
        
        $suggestedPlans = \App\Models\SubscriptionPlan::active()
            ->where('sort_order', '>', $currentPlan->sort_order)
            ->whereJsonContains('features', $feature)
            ->orderBy('sort_order')
            ->limit(3)
            ->get();

        return $suggestedPlans->map(function ($plan) use ($countryCode) {
            $pricing = $plan->getPriceForCountry($countryCode);
            return [
                'id' => $plan->id,
                'code' => $plan->code,
                'name' => $plan->localized_name,
                'description' => $plan->localized_description,
                'price_monthly' => $pricing,
                'features_count' => count($plan->features ?? []),
                'is_popular' => $plan->is_popular,
                'trial_days' => $plan->trial_days
            ];
        })->toArray();
    }

    /**
     * Méthodes statiques pour vérifications rapides
     */
    public static function userHasFeature($user, string $feature): bool
    {
        $subscription = (new self())->getCurrentSubscription($user);
        
        if (!$subscription || (!$subscription->isActive() && !$subscription->onTrial())) {
            return false;
        }

        return $subscription->subscriptionPlan->hasFeature($feature);
    }

    public static function userCanUseFeature($user, string $feature): bool
    {
        $subscription = (new self())->getCurrentSubscription($user);
        
        if (!$subscription) {
            return false;
        }

        return $subscription->canUseFeature($feature);
    }

    public static function getUserSubscription($user): ?Subscription
    {
        return (new self())->getCurrentSubscription($user);
    }
}