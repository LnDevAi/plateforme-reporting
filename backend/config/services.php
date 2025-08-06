<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    /*
    |--------------------------------------------------------------------------
    | OpenAI Configuration for AI Writing Assistant
    |--------------------------------------------------------------------------
    |
    | Configuration pour l'assistant IA de rédaction de documents EPE.
    | Nécessite une clé API OpenAI valide pour fonctionner.
    |
    */
    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
        'model' => env('OPENAI_MODEL', 'gpt-4'),
        'temperature' => env('OPENAI_TEMPERATURE', 0.7),
        'max_tokens' => env('OPENAI_MAX_TOKENS', 2000),
        'timeout' => env('OPENAI_TIMEOUT', 60),
        
        // Configuration spécifique aux documents EPE
        'epe_specialization' => [
            'system_role' => 'Expert en documentation administrative et financière pour les entreprises publiques du Burkina Faso',
            'default_framework' => 'SYSCOHADA révisé 2019, directives UEMOA',
            'default_language' => 'français',
            'compliance_focus' => ['SYSCOHADA', 'UEMOA', 'Code des marchés publics', 'Gouvernance publique'],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Alternative AI Providers
    |--------------------------------------------------------------------------
    |
    | Configuration pour d'autres fournisseurs d'IA en fallback
    |
    */
    'anthropic' => [
        'api_key' => env('ANTHROPIC_API_KEY'),
        'model' => env('ANTHROPIC_MODEL', 'claude-3-sonnet-20240229'),
        'enabled' => env('ANTHROPIC_ENABLED', false),
    ],

    'google_ai' => [
        'api_key' => env('GOOGLE_AI_API_KEY'),
        'model' => env('GOOGLE_AI_MODEL', 'gemini-pro'),
        'enabled' => env('GOOGLE_AI_ENABLED', false),
    ],

];