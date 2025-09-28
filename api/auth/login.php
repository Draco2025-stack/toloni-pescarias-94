<?php
/**
 * API de Login - Toloni Pescarias
 * Segue padrão do prompt-mestre com segurança avançada
 */

// Incluir configurações unificadas
require_once '../../config/database_hostinger.php';
require_once '../../config/cors_unified.php';
require_once '../../config/session_cookies.php';
require_once '../../lib/response.php';
require_once '../../lib/security.php';

// Iniciar monitoramento de performance
PerformanceMonitor::start();

// Aplicar middleware de segurança
securityMiddleware('login', [
    'rate_limit' => 10, // Máximo 10 tentativas de login por minuto
    'rate_window' => 1
]);

// Validar método
requireMethod('POST');

try {
    // Decodificar JSON de entrada
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        json_error('Dados inválidos');
    }
    
    if (!isset($input['email']) || !isset($input['password'])) {
        json_error('Email e senha são obrigatórios');
    }
    
    $email = filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL);
    $password = $input['password'];
    
    if (!$email) {
        json_error('Email inválido');
    }
    
    // Rate limiting básico por IP
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $stmt = executeQuery($pdo, "SELECT attempts, blocked_until FROM failed_logins WHERE ip_address = ?", [$ip]);
    $failedLogin = $stmt->fetch();
    
    if ($failedLogin && $failedLogin['blocked_until'] > date('Y-m-d H:i:s')) {
        logSecurityEvent($pdo, null, 'LOGIN_RATE_LIMITED', "Email: $email, IP: $ip");
        json_error('Muitas tentativas. Tente novamente em alguns minutos.', 429);
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
        json_error('Email ou senha incorretos', 401);
    }
    
    // Verificar email verificado (exceto para desenvolvimento e admin)
    if (!$user['email_verified'] && isProduction() && !$user['is_admin']) {
        json_error('Email não verificado. Verifique seu email antes de continuar.', 403, [
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
    
    json_ok(['user' => $userData]);

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    json_error('Erro interno do servidor', 500);
}
?>