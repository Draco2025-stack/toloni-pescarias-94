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

function sendVerificationEmail($email, $token, $name) {
    require_once '../../config/mail.php';
    
    $verificationLink = "https://" . $_SERVER['HTTP_HOST'] . "/api/auth/verify-email.php?token=" . $token;
    
    $emailHtml = "
    <html>
    <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
        <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
            <h2 style='color: #2563eb;'>Verificação de Email - Toloni Pescarias</h2>
            <p>Olá, $name!</p>
            <p>Você solicitou um novo link de verificação para sua conta no Toloni Pescarias.</p>
            <p>Para ativar sua conta, clique no botão abaixo:</p>
            <div style='text-align: center; margin: 30px 0;'>
                <a href='$verificationLink' style='background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;'>Verificar Email</a>
            </div>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style='word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 5px;'>$verificationLink</p>
            <p><small>Este link é válido por 24 horas. Se você não solicitou este email, ignore esta mensagem.</small></p>
        </div>
    </body>
    </html>";
    
    return sendEmail($email, 'Verificação de Email - Toloni Pescarias', $emailHtml, $name);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['email'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email é obrigatório']);
        exit;
    }

    $email = sanitizeEmail($input['email']);

    if (!validateEmail($email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email inválido']);
        exit;
    }

    // Buscar usuário não verificado
    $stmt = $pdo->prepare("SELECT id, name FROM users WHERE email = ? AND email_verified = 0");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Usuário não encontrado ou email já verificado']);
        exit;
    }

    // Gerar novo token de verificação
    $verification_token = bin2hex(random_bytes(32));
    $verification_expires = date('Y-m-d H:i:s', strtotime('+24 hours'));

    // Atualizar token no banco
    $stmt = $pdo->prepare("UPDATE users SET email_verification_token = ?, email_verification_expires = ? WHERE id = ?");
    $stmt->execute([$verification_token, $verification_expires, $user['id']]);

    // Enviar email de verificação
    $emailSent = sendVerificationEmail($email, $verification_token, $user['name']);

    // Log de segurança
    logSecurityEvent($pdo, $user['id'], 'VERIFICATION_RESENT', "Email: $email, Email sent: " . ($emailSent ? 'YES' : 'NO'));

    // Limpar buffer e retornar sucesso
    ob_clean();
    echo json_encode([
        'success' => true,
        'message' => 'Email de verificação reenviado com sucesso!',
        'emailSent' => $emailSent
    ]);

} catch (Exception $e) {
    error_log("Resend verification error: " . $e->getMessage());
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
} finally {
    ob_end_flush();
}
?>