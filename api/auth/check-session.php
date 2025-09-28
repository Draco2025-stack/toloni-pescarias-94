<?php
/**
 * API de Verificação de Sessão - Toloni Pescarias
 * Segue padrão do prompt-mestre
 */

// Incluir configurações unificadas
require_once '../../config/database_hostinger.php';
require_once '../../config/cors_unified.php';
require_once '../../config/session_cookies.php';
require_once '../../lib/response.php';

// Validar método
requireMethod('GET');

try {
    $user = validateSession($pdo);
    
    if ($user) {
        // Renovar sessão se válida
        renewSession($pdo);
        
        json_ok([
            'authenticated' => true,
            'user' => [
                'id' => (int)$user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'is_admin' => (bool)$user['is_admin'],
                'profile_image' => $user['profile_image'],
                'email_verified' => (bool)$user['email_verified']
            ]
        ]);
    } else {
        json_ok([
            'authenticated' => false,
            'user' => null
        ]);
    }

} catch (Exception $e) {
    error_log("Check session error: " . $e->getMessage());
    json_error('Erro interno do servidor', 500);
}
?>