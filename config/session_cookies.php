<?php
// Sistema de autenticação baseado em cookies seguros

// Configurações de cookie seguros
function setSecureCookie($name, $value, $expires = null, $httpOnly = true, $secure = null, $sameSite = 'Lax') {
    // Auto-detectar HTTPS se $secure não foi especificado
    if ($secure === null) {
        $secure = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
    }
    
    $expires = $expires ?: time() + (7 * 24 * 60 * 60); // 7 dias por padrão
    
    $options = [
        'expires' => $expires,
        'path' => '/',
        'secure' => $secure,
        'httponly' => $httpOnly,
        'samesite' => $sameSite
    ];
    
    return setcookie($name, $value, $options);
}

// Gerar token de sessão único
function generateSessionToken() {
    return bin2hex(random_bytes(32));
}

// Criar sessão no banco e definir cookie
function createUserSession($pdo, $user_id) {
    $session_token = generateSessionToken();
    $expires_at = date('Y-m-d H:i:s', time() + (7 * 24 * 60 * 60)); // 7 dias
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    
    // Inserir sessão no banco
    $stmt = $pdo->prepare("INSERT INTO user_sessions (id, user_id, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$session_token, $user_id, $ip_address, $user_agent, $expires_at]);
    
    // Definir cookie seguro
    setSecureCookie('session_token', $session_token, time() + (7 * 24 * 60 * 60));
    
    return $session_token;
}

// Verificar sessão válida
function validateSession($pdo, $session_token = null) {
    if (!$session_token) {
        $session_token = $_COOKIE['session_token'] ?? null;
    }
    
    if (!$session_token) {
        return false;
    }
    
    // Buscar sessão no banco
    $stmt = $pdo->prepare("
        SELECT s.user_id, s.expires_at, u.id, u.name, u.email, u.is_admin, u.email_verified, u.active
        FROM user_sessions s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.id = ? AND s.expires_at > NOW() AND u.active = 1
    ");
    $stmt->execute([$session_token]);
    $session = $stmt->fetch();
    
    if (!$session) {
        return false;
    }
    
    // Atualizar última atividade
    $stmt = $pdo->prepare("UPDATE user_sessions SET last_activity = NOW() WHERE id = ?");
    $stmt->execute([$session_token]);
    
    return [
        'id' => $session['id'],
        'name' => $session['name'],
        'email' => $session['email'],
        'isAdmin' => (bool)$session['is_admin'],
        'emailVerified' => (bool)$session['email_verified']
    ];
}

// Verificar se usuário está logado
function isUserLoggedIn($pdo) {
    return validateSession($pdo) !== false;
}

// Verificar se usuário é admin
function isUserAdmin($pdo) {
    $user = validateSession($pdo);
    return $user && $user['isAdmin'];
}

// Destruir sessão
function destroyUserSession($pdo, $session_token = null) {
    if (!$session_token) {
        $session_token = $_COOKIE['session_token'] ?? null;
    }
    
    if ($session_token) {
        // Remover do banco
        $stmt = $pdo->prepare("DELETE FROM user_sessions WHERE id = ?");
        $stmt->execute([$session_token]);
        
        // Limpar cookie
        setSecureCookie('session_token', '', time() - 3600);
    }
}

// Limpar sessões expiradas
function cleanExpiredSessions($pdo) {
    $stmt = $pdo->prepare("DELETE FROM user_sessions WHERE expires_at < NOW()");
    $stmt->execute();
}

// Middleware para proteger rotas
function requireAuth($pdo, $requireAdmin = false) {
    $user = validateSession($pdo);
    
    if (!$user) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Usuário não autenticado', 'redirectTo' => '/login']);
        exit;
    }
    
    if ($requireAdmin && !$user['isAdmin']) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Acesso negado - privilégios de administrador necessários']);
        exit;
    }
    
    return $user;
}

// Obter usuário atual
function getCurrentUser($pdo) {
    return validateSession($pdo);
}

// Logout de todas as sessões do usuário
function logoutAllUserSessions($pdo, $user_id) {
    $stmt = $pdo->prepare("DELETE FROM user_sessions WHERE user_id = ?");
    $stmt->execute([$user_id]);
}

// Renovar sessão (estender expiração)
function renewSession($pdo, $session_token = null) {
    if (!$session_token) {
        $session_token = $_COOKIE['session_token'] ?? null;
    }
    
    if ($session_token) {
        $new_expires = date('Y-m-d H:i:s', time() + (7 * 24 * 60 * 60)); // 7 dias
        $stmt = $pdo->prepare("UPDATE user_sessions SET expires_at = ? WHERE id = ?");
        $stmt->execute([$new_expires, $session_token]);
        
        // Renovar cookie
        setSecureCookie('session_token', $session_token, time() + (7 * 24 * 60 * 60));
    }
}
?>