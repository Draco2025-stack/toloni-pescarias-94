<?php
require_once '../../config/database_hostinger.php';
require_once '../../config/cors_unified.php';
require_once '../../config/session_cookies.php';

try {
    // Validar autenticação de admin
    $user = validateSession($pdo);
    if (!$user || !$user['is_admin']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Acesso negado']);
        exit;
    }

    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            getUsers($pdo);
            break;
        case 'POST':
            updateUserStatus($pdo);
            break;
        case 'DELETE':
            deleteUser($pdo);
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    }

} catch (Exception $e) {
    error_log("Admin Users API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}

function getUsers($pdo) {
    try {
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = max((int)($_GET['offset'] ?? 0), 0);
        $search = $_GET['search'] ?? '';
        
        $where_clause = '';
        $params = [];
        
        if (!empty($search)) {
            $where_clause = "WHERE u.name LIKE ? OR u.email LIKE ?";
            $searchTerm = "%$search%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                u.id, u.name, u.email, u.is_admin, u.email_verified, u.experience_level,
                u.created_at, u.last_login,
                CASE 
                    WHEN u.is_admin = 1 THEN 'active'
                    WHEN u.email_verified = 1 THEN 'active'
                    ELSE 'pending'
                END as status,
                COUNT(DISTINCT r.id) as reports_count,
                COUNT(DISTINCT c.id) as comments_count
            FROM users u
            LEFT JOIN reports r ON u.id = r.user_id
            LEFT JOIN comments c ON u.id = c.user_id
            $where_clause
            GROUP BY u.id
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        ");
        
        $params[] = $limit;
        $params[] = $offset;
        $stmt->execute($params);
        $users = $stmt->fetchAll();
        
        // Formatar dados para o frontend
        foreach ($users as &$user_item) {
            $user_item['is_admin'] = (bool)$user_item['is_admin'];
            $user_item['email_verified'] = (bool)$user_item['email_verified'];
            $user_item['reports_count'] = (int)$user_item['reports_count'];
            $user_item['comments_count'] = (int)$user_item['comments_count'];
        }
        
        echo json_encode([
            'success' => true,
            'users' => $users
        ]);
        
    } catch (Exception $e) {
        error_log("Get users error: " . $e->getMessage());
        throw $e;
    }
}

function updateUserStatus($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['action'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ação não especificada']);
            return;
        }

        switch ($input['action']) {
            case 'update_user_status':
                $user_id = (int)$input['user_id'];
                $status = $input['status']; // 'active' or 'suspended'
                $is_admin = isset($input['is_admin']) ? (bool)$input['is_admin'] : false;
                
                $updates = [];
                $params = [];
                
                if ($status === 'active') {
                    $updates[] = "email_verified = 1";
                } elseif ($status === 'suspended') {
                    $updates[] = "email_verified = 0";
                    $updates[] = "is_admin = 0"; // Remove admin se suspenso
                }
                
                if ($status === 'active' && $is_admin) {
                    $updates[] = "is_admin = 1";
                }
                
                if (!empty($updates)) {
                    $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([$user_id]);
                }
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Status do usuário atualizado com sucesso'
                ]);
                break;
                
            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Ação inválida']);
        }
        
    } catch (Exception $e) {
        error_log("Update user status error: " . $e->getMessage());
        throw $e;
    }
}

function deleteUser($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['action']) || $input['action'] !== 'delete_user') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ação inválida']);
            return;
        }
        
        $user_id = (int)$input['user_id'];
        
        // Verificar se não é o próprio usuário admin
        global $user;
        if ($user_id === $user['id']) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Você não pode deletar sua própria conta']);
            return;
        }
        
        // Iniciar transação
        $pdo->beginTransaction();
        
        try {
            // Deletar dados relacionados
            $pdo->prepare("DELETE FROM comments WHERE user_id = ?")->execute([$user_id]);
            $pdo->prepare("DELETE FROM reports WHERE user_id = ?")->execute([$user_id]);
            $pdo->prepare("DELETE FROM trophy_entries WHERE user_id = ?")->execute([$user_id]);
            $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$user_id]);
            
            $pdo->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Usuário deletado com sucesso'
            ]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        
    } catch (Exception $e) {
        error_log("Delete user error: " . $e->getMessage());
        throw $e;
    }
}
?>