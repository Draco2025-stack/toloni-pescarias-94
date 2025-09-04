<?php
header('Content-Type: application/json; charset=utf-8');

// Configurar CORS dinamicamente baseado no ambiente
$allowedOrigins = [
    'https://tolonipescarias.com.br',
    'http://localhost:8080',
    'https://localhost:8080'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins) || strpos($origin, 'lovable') !== false) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Garantir que não há saída antes do JSON
ob_start();

// Capturar erros fatais
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== NULL && $error['type'] === E_ERROR) {
        ob_clean();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
    }
});

require_once '../../config/database.php';
require_once '../../config/security.php';
require_once '../../config/session_cookies.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

try {
    $session_token = $_COOKIE['session_token'] ?? null;
    
    if ($session_token) {
        // Obter dados do usuário antes de destruir a sessão
        $user = validateSession($pdo, $session_token);
        
        if ($user) {
            // Log de segurança
            logSecurityEvent($pdo, $user['id'], 'LOGOUT_SUCCESS', "Session: $session_token");
        }
        
        // Destruir sessão
        destroyUserSession($pdo, $session_token);
    }
    
    // Limpar buffer e retornar sucesso
    ob_clean();
    echo json_encode([
        'success' => true,
        'message' => 'Logout realizado com sucesso'
    ]);

} catch (Exception $e) {
    error_log("Logout error: " . $e->getMessage());
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
} finally {
    ob_end_flush();
}
?>