<?php
/**
 * API de Verificação de Email - Toloni Pescarias
 * Processa tokens de verificação e redireciona
 */

// Incluir configurações unificadas
require_once '../../config/database_hostinger.php';
require_once '../../config/cors_unified.php';
require_once '../../config/session_cookies.php';

try {
    // Verificar se token foi fornecido
    $token = $_GET['token'] ?? null;
    
    if (!$token) {
        sendError('TOKEN_MISSING', 'Token de verificação não fornecido');
    }
    
    // Buscar usuário pelo token
    $stmt = executeQuery($pdo, "
        SELECT id, name, email, email_verification_expires 
        FROM users 
        WHERE email_verification_token = ? AND email_verified = 0 AND active = 1
    ", [$token]);
    
    $user = $stmt->fetch();
    
    if (!$user) {
        sendError('TOKEN_INVALID', 'Token de verificação inválido ou email já verificado');
    }
    
    // Verificar expiração
    if (strtotime($user['email_verification_expires']) < time()) {
        sendError('TOKEN_EXPIRED', 'Token de verificação expirado. Solicite um novo link de verificação.');
    }
    
    // Marcar email como verificado
    executeQuery($pdo, "
        UPDATE users 
        SET email_verified = 1, 
            email_verification_token = NULL, 
            email_verification_expires = NULL,
            updated_at = NOW()
        WHERE id = ?
    ", [$user['id']]);
    
    // Log de segurança
    logSecurityEvent($pdo, $user['id'], 'EMAIL_VERIFIED', "Email: " . $user['email']);
    
    // Criar sessão automaticamente após verificação
    $sessionToken = createUserSession($pdo, $user['id']);
    
    // Redirecionar para página React com sucesso
    $redirectUrl = getBaseURL() . '/email-verified?verified=1';
    header("Location: $redirectUrl");
    exit;
    
} catch (Exception $e) {
    error_log("Email verification error: " . $e->getMessage());
    
    // Redirecionar para página de erro
    $errorUrl = getBaseURL() . '/email-verified?error=internal';
    header("Location: $errorUrl");
    exit;
}
?>