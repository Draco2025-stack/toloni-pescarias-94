<?php
/**
 * API de Login - Toloni Pescarias
 * Segue padrão do prompt-mestre
 */

// Incluir configurações unificadas
require_once '../../config/database_hostinger.php';
require_once '../../config/cors_unified.php';
require_once '../../config/session_cookies.php';

// Validar método
requireMethod('POST');

try {
    // Decodificar JSON de entrada
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendError('INVALID_INPUT', 'Dados inválidos');
    }
    
    if (!isset($input['email']) || !isset($input['password'])) {
        sendError('MISSING_FIELDS', 'Email e senha são obrigatórios');
    }
    
    $email = filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL);
    $password = $input['password'];
    
    if (!$email) {
        sendError('INVALID_EMAIL', 'Email inválido');
    }
    
    // Rate limiting básico por IP
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $stmt = executeQuery($pdo, "SELECT attempts, blocked_until FROM failed_logins WHERE ip_address = ?", [$ip]);
    $failedLogin = $stmt->fetch();
    
    if ($failedLogin && $failedLogin['blocked_until'] > date('Y-m-d H:i:s')) {
        logSecurityEvent($pdo, null, 'LOGIN_RATE_LIMITED', "Email: $email, IP: $ip");
        sendError('RATE_LIMITED', 'Muitas tentativas. Tente novamente em alguns minutos.', 429);
    }
    
    // Buscar usuário
    $stmt = executeQuery($pdo, "SELECT * FROM users WHERE email = ? AND active = 1", [$email]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password_hash'])) {
        // Registrar tentativa falhada
        if ($failedLogin) {
            $attempts = $failedLogin['attempts'] + 1;
            $blockedUntil = ($attempts >= 5) ? date('Y-m-d H:i:s', strtotime('+15 minutes')) : null;
            executeQuery($pdo, "UPDATE failed_logins SET attempts = ?, blocked_until = ?, updated_at = NOW() WHERE ip_address = ?", 
                       [$attempts, $blockedUntil, $ip]);
        } else {
            executeQuery($pdo, "INSERT INTO failed_logins (ip_address, email, attempts) VALUES (?, ?, 1)", 
                       [$ip, $email]);
        }
        
        logSecurityEvent($pdo, null, 'LOGIN_FAILED', "Email: $email, IP: $ip");
        sendError('INVALID_CREDENTIALS', 'Email ou senha incorretos', 401);
    }
    
    // Verificar email verificado (exceto para desenvolvimento e admin)
    if (!$user['email_verified'] && isProduction() && !$user['is_admin']) {
        sendError('EMAIL_NOT_VERIFIED', 'Email não verificado. Verifique seu email antes de continuar.', 403, [
            'requires_verification' => true
        ]);
    }
    
    // Login com sucesso - limpar tentativas falhadas
    executeQuery($pdo, "DELETE FROM failed_logins WHERE ip_address = ?", [$ip]);
    
    // Atualizar último login
    executeQuery($pdo, "UPDATE users SET last_login = NOW() WHERE id = ?", [$user['id']]);
    
    // Criar sessão
    $sessionData = createUserSession($pdo, $user['id']);
    
    // Log de sucesso
    logSecurityEvent($pdo, $user['id'], 'LOGIN_SUCCESS', "Email: $email, Session: " . $sessionData['session_token']);
    
    // Resposta de sucesso
    $userData = [
        'id' => (int)$user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'is_admin' => (bool)$user['is_admin'],
        'profile_image' => $user['profile_image'],
        'email_verified' => (bool)$user['email_verified']
    ];
    
    sendJsonResponse(true, ['user' => $userData]);

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    sendError('INTERNAL_ERROR', 'Erro interno do servidor', 500);
}
?>