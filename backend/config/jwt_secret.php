<?php

declare(strict_types=1);

/**
 * Ustaw zmienną środowiskową SUPABASE_JWT_SECRET (Project Settings → API → JWT Secret).
 * Przykład (PowerShell): $env:SUPABASE_JWT_SECRET = "twoj-sekret"
 */
return getenv('SUPABASE_JWT_SECRET') ?: '';
