<?php
// Middleware de autenticação para proteger endpoints

require_once '../config/database.php';
require_once '../config/session_cookies.php';

// Middleware para verificar autenticação
function requireAuthentication($requireAdmin = false) {
    global $pdo;
    
    $user = validateSession($pdo);
    
    if (!$user) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false, 
            'message' => 'Usuário não autenticado',
            'redirectTo' => '/login'
        ]);
        exit;
    }
    
    if ($requireAdmin && !$user['isAdmin']) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false, 
            'message' => 'Acesso negado - privilégios de administrador necessários'
        ]);
        exit;
    }
    
    return $user;
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