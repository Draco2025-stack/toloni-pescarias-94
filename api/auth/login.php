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
require_once '../../config/session.php';
require_once '../../config/security.php';
require_once '../../config/session_cookies.php';
require_once '../../config/admin_config.php';

startSecureSession();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['email']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email e senha são obrigatórios']);
        exit;
    }

    $email = sanitizeEmail($input['email']);
    $password = $input['password'];
    $ip = $_SERVER['REMOTE_ADDR'];

    // Verificar tentativas de login
    if (!checkLoginAttempts($pdo, $ip)) {
        http_response_code(429);
        echo json_encode(['success' => false, 'message' => 'Muitas tentativas de login. Tente novamente em 15 minutos.']);
        logSecurityEvent($pdo, null, 'LOGIN_BLOCKED', "IP bloqueado: $ip, Email: $email");
        exit;
    }

    // Buscar usuário
    $stmt = $pdo->prepare("SELECT id, name, email, password_hash, is_admin, email_verified FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        recordFailedLogin($pdo, $ip, $email);
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Email ou senha incorretos']);
        logSecurityEvent($pdo, null, 'LOGIN_FAILED', "Email: $email, IP: $ip");
        exit;
    }

    // Verificar se email foi verificado (exceto em desenvolvimento e para admins)
    $isDev = strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || 
             strpos($_SERVER['HTTP_HOST'], 'lovable') !== false;
    $isAdmin = isAdminEmail($email);
    
    if (!$user['email_verified'] && !$isDev && !$isAdmin) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Email não verificado. Verifique sua caixa de entrada.']);
        exit;
    }

    // Login bem-sucedido
    clearFailedLogins($pdo, $ip);

    // Atualizar último login
    $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $stmt->execute([$user['id']]);

    // Criar sessão com cookie seguro
    $session_token = createUserSession($pdo, $user['id']);

    // Log de segurança
    $action = $user['is_admin'] ? 'ADMIN_LOGIN_SUCCESS' : 'LOGIN_SUCCESS';
    logSecurityEvent($pdo, $user['id'], $action, "Email: $email, Session: $session_token");

    // Limpar buffer e retornar dados do usuário
    ob_clean();
    echo json_encode([
        'success' => true,
        'message' => 'Login realizado com sucesso',
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'isAdmin' => (bool)$user['is_admin'],
            'emailVerified' => (bool)$user['email_verified']
        ]
    ]);

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
} finally {
    ob_end_flush();
}
?>