
<?php
// Configurações de sessão segura
ini_set('session.cookie_lifetime', 1800); // 30 minutos
ini_set('session.gc_maxlifetime', 1800);
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_samesite', 'Strict');

// Função para iniciar sessão segura
function startSecureSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
        
        // Verificar expiração da sessão
        if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > 1800)) {
            session_unset();
            session_destroy();
            session_start();
        }
        
        $_SESSION['last_activity'] = time();
        
        // Regenerar ID da sessão periodicamente
        if (!isset($_SESSION['created'])) {
            $_SESSION['created'] = time();
        } else if (time() - $_SESSION['created'] > 300) { // 5 minutos
            session_regenerate_id(true);
            $_SESSION['created'] = time();
        }
    }
}

// Função para verificar se usuário está logado
function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

// Função para verificar se usuário é admin
function isAdmin() {
    return isLoggedIn() && isset($_SESSION['is_admin']) && $_SESSION['is_admin'] == 1;
}

// Função para fazer login do usuário
function loginUser($user_data) {
    session_regenerate_id(true);
    $_SESSION['user_id'] = $user_data['id'];
    $_SESSION['user_name'] = $user_data['name'];
    $_SESSION['user_email'] = $user_data['email'];
    $_SESSION['is_admin'] = $user_data['is_admin'];
    $_SESSION['created'] = time();
    $_SESSION['last_activity'] = time();
}

// Função para fazer logout
function logoutUser() {
    session_unset();
    session_destroy();
    session_start();
    session_regenerate_id(true);
}

// Função para verificar permissões de admin
function requireAdmin() {
    if (!isAdmin()) {
        header('HTTP/1.1 403 Forbidden');
        header('Location: /auth/login.php?error=admin_required');
        exit;
    }
}

// Função para verificar login obrigatório
function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: /auth/login.php?redirect=' . urlencode($_SERVER['REQUEST_URI']));
        exit;
    }
}
?>
