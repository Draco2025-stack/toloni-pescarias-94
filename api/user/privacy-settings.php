<?php
/**
 * API de Configurações de Privacidade - Toloni Pescarias
 * Segue padrão do prompt-mestre
 */

// Incluir configurações unificadas
require_once '../../config/database_hostinger.php';
require_once '../../config/cors_unified.php';
require_once '../../config/session_cookies.php';

// Validar método
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    getPrivacySettings();
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    updatePrivacySettings();
} else {
    sendError('METHOD_NOT_ALLOWED', 'Método não permitido', 405);
}

function getPrivacySettings() {
    global $pdo;
    
    try {
        $user = requireAuth();
        
        // Buscar configurações de privacidade
        $stmt = executeQuery($pdo, "
            SELECT show_email, show_phone, show_location, allow_messages, profile_visibility
            FROM user_privacy_settings 
            WHERE user_id = ?
        ", [$user['id']]);
        
        $settings = $stmt->fetch();
        
        // Se não existir, criar configurações padrão
        if (!$settings) {
            executeQuery($pdo, "
                INSERT INTO user_privacy_settings (user_id, show_email, show_phone, show_location, allow_messages, profile_visibility)
                VALUES (?, 0, 0, 1, 1, 'public')
            ", [$user['id']]);
            
            $settings = [
                'show_email' => false,
                'show_phone' => false,
                'show_location' => true,
                'allow_messages' => true,
                'profile_visibility' => 'public'
            ];
        } else {
            // Converter para booleanos
            $settings['show_email'] = (bool)$settings['show_email'];
            $settings['show_phone'] = (bool)$settings['show_phone'];
            $settings['show_location'] = (bool)$settings['show_location'];
            $settings['allow_messages'] = (bool)$settings['allow_messages'];
        }
        
        sendJsonResponse(true, [
            'settings' => $settings
        ]);
        
    } catch (Exception $e) {
        error_log("Get privacy settings error: " . $e->getMessage());
        sendError('INTERNAL_ERROR', 'Erro interno do servidor', 500);
    }
}

function updatePrivacySettings() {
    global $pdo;
    
    try {
        $user = requireAuth();
        
        // Decodificar entrada JSON
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            sendError('INVALID_INPUT', 'Dados de entrada inválidos');
        }
        
        // Validar dados
        $validVisibility = ['public', 'friends', 'private'];
        
        $showEmail = isset($input['show_email']) ? (bool)$input['show_email'] : null;
        $showPhone = isset($input['show_phone']) ? (bool)$input['show_phone'] : null;
        $showLocation = isset($input['show_location']) ? (bool)$input['show_location'] : null;
        $allowMessages = isset($input['allow_messages']) ? (bool)$input['allow_messages'] : null;
        $profileVisibility = $input['profile_visibility'] ?? null;
        
        if ($profileVisibility && !in_array($profileVisibility, $validVisibility)) {
            sendError('INVALID_INPUT', 'Visibilidade do perfil inválida');
        }
        
        // Atualizar configurações (INSERT ... ON DUPLICATE KEY UPDATE)
        executeQuery($pdo, "
            INSERT INTO user_privacy_settings (user_id, show_email, show_phone, show_location, allow_messages, profile_visibility)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            show_email = COALESCE(VALUES(show_email), show_email),
            show_phone = COALESCE(VALUES(show_phone), show_phone),
            show_location = COALESCE(VALUES(show_location), show_location),
            allow_messages = COALESCE(VALUES(allow_messages), allow_messages),
            profile_visibility = COALESCE(VALUES(profile_visibility), profile_visibility),
            updated_at = NOW()
        ", [
            $user['id'],
            $showEmail,
            $showPhone,
            $showLocation,
            $allowMessages,
            $profileVisibility
        ]);
        
        // Log de segurança
        logSecurityEvent($pdo, $user['id'], 'PRIVACY_SETTINGS_UPDATED', "Fields: " . implode(', ', array_keys($input)));
        
        sendJsonResponse(true, [
            'message' => 'Configurações de privacidade atualizadas com sucesso'
        ]);
        
    } catch (Exception $e) {
        error_log("Update privacy settings error: " . $e->getMessage());
        sendError('INTERNAL_ERROR', 'Erro interno do servidor', 500);
    }
}
?>