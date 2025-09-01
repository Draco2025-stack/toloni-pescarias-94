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

require_once '../../config/database.php';
require_once '../../config/session_cookies.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

try {
    // Obter dados JSON
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['email'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email é obrigatório']);
        exit;
    }
    
    $email = filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL);
    
    if (!$email) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email inválido']);
        exit;
    }
    
    // Verificar se o usuário existe
    $stmt = $pdo->prepare("SELECT id, name FROM users WHERE email = ? AND active = 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        // Por segurança, sempre retornamos sucesso mesmo se o email não existir
        ob_clean();
        echo json_encode([
            'success' => true,
            'message' => 'Se o email existir em nossa base de dados, você receberá instruções para redefinir sua senha.'
        ]);
        exit;
    }
    
    // Gerar token de redefinição
    $reset_token = bin2hex(random_bytes(32));
    $expires_at = date('Y-m-d H:i:s', time() + (1 * 60 * 60)); // 1 hora
    
    // Remover tokens antigos do usuário
    $stmt = $pdo->prepare("DELETE FROM password_reset_tokens WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    
    // Inserir novo token
    $stmt = $pdo->prepare("INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$user['id'], $reset_token, $expires_at]);
    
    // Construir link de redefinição
    $reset_link = "http://" . $_SERVER['HTTP_HOST'] . "/reset-password?token=" . $reset_token;
    
    // Enviar email (simulado - você pode implementar envio real aqui)
    $subject = "Redefinição de Senha - Toloni Pescarias";
    $message = "
    Olá {$user['name']},
    
    Você solicitou a redefinição de sua senha. Clique no link abaixo para criar uma nova senha:
    
    {$reset_link}
    
    Este link expira em 1 hora.
    
    Se você não solicitou esta redefinição, ignore este email.
    
    Atenciosamente,
    Equipe Toloni Pescarias
    ";
    
    // Simular envio de email (em produção, usar uma biblioteca de email real)
    error_log("Password reset email would be sent to: {$email}");
    error_log("Reset link: {$reset_link}");
    
    // Log de segurança
    logSecurityEvent($pdo, $user['id'], 'password_reset_requested', 'Token gerado para redefinição');
    
    ob_clean();
    echo json_encode([
        'success' => true,
        'message' => 'Se o email existir em nossa base de dados, você receberá instruções para redefinir sua senha.'
    ]);

} catch (Exception $e) {
    error_log("Forgot password error: " . $e->getMessage());
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
} finally {
    ob_end_flush();
}
?>