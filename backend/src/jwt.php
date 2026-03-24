<?php

declare(strict_types=1);

/**
 * Weryfikacja JWT HS256 (Supabase używa tego samego sekretu co "JWT Secret" w ustawieniach projektu).
 */
function jwt_verify_hs256(string $jwt, string $secret): ?array
{
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) {
        return null;
    }
    [$h64, $p64, $sig64] = $parts;
    $expected = hash_hmac('sha256', $h64 . '.' . $p64, $secret, true);
    $sig = base64url_decode($sig64);
    if ($sig === false || !hash_equals($expected, $sig)) {
        return null;
    }
    $payloadJson = base64url_decode($p64);
    if ($payloadJson === false) {
        return null;
    }
    $payload = json_decode($payloadJson, true);
    if (!is_array($payload)) {
        return null;
    }
    if (isset($payload['exp']) && is_numeric($payload['exp']) && (int) $payload['exp'] < time()) {
        return null;
    }
    return $payload;
}

function base64url_decode(string $data): string|false
{
    $data = strtr($data, '-_', '+/');
    $pad = strlen($data) % 4;
    if ($pad > 0) {
        $data .= str_repeat('=', 4 - $pad);
    }
    $raw = base64_decode($data, true);
    return $raw === false ? false : $raw;
}
