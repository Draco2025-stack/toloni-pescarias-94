<?php
/**
 * Configuração de CSRF Protection - Toloni Pescarias
 * Gera e valida tokens CSRF para proteger contra ataques CSRF
 */

require_once __DIR__ . '/session_cookies.php';

/**
 * Gerar token CSRF e armazenar na sessão
 */
function generateCSRFToken(): string {
    // Iniciar sessão se não estiver ativa
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Gerar novo token se não existir
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    
    return $_SESSION['csrf_token'];
}

/**
 * Validar token CSRF
 */
function validateCSRFToken(?string $token): bool {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    if (!isset($_SESSION['csrf_token']) || !$token) {
        return false;
    }
    
    return hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Obter token CSRF da requisição (header ou POST)
 */
function getCSRFTokenFromRequest(): ?string {
    // Verificar header primeiro
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
    
    // Se não encontrou no header, verificar no POST
    if (!$token) {
        $token = $_POST['csrf_token'] ?? null;
    }
    
    // Se ainda não encontrou, tentar no JSON body
    if (!$token) {
        $input = json_decode(file_get_contents('php://input'), true);
        $token = $input['csrf_token'] ?? null;
    }
    
    return $token;
}

/**
 * Middleware para validar CSRF em operações de escrita
 */
function requireCSRFToken(): void {
    $token = getCSRFTokenFromRequest();
    
    if (!validateCSRFToken($token)) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Token CSRF inválido ou ausente',
            'error' => 'CSRF_TOKEN_INVALID'
        ]);
        exit;
    }
}

/**
 * Adicionar token CSRF como meta tag no HTML
 */
function renderCSRFMetaTag(): string {
    $token = generateCSRFToken();
    return "<meta name=\"csrf-token\" content=\"$token\">";
}

/**
 * Adicionar token CSRF como input hidden no formulário
 */
function renderCSRFInputField(): string {
    $token = generateCSRFToken();
    return "<input type=\"hidden\" name=\"csrf_token\" value=\"$token\">";
}

/**
 * Obter token CSRF atual
 */
function getCurrentCSRFToken(): string {
    return generateCSRFToken();
}

/**
 * Renovar token CSRF (útil após login/logout)
 */
function renewCSRFToken(): string {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    unset($_SESSION['csrf_token']);
    return generateCSRFToken();
}
?>