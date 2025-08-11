<?php

return [

    'paths' => ['api/*', 'login', 'logout', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Comma-separated list in env: CORS_ALLOWED_ORIGINS="https://plateforme-reporting.pages.dev,https://app.votre-domaine.com"
    'allowed_origins' => array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', '')))),

    // Comma-separated regex patterns in env: CORS_ALLOWED_ORIGIN_PATTERNS="#^https://[a-z0-9-]+\.pages\.dev$#"
    'allowed_origins_patterns' => array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGIN_PATTERNS', '')))),

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Authorization'],

    'max_age' => 0,

    // With token (Bearer) auth, keep false. Set true if you plan cookie-based auth.
    'supports_credentials' => false,

];