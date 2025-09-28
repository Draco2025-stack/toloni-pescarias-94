<?php
require_once __DIR__ . '/../config/database_hostinger.php';
require_once __DIR__ . '/../config/cors_unified.php';
require_once __DIR__ . '/../config/session_cookies.php';

try {
    // Testar conexão com banco
    $stmt = $pdo->query("SELECT 1");
    $dbStatus = $stmt->fetchColumn();
    
    // Resposta de health check
    echo json_encode([
        'success' => true,
        'db' => (int)$dbStatus,
        'php' => PHP_VERSION
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed',
        'php' => PHP_VERSION
    ]);
}
?>