<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require dirname(__DIR__) . '/src/bootstrap.php';

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' && $uri === '/api/health') {
    json_response(200, ['ok' => true]);
}

if ($method === 'GET' && $uri === '/api/me') {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($auth, 'Bearer ')) {
        json_response(401, ['error' => 'missing_bearer_token']);
    }
    $token = trim(substr($auth, 7));
    $secret = require dirname(__DIR__) . '/config/jwt_secret.php';
    if ($secret === '' || $secret === null) {
        json_response(500, ['error' => 'server_misconfigured']);
    }
    $payload = jwt_verify_hs256($token, $secret);
    if ($payload === null) {
        json_response(401, ['error' => 'invalid_token']);
    }
    json_response(200, [
        'sub' => $payload['sub'] ?? null,
        'email' => $payload['email'] ?? null,
        'role' => $payload['role'] ?? $payload['user_metadata']['role'] ?? null,
    ]);
}

json_response(404, ['error' => 'not_found']);
