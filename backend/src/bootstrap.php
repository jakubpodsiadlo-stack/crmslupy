<?php

declare(strict_types=1);

require __DIR__ . '/jwt.php';

function json_response(int $status, array $body): never
{
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}
