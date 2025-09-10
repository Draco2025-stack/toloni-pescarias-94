<?php
header('Content-Type: application/json; charset=utf-8');

// Configurar CORS
$allowedOrigins = [
    'https://tolonipescarias.com.br',
    'http://localhost:8080',
    'https://localhost:8080'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins) || strpos($origin, 'lovable') !== false) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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
        // Buscar configurações de notificações
        $stmt = $pdo->prepare("
            SELECT email_notifications, push_notifications, new_reports, new_comments, 
                   comment_replies, likes, follows, system_updates, newsletter, 
                   fishing_tips, location_suggestions 
            FROM user_notification_settings 
            WHERE user_id = ?
        ");
        $stmt->execute([$user_id]);
        $settings = $stmt->fetch();

        if (!$settings) {
            // Criar configurações padrão se não existirem
            $stmt = $pdo->prepare("
                INSERT INTO user_notification_settings 
                (user_id, email_notifications, push_notifications, new_reports, new_comments, 
                 comment_replies, likes, follows, system_updates, newsletter, fishing_tips, location_suggestions) 
                VALUES (?, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1)
            ");
            $stmt->execute([$user_id]);
            
            $settings = [
                'email_notifications' => 1,
                'push_notifications' => 1,
                'new_reports' => 1,
                'new_comments' => 1,
                'comment_replies' => 1,
                'likes' => 1,
                'follows' => 1,
                'system_updates' => 1,
                'newsletter' => 0,
                'fishing_tips' => 1,
                'location_suggestions' => 1
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
        // Atualizar configurações de notificações
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
            exit;
        }

        $email_notifications = isset($input['emailNotifications']) ? (int)$input['emailNotifications'] : 1;
        $push_notifications = isset($input['pushNotifications']) ? (int)$input['pushNotifications'] : 1;
        $new_reports = isset($input['newReports']) ? (int)$input['newReports'] : 1;
        $new_comments = isset($input['newComments']) ? (int)$input['newComments'] : 1;
        $comment_replies = isset($input['commentReplies']) ? (int)$input['commentReplies'] : 1;
        $likes = isset($input['likes']) ? (int)$input['likes'] : 1;
        $follows = isset($input['follows']) ? (int)$input['follows'] : 1;
        $system_updates = isset($input['systemUpdates']) ? (int)$input['systemUpdates'] : 1;
        $newsletter = isset($input['newsletter']) ? (int)$input['newsletter'] : 0;
        $fishing_tips = isset($input['fishingTips']) ? (int)$input['fishingTips'] : 1;
        $location_suggestions = isset($input['locationSuggestions']) ? (int)$input['locationSuggestions'] : 1;

        // Inserir ou atualizar configurações
        $stmt = $pdo->prepare("
            INSERT INTO user_notification_settings 
            (user_id, email_notifications, push_notifications, new_reports, new_comments, 
             comment_replies, likes, follows, system_updates, newsletter, fishing_tips, location_suggestions) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            email_notifications = VALUES(email_notifications),
            push_notifications = VALUES(push_notifications),
            new_reports = VALUES(new_reports),
            new_comments = VALUES(new_comments),
            comment_replies = VALUES(comment_replies),
            likes = VALUES(likes),
            follows = VALUES(follows),
            system_updates = VALUES(system_updates),
            newsletter = VALUES(newsletter),
            fishing_tips = VALUES(fishing_tips),
            location_suggestions = VALUES(location_suggestions),
            updated_at = CURRENT_TIMESTAMP
        ");
        
        $stmt->execute([$user_id, $email_notifications, $push_notifications, $new_reports, 
                       $new_comments, $comment_replies, $likes, $follows, $system_updates, 
                       $newsletter, $fishing_tips, $location_suggestions]);

        // Log de segurança
        logSecurityEvent($pdo, $user_id, 'NOTIFICATION_SETTINGS_UPDATED', json_encode($input));

        echo json_encode([
            'success' => true,
            'message' => 'Configurações de notificação atualizadas com sucesso'
        ]);
    }

} catch (Exception $e) {
    error_log("Notification settings error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}
?>