<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class Subscription extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'subscription_plan_id',
        'state_entity_id',
        'user_id',
        'status',
        'billing_cycle',
        'current_period_start',
        'current_period_end',
        'trial_start',
        'trial_end',
        'canceled_at',
        'ends_at',
        'price_amount',
        'price_currency',
        'payment_method',
        'last_payment_date',
        'next_payment_date',
        'payment_status',
        'usage_tracking',
        'metadata',
    ];

    protected $casts = [
        'current_period_start' => 'datetime',
        'current_period_end' => 'datetime',
        'trial_start' => 'datetime',
        'trial_end' => 'datetime',
        'canceled_at' => 'datetime',
        'ends_at' => 'datetime',
        'last_payment_date' => 'datetime',
        'next_payment_date' => 'datetime',
        'price_amount' => 'decimal:2',
        'usage_tracking' => 'array',
        'metadata' => 'array',
    ];

    /**
     * Statuts d'abonnement
     */
    const STATUS_ACTIVE = 'active';
    const STATUS_TRIALING = 'trialing';
    const STATUS_PAST_DUE = 'past_due';
    const STATUS_CANCELED = 'canceled';
    const STATUS_UNPAID = 'unpaid';
    const STATUS_INCOMPLETE = 'incomplete';
    const STATUS_SUSPENDED = 'suspended';

    const STATUSES = [
        self::STATUS_ACTIVE => 'Actif',
        self::STATUS_TRIALING => 'Période d\'essai',
        self::STATUS_PAST_DUE => 'Paiement en retard',
        self::STATUS_CANCELED => 'Annulé',
        self::STATUS_UNPAID => 'Non payé',
        self::STATUS_INCOMPLETE => 'Incomplet',
        self::STATUS_SUSPENDED => 'Suspendu',
    ];

    /**
     * Statuts de paiement
     */
    const PAYMENT_PENDING = 'pending';
    const PAYMENT_PAID = 'paid';
    const PAYMENT_FAILED = 'failed';
    const PAYMENT_REFUNDED = 'refunded';
    const PAYMENT_PARTIAL = 'partial';

    const PAYMENT_STATUSES = [
        self::PAYMENT_PENDING => 'En attente',
        self::PAYMENT_PAID => 'Payé',
        self::PAYMENT_FAILED => 'Échec',
        self::PAYMENT_REFUNDED => 'Remboursé',
        self::PAYMENT_PARTIAL => 'Partiel',
    ];

    /**
     * Méthodes de paiement
     */
    const PAYMENT_METHODS = [
        'bank_transfer' => 'Virement bancaire',
        'mobile_money' => 'Mobile Money',
        'credit_card' => 'Carte de crédit',
        'cash' => 'Espèces',
        'check' => 'Chèque',
        'government_budget' => 'Budget gouvernemental',
        'development_fund' => 'Fonds de développement',
    ];

    /**
     * Relations
     */
    public function subscriptionPlan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class);
    }

    public function stateEntity(): BelongsTo
    {
        return $this->belongsTo(StateEntity::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function usageRecords(): HasMany
    {
        return $this->hasMany(SubscriptionUsage::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(SubscriptionInvoice::class);
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeTrialing($query)
    {
        return $query->where('status', self::STATUS_TRIALING);
    }

    public function scopeExpired($query)
    {
        return $query->where('current_period_end', '<', now());
    }

    public function scopeExpiringSoon($query, $days = 7)
    {
        return $query->whereBetween('current_period_end', [
            now(),
            now()->addDays($days)
        ]);
    }

    public function scopeByCountry($query, $countryCode)
    {
        return $query->whereHas('stateEntity', function($q) use ($countryCode) {
            $q->whereHas('country', function($q2) use ($countryCode) {
                $q2->where('code', $countryCode);
            });
        });
    }

    /**
     * Accesseurs et Mutateurs
     */
    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    public function getPaymentStatusLabelAttribute(): string
    {
        return self::PAYMENT_STATUSES[$this->payment_status] ?? $this->payment_status;
    }

    public function getPaymentMethodLabelAttribute(): string
    {
        return self::PAYMENT_METHODS[$this->payment_method] ?? $this->payment_method;
    }

    public function getFormattedPriceAttribute(): string
    {
        return $this->subscriptionPlan->formatPrice($this->price_amount, $this->price_currency);
    }

    /**
     * Méthodes utilitaires
     */
    
    /**
     * Vérifie si l'abonnement est actif
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE && 
               $this->current_period_end->isFuture();
    }

    /**
     * Vérifie si l'abonnement est en période d'essai
     */
    public function onTrial(): bool
    {
        return $this->status === self::STATUS_TRIALING && 
               $this->trial_end && 
               $this->trial_end->isFuture();
    }

    /**
     * Vérifie si la période d'essai est expirée
     */
    public function trialExpired(): bool
    {
        return $this->trial_end && $this->trial_end->isPast();
    }

    /**
     * Vérifie si l'abonnement est annulé
     */
    public function canceled(): bool
    {
        return $this->status === self::STATUS_CANCELED;
    }

    /**
     * Vérifie si l'abonnement est suspendu
     */
    public function suspended(): bool
    {
        return $this->status === self::STATUS_SUSPENDED;
    }

    /**
     * Obtient les jours restants dans la période courante
     */
    public function daysUntilRenewal(): int
    {
        if (!$this->current_period_end) {
            return 0;
        }

        return max(0, now()->diffInDays($this->current_period_end, false));
    }

    /**
     * Obtient les jours restants dans la période d'essai
     */
    public function trialDaysRemaining(): int
    {
        if (!$this->onTrial()) {
            return 0;
        }

        return max(0, now()->diffInDays($this->trial_end, false));
    }

    /**
     * Démarre la période d'essai
     */
    public function startTrial(int $days): self
    {
        $this->update([
            'status' => self::STATUS_TRIALING,
            'trial_start' => now(),
            'trial_end' => now()->addDays($days),
            'current_period_start' => now(),
            'current_period_end' => now()->addDays($days),
        ]);

        return $this;
    }

    /**
     * Convertit l'essai en abonnement payant
     */
    public function convertTrial(): self
    {
        if (!$this->onTrial()) {
            return $this;
        }

        $this->update([
            'status' => self::STATUS_ACTIVE,
            'current_period_start' => now(),
            'current_period_end' => $this->calculateNextPeriodEnd(),
            'next_payment_date' => $this->calculateNextPaymentDate(),
        ]);

        return $this;
    }

    /**
     * Renouvelle l'abonnement
     */
    public function renew(): self
    {
        $this->update([
            'current_period_start' => $this->current_period_end,
            'current_period_end' => $this->calculateNextPeriodEnd($this->current_period_end),
            'next_payment_date' => $this->calculateNextPaymentDate($this->current_period_end),
            'status' => self::STATUS_ACTIVE,
        ]);

        return $this;
    }

    /**
     * Annule l'abonnement
     */
    public function cancel(bool $immediately = false): self
    {
        if ($immediately) {
            $this->update([
                'status' => self::STATUS_CANCELED,
                'canceled_at' => now(),
                'ends_at' => now(),
            ]);
        } else {
            $this->update([
                'canceled_at' => now(),
                'ends_at' => $this->current_period_end,
            ]);
        }

        return $this;
    }

    /**
     * Suspend l'abonnement
     */
    public function suspend(string $reason = null): self
    {
        $metadata = $this->metadata ?? [];
        $metadata['suspension_reason'] = $reason;
        $metadata['suspended_at'] = now()->toISOString();

        $this->update([
            'status' => self::STATUS_SUSPENDED,
            'metadata' => $metadata,
        ]);

        return $this;
    }

    /**
     * Réactive l'abonnement suspendu
     */
    public function unsuspend(): self
    {
        $metadata = $this->metadata ?? [];
        $metadata['unsuspended_at'] = now()->toISOString();

        $this->update([
            'status' => self::STATUS_ACTIVE,
            'metadata' => $metadata,
        ]);

        return $this;
    }

    /**
     * Change le plan d'abonnement
     */
    public function changePlan(SubscriptionPlan $newPlan, bool $prorate = true): self
    {
        $oldPlan = $this->subscriptionPlan;
        
        // Calculer la proratisation si nécessaire
        $prorationAmount = 0;
        if ($prorate) {
            $prorationAmount = $this->calculateProration($oldPlan, $newPlan);
        }

        $this->update([
            'subscription_plan_id' => $newPlan->id,
            'price_amount' => $newPlan->price_monthly,
            'price_currency' => $newPlan->price_currency,
        ]);

        // Enregistrer les détails du changement
        $metadata = $this->metadata ?? [];
        $metadata['plan_changes'][] = [
            'from_plan' => $oldPlan->code,
            'to_plan' => $newPlan->code,
            'changed_at' => now()->toISOString(),
            'proration_amount' => $prorationAmount,
        ];
        
        $this->update(['metadata' => $metadata]);

        return $this;
    }

    /**
     * Calcule la fin de la prochaine période
     */
    protected function calculateNextPeriodEnd(Carbon $startDate = null): Carbon
    {
        $start = $startDate ?? now();
        
        switch ($this->billing_cycle) {
            case 'yearly':
                return $start->addYear();
            case 'quarterly':
                return $start->addMonths(3);
            case 'biannual':
                return $start->addMonths(6);
            case 'monthly':
            default:
                return $start->addMonth();
        }
    }

    /**
     * Calcule la prochaine date de paiement
     */
    protected function calculateNextPaymentDate(Carbon $startDate = null): Carbon
    {
        return $this->calculateNextPeriodEnd($startDate);
    }

    /**
     * Calcule la proratisation lors d'un changement de plan
     */
    protected function calculateProration(SubscriptionPlan $oldPlan, SubscriptionPlan $newPlan): float
    {
        $daysRemaining = $this->daysUntilRenewal();
        $totalDaysInPeriod = $this->current_period_start->diffInDays($this->current_period_end);
        
        if ($totalDaysInPeriod <= 0) {
            return 0;
        }

        $usedRatio = ($totalDaysInPeriod - $daysRemaining) / $totalDaysInPeriod;
        $remainingRatio = $daysRemaining / $totalDaysInPeriod;

        $oldPlanCredit = $oldPlan->price_monthly * $remainingRatio;
        $newPlanCharge = $newPlan->price_monthly * $remainingRatio;

        return $newPlanCharge - $oldPlanCredit;
    }

    /**
     * Enregistre l'utilisation d'une feature
     */
    public function recordUsage(string $feature, int $quantity = 1): void
    {
        $usage = $this->usage_tracking ?? [];
        $currentMonth = now()->format('Y-m');
        
        if (!isset($usage[$currentMonth])) {
            $usage[$currentMonth] = [];
        }
        
        if (!isset($usage[$currentMonth][$feature])) {
            $usage[$currentMonth][$feature] = 0;
        }
        
        $usage[$currentMonth][$feature] += $quantity;
        
        $this->update(['usage_tracking' => $usage]);
    }

    /**
     * Obtient l'utilisation courante d'une feature
     */
    public function getCurrentUsage(string $feature): int
    {
        $usage = $this->usage_tracking ?? [];
        $currentMonth = now()->format('Y-m');
        
        return $usage[$currentMonth][$feature] ?? 0;
    }

    /**
     * Vérifie si l'utilisation d'une feature a atteint sa limite
     */
    public function hasReachedLimit(string $feature): bool
    {
        $limit = $this->subscriptionPlan->getFeatureLimit($feature);
        
        if ($limit === null) {
            return false; // Pas de limite
        }
        
        $usage = $this->getCurrentUsage($feature);
        
        return $usage >= $limit;
    }

    /**
     * Vérifie si une feature est disponible
     */
    public function canUseFeature(string $feature): bool
    {
        if (!$this->isActive() && !$this->onTrial()) {
            return false;
        }
        
        if (!$this->subscriptionPlan->hasFeature($feature)) {
            return false;
        }
        
        return !$this->hasReachedLimit($feature);
    }

    /**
     * Obtient un résumé de l'utilisation
     */
    public function getUsageSummary(): array
    {
        $currentMonth = now()->format('Y-m');
        $usage = $this->usage_tracking[$currentMonth] ?? [];
        $summary = [];
        
        foreach ($this->subscriptionPlan->features as $feature) {
            $limit = $this->subscriptionPlan->getFeatureLimit($feature);
            $used = $usage[$feature] ?? 0;
            
            $summary[$feature] = [
                'used' => $used,
                'limit' => $limit,
                'unlimited' => $limit === null,
                'percentage' => $limit ? min(100, ($used / $limit) * 100) : 0,
                'available' => $limit ? max(0, $limit - $used) : 'unlimited',
            ];
        }
        
        return $summary;
    }

    /**
     * Génère une facture pour la période courante
     */
    public function generateInvoice(): SubscriptionInvoice
    {
        return SubscriptionInvoice::create([
            'subscription_id' => $this->id,
            'invoice_number' => $this->generateInvoiceNumber(),
            'amount' => $this->price_amount,
            'currency' => $this->price_currency,
            'period_start' => $this->current_period_start,
            'period_end' => $this->current_period_end,
            'due_date' => $this->next_payment_date,
            'status' => 'pending',
        ]);
    }

    /**
     * Génère un numéro de facture unique
     */
    protected function generateInvoiceNumber(): string
    {
        $prefix = 'INV';
        $year = now()->year;
        $month = now()->format('m');
        $sequence = str_pad($this->id, 6, '0', STR_PAD_LEFT);
        
        return "{$prefix}-{$year}{$month}-{$sequence}";
    }
}