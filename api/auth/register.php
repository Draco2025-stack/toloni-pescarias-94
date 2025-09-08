<?php
header('Content-Type: application/json; charset=utf-8');

// Configurar CORS dinamicamente baseado no ambiente
$allowedOrigins = [
    'https://tolonipescarias.com.br',
    'https://tolonipescarias.com',
    'http://localhost:8080',
    'https://localhost:8080',
    'http://localhost:5173',
    'https://localhost:5173'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins) || strpos($origin, 'lovable') !== false) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

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
require_once '../../config/security.php';

// Domínios permitidos
$ALLOWED_DOMAINS = [
    'tolonipescarias.com',
    'gmail.com',
    'hotmail.com',
    'outlook.com',
    'yahoo.com',
    'uol.com.br'
];

function isDomainAllowed($email, $allowedDomains) {
    $domain = strtolower(explode('@', $email)[1]);
    return in_array($domain, $allowedDomains);
}

function sendVerificationEmail($email, $token, $name) {
    $verificationLink = "https://" . $_SERVER['HTTP_HOST'] . "/api/auth/verify-email.php?token=" . $token;
    
    $subject = "Verificação de Email - Toloni Pescarias";
    $message = "
    <html>
    <body>
        <h2>Olá, $name!</h2>
        <p>Obrigado por se cadastrar no Toloni Pescarias!</p>
        <p>Para ativar sua conta, clique no link abaixo:</p>
        <p><a href='$verificationLink'>Verificar Email</a></p>
        <p>Este link é válido por 24 horas.</p>
        <p>Se você não se cadastrou em nosso site, ignore este email.</p>
    </body>
    </html>
    ";
    
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: noreply@tolonipescarias.com" . "\r\n";
    
    return mail($email, $subject, $message, $headers);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['name']) || !isset($input['email']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Nome, email e senha são obrigatórios']);
        exit;
    }

    $name = sanitizeString($input['name']);
    $email = sanitizeEmail($input['email']);
    $password = $input['password'];

    // Validações
    if (empty($name) || empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Todos os campos são obrigatórios']);
        exit;
    }

    if (!validateEmail($email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email inválido']);
        exit;
    }

    if (!isDomainAllowed($email, $ALLOWED_DOMAINS)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Domínio de email não permitido']);
        exit;
    }

    if (!validatePasswordStrength($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'A senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número']);
        exit;
    }

    // Verificar se email já existe
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Este email já está cadastrado']);
        exit;
    }

    // Incluir configuração de admin
    require_once '../../config/admin_config.php';

    // Criar usuário
    $password_hash = hashPassword($password);
    $is_admin = determineAdminStatus($email);
    $verification_token = bin2hex(random_bytes(32));
    $verification_expires = date('Y-m-d H:i:s', strtotime('+24 hours'));

    $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, is_admin, email_verification_token, email_verification_expires, email_verified) VALUES (?, ?, ?, ?, ?, ?, 0)");
    $stmt->execute([$name, $email, $password_hash, $is_admin, $verification_token, $verification_expires]);

    $user_id = $pdo->lastInsertId();

    // Enviar email de verificação
    $emailSent = sendVerificationEmail($email, $verification_token, $name);

    // Log de segurança
    $action = $is_admin ? 'ADMIN_REGISTERED' : 'USER_REGISTERED';
    logSecurityEvent($pdo, $user_id, $action, "Email: $email, Admin: " . ($is_admin ? 'YES' : 'NO') . ", Email sent: " . ($emailSent ? 'YES' : 'NO'));

    // Limpar buffer e retornar sucesso
    ob_clean();
    echo json_encode([
        'success' => true,
        'message' => 'Conta criada com sucesso! Verifique seu email para ativá-la.',
        'emailSent' => $emailSent
    ]);

} catch (Exception $e) {
    error_log("Registration error: " . $e->getMessage());
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
} finally {
    ob_end_flush();
}
?>