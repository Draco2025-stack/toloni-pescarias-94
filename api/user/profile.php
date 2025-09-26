<?php
/**
 * API de Perfil do Usuário - Toloni Pescarias
 * Segue padrão do prompt-mestre
 */

// Incluir configurações unificadas
require_once '../../config/database_hostinger.php';
require_once '../../config/cors_unified.php';
require_once '../../config/session_cookies.php';

// Validar método
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    getUserProfile();
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    updateUserProfile();
} else {
    sendError('METHOD_NOT_ALLOWED', 'Método não permitido', 405);
}

function getUserProfile() {
    global $pdo;
    
    try {
        $user = requireAuth();
        
        // Buscar dados completos do usuário
        $stmt = executeQuery($pdo, "
            SELECT id, name, email, bio, phone, location, profile_image, 
                   experience_level, email_verified, created_at
            FROM users 
            WHERE id = ? AND active = 1
        ", [$user['id']]);
        
        $userData = $stmt->fetch();
        
        if (!$userData) {
            sendError('USER_NOT_FOUND', 'Usuário não encontrado', 404);
        }
        
        // Buscar estatísticas do usuário
        $stats = [];
        
        // Contagem de relatórios
        $stmt = executeQuery($pdo, "SELECT COUNT(*) FROM reports WHERE user_id = ?", [$user['id']]);
        $stats['reports_count'] = (int)$stmt->fetchColumn();
        
        // Contagem de curtidas recebidas
        $stmt = executeQuery($pdo, "
            SELECT COUNT(*) FROM report_likes rl 
            JOIN reports r ON rl.report_id = r.id 
            WHERE r.user_id = ?
        ", [$user['id']]);
        $stats['likes_received'] = (int)$stmt->fetchColumn();
        
        // Conversões de tipo
        $userData['email_verified'] = (bool)$userData['email_verified'];
        
        sendJsonResponse(true, [
            'user' => $userData,
            'stats' => $stats
        ]);
        
    } catch (Exception $e) {
        error_log("Get user profile error: " . $e->getMessage());
        sendError('INTERNAL_ERROR', 'Erro interno do servidor', 500);
    }
}

function updateUserProfile() {
    global $pdo;
    
    try {
        $user = requireAuth();
        
        // Decodificar entrada JSON
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            sendError('INVALID_INPUT', 'Dados de entrada inválidos');
        }
        
        $updates = [];
        $params = [];
        
        // Validar e preparar campos para atualização
        if (isset($input['name'])) {
            $name = trim($input['name']);
            if (empty($name) || strlen($name) > 100) {
                sendError('INVALID_INPUT', 'Nome deve ter entre 1 e 100 caracteres');
            }
            $updates[] = "name = ?";
            $params[] = $name;
        }
        
        if (isset($input['bio'])) {
            $bio = trim($input['bio']);
            if (strlen($bio) > 500) {
                sendError('INVALID_INPUT', 'Bio deve ter no máximo 500 caracteres');
            }
            $updates[] = "bio = ?";
            $params[] = $bio;
        }
        
        if (isset($input['phone'])) {
            $phone = trim($input['phone']);
            if (!empty($phone) && !preg_match('/^\(\d{2}\)\s\d{4,5}-\d{4}$/', $phone)) {
                sendError('INVALID_INPUT', 'Formato de telefone inválido. Use: (11) 99999-9999');
            }
            $updates[] = "phone = ?";
            $params[] = $phone;
        }
        
        if (isset($input['location'])) {
            $location = trim($input['location']);
            if (strlen($location) > 100) {
                sendError('INVALID_INPUT', 'Localização deve ter no máximo 100 caracteres');
            }
            $updates[] = "location = ?";
            $params[] = $location;
        }
        
        if (isset($input['experience_level'])) {
            $validLevels = ['iniciante', 'intermediario', 'avancado', 'profissional'];
            if (!in_array($input['experience_level'], $validLevels)) {
                sendError('INVALID_INPUT', 'Nível de experiência inválido');
            }
            $updates[] = "experience_level = ?";
            $params[] = $input['experience_level'];
        }
        
        if (isset($input['profile_image'])) {
            $profileImage = trim($input['profile_image']);
            if (!empty($profileImage) && !filter_var($profileImage, FILTER_VALIDATE_URL)) {
                sendError('INVALID_INPUT', 'URL da imagem de perfil inválida');
            }
            $updates[] = "profile_image = ?";
            $params[] = $profileImage;
        }
        
        if (empty($updates)) {
            sendError('INVALID_INPUT', 'Nenhum campo válido para atualizar');
        }
        
        // Atualizar usuário
        $updates[] = "updated_at = NOW()";
        $params[] = $user['id'];
        
        $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
        executeQuery($pdo, $sql, $params);
        
        // Log de segurança
        logSecurityEvent($pdo, $user['id'], 'PROFILE_UPDATED', "Fields: " . implode(', ', array_keys($input)));
        
        sendJsonResponse(true, [
            'message' => 'Perfil atualizado com sucesso'
        ]);
        
    } catch (Exception $e) {
        error_log("Update user profile error: " . $e->getMessage());
        sendError('INTERNAL_ERROR', 'Erro interno do servidor', 500);
    }
}
?>