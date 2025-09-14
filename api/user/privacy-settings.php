<?php
require_once '../../config/cors_config.php';

require_once '../../config/database.php';
require_once '../../config/session_cookies.php';

try {
    // Validar sessão
    $user = validateSession($pdo);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Usuário não autenticado']);
        exit;
    }

    $user_id = $user['id'];

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Buscar configurações de privacidade
        $stmt = $pdo->prepare("
            SELECT profile_visibility, show_email, allow_messages, share_location, 
                   show_online_status, allow_tagging 
            FROM user_privacy_settings 
            WHERE user_id = ?
        ");
        $stmt->execute([$user_id]);
        $settings = $stmt->fetch();

        if (!$settings) {
            // Criar configurações padrão se não existirem
            $stmt = $pdo->prepare("
                INSERT INTO user_privacy_settings 
                (user_id, profile_visibility, show_email, allow_messages, share_location, show_online_status, allow_tagging) 
                VALUES (?, 1, 0, 1, 0, 1, 1)
            ");
            $stmt->execute([$user_id]);
            
            $settings = [
                'profile_visibility' => 1,
                'show_email' => 0,
                'allow_messages' => 1,
                'share_location' => 0,
                'show_online_status' => 1,
                'allow_tagging' => 1
            ];
        }

        // Converter para boolean
        $settings = array_map(function($value) {
            return (bool)$value;
        }, $settings);

        echo json_encode([
            'success' => true,
            'settings' => $settings
        ]);

    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Atualizar configurações de privacidade
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
            exit;
        }

        $profile_visibility = isset($input['profileVisibility']) ? (int)$input['profileVisibility'] : 1;
        $show_email = isset($input['showEmail']) ? (int)$input['showEmail'] : 0;
        $allow_messages = isset($input['allowMessages']) ? (int)$input['allowMessages'] : 1;
        $share_location = isset($input['shareLocation']) ? (int)$input['shareLocation'] : 0;
        $show_online_status = isset($input['showOnlineStatus']) ? (int)$input['showOnlineStatus'] : 1;
        $allow_tagging = isset($input['allowTagging']) ? (int)$input['allowTagging'] : 1;

        // Inserir ou atualizar configurações
        $stmt = $pdo->prepare("
            INSERT INTO user_privacy_settings 
            (user_id, profile_visibility, show_email, allow_messages, share_location, show_online_status, allow_tagging) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            profile_visibility = VALUES(profile_visibility),
            show_email = VALUES(show_email),
            allow_messages = VALUES(allow_messages),
            share_location = VALUES(share_location),
            show_online_status = VALUES(show_online_status),
            allow_tagging = VALUES(allow_tagging),
            updated_at = CURRENT_TIMESTAMP
        ");
        
        $stmt->execute([$user_id, $profile_visibility, $show_email, $allow_messages, 
                       $share_location, $show_online_status, $allow_tagging]);

        // Log de segurança
        logSecurityEvent($pdo, $user_id, 'PRIVACY_SETTINGS_UPDATED', json_encode($input));

        echo json_encode([
            'success' => true,
            'message' => 'Configurações de privacidade atualizadas com sucesso'
        ]);
    }

} catch (Exception $e) {
    error_log("Privacy settings error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}
?>