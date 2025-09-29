<?php
// Middleware de autenticação para proteger endpoints

require_once '../config/database_hostinger.php';
require_once '../config/cors_unified.php';
require_once '../config/session_cookies.php';
require_once '../config/roles_system.php';
require_once '../lib/security.php';
require_once '../lib/security_audit.php';
require_once '../lib/response.php';

// Middleware para verificar autenticação com segurança avançada
function requireAuthentication($requireAdmin = false, $endpoint = 'auth') {
    global $pdo;
    
    // Aplicar middleware de segurança
    securityMiddleware($endpoint, [
        'rate_limit' => $requireAdmin ? 30 : 60, // Menos tentativas para admin
        'rate_window' => 1
    ]);
    
    if ($requireAdmin) {
        return requireRole($pdo, 'ADMIN', $endpoint);
    } else {
        return requireRole($pdo, 'USER', $endpoint);
    }
}

// Função para obter usuário atual sem exigir autenticação
function getCurrentUserOptional() {
    global $pdo;
    return validateSession($pdo);
}

// Headers CORS padrão
function setCORSHeaders() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Credentials: true');
}

// Tratar requisições OPTIONS (preflight)
function handleOptionsRequest() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        setCORSHeaders();
        http_response_code(204);
        exit;
    }
}
?>