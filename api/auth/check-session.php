<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

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
require_once '../../config/session_cookies.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

try {
    $user = validateSession($pdo);
    
    if ($user) {
        // Renovar sessão se válida
        renewSession($pdo);
        
        // Limpar buffer e retornar dados do usuário
        ob_clean();
        echo json_encode([
            'success' => true,
            'authenticated' => true,
            'user' => $user
        ]);
    } else {
        // Limpar buffer e retornar não autenticado
        ob_clean();
        echo json_encode([
            'success' => true,
            'authenticated' => false,
            'user' => null
        ]);
    }

} catch (Exception $e) {
    error_log("Check session error: " . $e->getMessage());
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
} finally {
    ob_end_flush();
}
?>