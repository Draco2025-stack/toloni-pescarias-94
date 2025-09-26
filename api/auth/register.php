<?php
/**
 * API de Registro - Toloni Pescarias
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
    
    if (!$input) {
        sendError('INVALID_INPUT', 'Dados inválidos');
    }
    
    if (!isset($input['name']) || !isset($input['email']) || !isset($input['password'])) {
        sendError('MISSING_FIELDS', 'Nome, email e senha são obrigatórios');
    }
    
    $name = trim($input['name']);
    $email = filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL);
    $password = $input['password'];
    
    // Validações
    if (empty($name) || strlen($name) < 2) {
        sendError('INVALID_NAME', 'Nome deve ter pelo menos 2 caracteres');
    }
    
    if (!$email) {
        sendError('INVALID_EMAIL', 'Email inválido');
    }
    
    if (strlen($password) < 8) {
        sendError('WEAK_PASSWORD', 'Senha deve ter pelo menos 8 caracteres');
    }
    
    // Validar força da senha
    if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/', $password)) {
        sendError('WEAK_PASSWORD', 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número');
    }
    
    // Verificar se email já existe
    $stmt = executeQuery($pdo, "SELECT id FROM users WHERE email = ?", [$email]);
    
    if ($stmt->fetch()) {
        sendError('EMAIL_EXISTS', 'Este email já está em uso', 409);
    }
    
    // Gerar token de verificação
    $verificationToken = bin2hex(random_bytes(32));
    $verificationExpires = date('Y-m-d H:i:s', strtotime('+24 hours'));
    
    // Hash da senha
    $passwordHash = password_hash($password, PASSWORD_DEFAULT, ['cost' => 12]);
    
    // Inserir usuário
    $stmt = executeQuery($pdo, "
        INSERT INTO users (name, email, password_hash, email_verification_token, email_verification_expires) 
        VALUES (?, ?, ?, ?, ?)
    ", [$name, $email, $passwordHash, $verificationToken, $verificationExpires]);
    
    $userId = $pdo->lastInsertId();
    
    // Log de segurança
    logSecurityEvent($pdo, $userId, 'USER_REGISTERED', "Email: $email");
    
    // Enviar email de verificação (simulado em desenvolvimento)
    if (isProduction()) {
        $verificationLink = getBaseURL() . "/verify-email?token=$verificationToken";
        // TODO: Implementar envio real de email
        $emailSent = true; // placeholder
    } else {
        $verificationLink = getBaseURL() . "/verify-email?token=$verificationToken";
        error_log("Verification link (DEV): " . $verificationLink);
        $emailSent = true;
    }
    
    sendJsonResponse(true, [
        'user_id' => (int)$userId,
        'requires_verification' => true,
        'verification_link' => !isProduction() ? $verificationLink : null
    ], null);
    
} catch (Exception $e) {
    error_log("Registration error: " . $e->getMessage());
    sendError('INTERNAL_ERROR', 'Erro interno do servidor', 500);
}
?>
