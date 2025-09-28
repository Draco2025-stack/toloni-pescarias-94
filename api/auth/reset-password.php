<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
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

require_once '../../config/database_hostinger.php';
require_once '../../config/cors_unified.php';
require_once '../../config/session_cookies.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

try {
    // Obter dados JSON
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['token']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Token e senha são obrigatórios']);
        exit;
    }
    
    $token = trim($input['token']);
    $password = trim($input['password']);
    
    // Validar senha
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'A senha deve ter pelo menos 6 caracteres']);
        exit;
    }
    
    // Verificar token válido
    $stmt = $pdo->prepare("
        SELECT rt.user_id, rt.expires_at, u.email, u.name 
        FROM password_reset_tokens rt
        JOIN users u ON rt.user_id = u.id
        WHERE rt.token = ? AND rt.expires_at > NOW() AND u.active = 1
    ");
    $stmt->execute([$token]);
    $reset_data = $stmt->fetch();
    
    if (!$reset_data) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Token inválido ou expirado']);
        exit;
    }
    
    // Atualizar senha do usuário
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$password_hash, $reset_data['user_id']]);
    
    // Remover token usado
    $stmt = $pdo->prepare("DELETE FROM password_reset_tokens WHERE token = ?");
    $stmt->execute([$token]);
    
    // Remover todas as sessões ativas do usuário (forçar novo login)
    logoutAllUserSessions($pdo, $reset_data['user_id']);
    
    // Log de segurança
    logSecurityEvent($pdo, $reset_data['user_id'], 'password_reset_completed', 'Senha redefinida com sucesso');
    
    ob_clean();
    echo json_encode([
        'success' => true,
        'message' => 'Senha redefinida com sucesso! Faça login com sua nova senha.'
    ]);

} catch (Exception $e) {
    error_log("Reset password error: " . $e->getMessage());
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
} finally {
    ob_end_flush();
}
?>