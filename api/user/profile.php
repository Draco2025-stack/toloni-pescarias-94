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

header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../config/database.php';
require_once '../../config/session_cookies.php';
require_once '../../config/security.php';

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
        // Buscar dados do perfil do usuário
        $stmt = $pdo->prepare("
            SELECT name, email, bio, profile_image, phone, location, experience_level, created_at 
            FROM users 
            WHERE id = ?
        ");
        $stmt->execute([$user_id]);
        $profile = $stmt->fetch();

        if (!$profile) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Usuário não encontrado']);
            exit;
        }

        // Buscar relatórios do usuário
        $stmt = $pdo->prepare("
            SELECT id, title, content, location_id, images, fish_species, fish_weight, 
                   is_public, approved, likes_count, comments_count, created_at,
                   (SELECT name FROM locations WHERE id = reports.location_id) as location_name
            FROM reports 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        ");
        $stmt->execute([$user_id]);
        $reports = $stmt->fetchAll();

        // Processar relatórios
        foreach ($reports as &$report) {
            $report['images'] = json_decode($report['images'] ?? '[]', true);
            $report['is_public'] = (bool)$report['is_public'];
            $report['approved'] = (bool)$report['approved'];
        }

        echo json_encode([
            'success' => true,
            'profile' => $profile,
            'reports' => $reports
        ]);

    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Atualizar perfil do usuário
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
            exit;
        }

        $name = trim($input['name'] ?? '');
        $bio = trim($input['bio'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $location = trim($input['location'] ?? '');
        $experience_level = $input['experience_level'] ?? 'iniciante';

        // Validações
        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Nome é obrigatório']);
            exit;
        }

        if (strlen($name) > 100) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Nome muito longo']);
            exit;
        }

        if (strlen($bio) > 500) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Bio muito longa']);
            exit;
        }

        $allowed_experience = ['iniciante', 'intermediario', 'avancado', 'profissional'];
        if (!in_array($experience_level, $allowed_experience)) {
            $experience_level = 'iniciante';
        }

        // Atualizar perfil
        $stmt = $pdo->prepare("
            UPDATE users 
            SET name = ?, bio = ?, phone = ?, location = ?, experience_level = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        ");
        $stmt->execute([$name, $bio, $phone, $location, $experience_level, $user_id]);

        // Alterar senha se fornecida
        if (!empty($input['newPassword'])) {
            $currentPassword = $input['currentPassword'] ?? '';
            $newPassword = $input['newPassword'];
            $confirmPassword = $input['confirmPassword'] ?? '';

            // Validar senha atual
            $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
            $stmt->execute([$user_id]);
            $currentHash = $stmt->fetchColumn();

            if (!password_verify($currentPassword, $currentHash)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Senha atual incorreta']);
                exit;
            }

            if ($newPassword !== $confirmPassword) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Confirmação de senha não confere']);
                exit;
            }

            if (strlen($newPassword) < 6) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Nova senha deve ter pelo menos 6 caracteres']);
                exit;
            }

            // Atualizar senha
            $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
            $stmt->execute([$newHash, $user_id]);

            // Log de segurança
            logSecurityEvent($pdo, $user_id, 'PASSWORD_CHANGED', 'Password changed via profile');
        }

        // Atualizar visibilidade dos relatórios se fornecida
        if (isset($input['reportVisibility']) && is_array($input['reportVisibility'])) {
            foreach ($input['reportVisibility'] as $report_id => $is_public) {
                $stmt = $pdo->prepare("
                    UPDATE reports 
                    SET is_public = ? 
                    WHERE id = ? AND user_id = ?
                ");
                $stmt->execute([(int)$is_public, $report_id, $user_id]);
            }
        }

        // Log de segurança
        logSecurityEvent($pdo, $user_id, 'PROFILE_UPDATED', json_encode([
            'name_changed' => !empty($input['name']),
            'bio_changed' => !empty($input['bio']),
            'password_changed' => !empty($input['newPassword']),
            'reports_visibility_changed' => !empty($input['reportVisibility'])
        ]));

        echo json_encode([
            'success' => true,
            'message' => 'Perfil atualizado com sucesso'
        ]);
    }

} catch (Exception $e) {
    error_log("Profile error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}
?>