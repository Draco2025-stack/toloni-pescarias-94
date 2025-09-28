<?php
/**
 * API de Registro - Toloni Pescarias
 * Segue padrão do prompt-mestre
 */

// Incluir configurações unificadas
require_once '../../config/database_hostinger.php';
require_once '../../config/cors_unified.php';
require_once '../../lib/response.php';

// Validar método
requireMethod('POST');

try {
    // Decodificar JSON de entrada
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        json_error('Dados inválidos');
    }
    
    if (!isset($input['name']) || !isset($input['email']) || !isset($input['password'])) {
        json_error('Nome, email e senha são obrigatórios');
    }
    
    $name = trim($input['name']);
    $email = filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL);
    $password = $input['password'];
    
    // Validações
    if (empty($name) || strlen($name) < 2) {
        json_error('Nome deve ter pelo menos 2 caracteres');
    }
    
    if (!$email) {
        json_error('Email inválido');
    }
    
    if (strlen($password) < 8) {
        json_error('Senha deve ter pelo menos 8 caracteres');
    }
    
    // Validar força da senha
    if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/', $password)) {
        json_error('Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número');
    }
    
    // Verificar se email já existe
    $stmt = executeQuery($pdo, "SELECT id FROM users WHERE email = ?", [$email]);
    
    if ($stmt->fetch()) {
        json_error('Este email já está em uso', 409);
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
    
    // Enviar email de verificação real
    require_once '../../config/mail.php';
    
    $verificationLink = getAPIBaseURL() . '/auth/verify-email.php?token=' . $verificationToken;
    
    $emailHtml = "
    <html>
    <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
        <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
            <h2 style='color: #2563eb;'>Bem-vindo ao Toloni Pescarias, $name!</h2>
            <p>Obrigado por se registrar em nossa plataforma.</p>
            <p>Para ativar sua conta, clique no botão abaixo:</p>
            <div style='text-align: center; margin: 30px 0;'>
                <a href='$verificationLink' style='background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;'>Verificar Email</a>
            </div>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style='word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 5px;'>$verificationLink</p>
            <p><small>Este link é válido por 24 horas. Se você não solicitou este cadastro, ignore este email.</small></p>
        </div>
    </body>
    </html>";
    
    $emailSent = sendEmail($email, 'Verificação de Email - Toloni Pescarias', $emailHtml, $name);
    
    if (!isProduction()) {
        error_log("Verification link (DEV): " . $verificationLink);
    }
    
    json_ok([
        'user_id' => (int)$userId,
        'requires_verification' => true,
        'verification_link' => !isProduction() ? $verificationLink : null
    ]);
    
} catch (Exception $e) {
    error_log("Registration error: " . $e->getMessage());
    json_error('Erro interno do servidor', 500);
}
?>
