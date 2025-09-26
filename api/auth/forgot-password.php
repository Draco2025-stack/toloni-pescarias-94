<?php
/**
 * API de Esqueci a Senha - Toloni Pescarias
 * Segue padrão do prompt-mestre
 */

// Incluir configurações unificadas
require_once '../../config/database_hostinger.php';
require_once '../../config/cors_unified.php';

// Validar método
requireMethod('POST');

try {
    // Decodificar JSON de entrada
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['email'])) {
        sendError('MISSING_FIELDS', 'Email é obrigatório');
    }
    
    $email = filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL);
    
    if (!$email) {
        sendError('INVALID_EMAIL', 'Email inválido');
    }
    
    // Buscar usuário (sempre retorna sucesso por segurança)
    $stmt = executeQuery($pdo, "SELECT id, name FROM users WHERE email = ? AND active = 1", [$email]);
    $user = $stmt->fetch();
    
    if ($user) {
        // Gerar token de reset
        $resetToken = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        // Inserir token
        executeQuery($pdo, "
            INSERT INTO password_reset_tokens (user_id, token, expires_at) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            token = VALUES(token), 
            expires_at = VALUES(expires_at), 
            created_at = NOW()
        ", [$user['id'], $resetToken, $expiresAt]);
        
        // Log de segurança
        logSecurityEvent($pdo, $user['id'], 'PASSWORD_RESET_REQUESTED', "Email: $email");
        
        // Enviar email (simulado em desenvolvimento)
        if (isProduction()) {
            $resetLink = getBaseURL() . "/reset-password?token=$resetToken";
            // TODO: Implementar envio real de email
        } else {
            $resetLink = getBaseURL() . "/reset-password?token=$resetToken";
            error_log("Reset link (DEV): " . $resetLink);
        }
    }
    
    // Sempre retorna sucesso (segurança)
    sendJsonResponse(true, [
        'message' => 'Se o email existir, você receberá as instruções para redefinir sua senha.'
    ]);
    
} catch (Exception $e) {
    error_log("Forgot password error: " . $e->getMessage());
    sendError('INTERNAL_ERROR', 'Erro interno do servidor', 500);
}
?>