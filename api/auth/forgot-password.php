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
        
        // Enviar email de reset real
        require_once '../../config/mail.php';
        
        $resetLink = getBaseURL() . "/reset?token=$resetToken";
        
        $emailHtml = "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h2 style='color: #2563eb;'>Redefinir Senha - Toloni Pescarias</h2>
                <p>Olá, {$user['name']}!</p>
                <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
                <p>Para criar uma nova senha, clique no botão abaixo:</p>
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='$resetLink' style='background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;'>Redefinir Senha</a>
                </div>
                <p>Ou copie e cole este link no seu navegador:</p>
                <p style='word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 5px;'>$resetLink</p>
                <p><small>Este link é válido por 1 hora. Se você não solicitou esta alteração, ignore este email.</small></p>
            </div>
        </body>
        </html>";
        
        $emailSent = sendEmail($email, 'Redefinir Senha - Toloni Pescarias', $emailHtml, $user['name']);
        
        if (!isProduction()) {
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