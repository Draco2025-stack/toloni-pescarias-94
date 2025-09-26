<?php
/**
 * API de Logout - Toloni Pescarias
 * Segue padrão do prompt-mestre
 */

// Incluir configurações unificadas
require_once '../../config/database_hostinger.php';
require_once '../../config/cors_unified.php';
require_once '../../config/session_cookies.php';

// Validar método
requireMethod('POST');

try {
    $sessionToken = $_COOKIE['session_token'] ?? null;
    
    if ($sessionToken) {
        // Obter dados do usuário antes de destruir a sessão
        $user = validateSession($pdo, $sessionToken);
        
        if ($user) {
            // Log de segurança
            logSecurityEvent($pdo, $user['id'], 'LOGOUT_SUCCESS', "Session: $sessionToken");
        }
        
        // Destruir sessão
        destroyUserSession($pdo, $sessionToken);
    }
    
    sendJsonResponse(true, null);

} catch (Exception $e) {
    error_log("Logout error: " . $e->getMessage());
    sendError('INTERNAL_ERROR', 'Erro interno do servidor', 500);
}
?>