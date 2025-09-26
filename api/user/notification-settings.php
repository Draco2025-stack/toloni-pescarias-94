<?php
/**
 * API de Configurações de Notificações - Toloni Pescarias
 * Segue padrão do prompt-mestre
 */

// Incluir configurações unificadas
require_once '../../config/database_hostinger.php';
require_once '../../config/cors_unified.php';
require_once '../../config/session_cookies.php';

// Validar método
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    getNotificationSettings();
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    updateNotificationSettings();
} else {
    sendError('METHOD_NOT_ALLOWED', 'Método não permitido', 405);
}

function getNotificationSettings() {
    global $pdo;
    
    try {
        $user = requireAuth();
        
        // Buscar configurações de notificação
        $stmt = executeQuery($pdo, "
            SELECT email_notifications, push_notifications, new_comment_notifications, 
                   new_follower_notifications, trophy_notifications, weekly_digest
            FROM user_notification_settings 
            WHERE user_id = ?
        ", [$user['id']]);
        
        $settings = $stmt->fetch();
        
        // Se não existir, criar configurações padrão
        if (!$settings) {
            executeQuery($pdo, "
                INSERT INTO user_notification_settings 
                (user_id, email_notifications, push_notifications, new_comment_notifications, 
                 new_follower_notifications, trophy_notifications, weekly_digest)
                VALUES (?, 1, 1, 1, 1, 1, 1)
            ", [$user['id']]);
            
            $settings = [
                'email_notifications' => true,
                'push_notifications' => true,
                'new_comment_notifications' => true,
                'new_follower_notifications' => true,
                'trophy_notifications' => true,
                'weekly_digest' => true
            ];
        } else {
            // Converter para booleanos
            $settings['email_notifications'] = (bool)$settings['email_notifications'];
            $settings['push_notifications'] = (bool)$settings['push_notifications'];
            $settings['new_comment_notifications'] = (bool)$settings['new_comment_notifications'];
            $settings['new_follower_notifications'] = (bool)$settings['new_follower_notifications'];
            $settings['trophy_notifications'] = (bool)$settings['trophy_notifications'];
            $settings['weekly_digest'] = (bool)$settings['weekly_digest'];
        }
        
        sendJsonResponse(true, [
            'settings' => $settings
        ]);
        
    } catch (Exception $e) {
        error_log("Get notification settings error: " . $e->getMessage());
        sendError('INTERNAL_ERROR', 'Erro interno do servidor', 500);
    }
}

function updateNotificationSettings() {
    global $pdo;
    
    try {
        $user = requireAuth();
        
        // Decodificar entrada JSON
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            sendError('INVALID_INPUT', 'Dados de entrada inválidos');
        }
        
        // Validar dados
        $emailNotifications = isset($input['email_notifications']) ? (bool)$input['email_notifications'] : null;
        $pushNotifications = isset($input['push_notifications']) ? (bool)$input['push_notifications'] : null;
        $newCommentNotifications = isset($input['new_comment_notifications']) ? (bool)$input['new_comment_notifications'] : null;
        $newFollowerNotifications = isset($input['new_follower_notifications']) ? (bool)$input['new_follower_notifications'] : null;
        $trophyNotifications = isset($input['trophy_notifications']) ? (bool)$input['trophy_notifications'] : null;
        $weeklyDigest = isset($input['weekly_digest']) ? (bool)$input['weekly_digest'] : null;
        
        // Atualizar configurações (INSERT ... ON DUPLICATE KEY UPDATE)
        executeQuery($pdo, "
            INSERT INTO user_notification_settings 
            (user_id, email_notifications, push_notifications, new_comment_notifications, 
             new_follower_notifications, trophy_notifications, weekly_digest)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            email_notifications = COALESCE(VALUES(email_notifications), email_notifications),
            push_notifications = COALESCE(VALUES(push_notifications), push_notifications),
            new_comment_notifications = COALESCE(VALUES(new_comment_notifications), new_comment_notifications),
            new_follower_notifications = COALESCE(VALUES(new_follower_notifications), new_follower_notifications),
            trophy_notifications = COALESCE(VALUES(trophy_notifications), trophy_notifications),
            weekly_digest = COALESCE(VALUES(weekly_digest), weekly_digest),
            updated_at = NOW()
        ", [
            $user['id'],
            $emailNotifications,
            $pushNotifications,
            $newCommentNotifications,
            $newFollowerNotifications,
            $trophyNotifications,
            $weeklyDigest
        ]);
        
        // Log de segurança
        logSecurityEvent($pdo, $user['id'], 'NOTIFICATION_SETTINGS_UPDATED', "Fields: " . implode(', ', array_keys($input)));
        
        sendJsonResponse(true, [
            'message' => 'Configurações de notificação atualizadas com sucesso'
        ]);
        
    } catch (Exception $e) {
        error_log("Update notification settings error: " . $e->getMessage());
        sendError('INTERNAL_ERROR', 'Erro interno do servidor', 500);
    }
}
?>