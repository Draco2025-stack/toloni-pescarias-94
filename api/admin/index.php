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

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../config/database.php';
require_once '../../config/security.php';

try {
    // Validar autenticação de admin
    $user = validateSession($pdo);
    if (!$user || !$user['is_admin']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Acesso negado']);
        exit;
    }

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';

    switch ($action) {
        case 'dashboard':
            getDashboardStats($pdo);
            break;
            
        case 'users':
            if ($method === 'GET') {
                getUsers($pdo);
            } elseif ($method === 'PUT') {
                updateUser($pdo);
            }
            break;
            
        case 'pending-approvals':
            getPendingApprovals($pdo);
            break;
            
        case 'approve-content':
            approveContent($pdo);
            break;
            
        case 'carousels':
            handleCarousels($pdo, $method);
            break;
            
        case 'security-logs':
            getSecurityLogs($pdo);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ação não reconhecida']);
    }

} catch (Exception $e) {
    error_log("Admin API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}

function getDashboardStats($pdo) {
    try {
        // Estatísticas gerais
        $stats = [];
        
        // Usuários
        $stmt = $pdo->query("SELECT COUNT(*) FROM users");
        $stats['total_users'] = (int)$stmt->fetchColumn();
        
        $stmt = $pdo->query("SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
        $stats['new_users_month'] = (int)$stmt->fetchColumn();
        
        // Relatórios
        $stmt = $pdo->query("SELECT COUNT(*) FROM reports");
        $stats['total_reports'] = (int)$stmt->fetchColumn();
        
        $stmt = $pdo->query("SELECT COUNT(*) FROM reports WHERE approved = 0");
        $stats['pending_reports'] = (int)$stmt->fetchColumn();
        
        // Localizações
        $stmt = $pdo->query("SELECT COUNT(*) FROM locations");
        $stats['total_locations'] = (int)$stmt->fetchColumn();
        
        $stmt = $pdo->query("SELECT COUNT(*) FROM locations WHERE is_approved = 0");
        $stats['pending_locations'] = (int)$stmt->fetchColumn();
        
        // Comentários
        $stmt = $pdo->query("SELECT COUNT(*) FROM comments");
        $stats['total_comments'] = (int)$stmt->fetchColumn();
        
        $stmt = $pdo->query("SELECT COUNT(*) FROM comments WHERE is_approved = 0");
        $stats['pending_comments'] = (int)$stmt->fetchColumn();
        
        // Atividade recente
        $stmt = $pdo->query("
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM reports 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        ");
        $stats['reports_activity'] = $stmt->fetchAll();
        
        // Top usuários por relatórios
        $stmt = $pdo->query("
            SELECT u.name, u.email, COUNT(r.id) as reports_count
            FROM users u
            LEFT JOIN reports r ON u.id = r.user_id
            GROUP BY u.id
            ORDER BY reports_count DESC
            LIMIT 10
        ");
        $stats['top_users'] = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'stats' => $stats
        ]);
        
    } catch (Exception $e) {
        error_log("Get dashboard stats error: " . $e->getMessage());
        throw $e;
    }
}

function getUsers($pdo) {
    try {
        $limit = min((int)($_GET['limit'] ?? 20), 100);
        $offset = max((int)($_GET['offset'] ?? 0), 0);
        $search = $_GET['search'] ?? '';
        
        $where_clause = '';
        $params = [];
        
        if (!empty($search)) {
            $where_clause = "WHERE name LIKE ? OR email LIKE ?";
            $searchTerm = "%$search%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                u.id, u.name, u.email, u.is_admin, u.is_verified, u.experience_level,
                u.created_at, u.last_login,
                COUNT(r.id) as reports_count,
                COUNT(c.id) as comments_count
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
        
        foreach ($users as &$user) {
            $user['is_admin'] = (bool)$user['is_admin'];
            $user['is_verified'] = (bool)$user['is_verified'];
            $user['reports_count'] = (int)$user['reports_count'];
            $user['comments_count'] = (int)$user['comments_count'];
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

function updateUser($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['user_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
            return;
        }
        
        $user_id = (int)$input['user_id'];
        $updates = [];
        $params = [];
        
        if (isset($input['is_admin'])) {
            $updates[] = "is_admin = ?";
            $params[] = (bool)$input['is_admin'];
        }
        
        if (isset($input['is_verified'])) {
            $updates[] = "is_verified = ?";
            $params[] = (bool)$input['is_verified'];
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Nenhum campo para atualizar']);
            return;
        }
        
        $params[] = $user_id;
        
        $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        echo json_encode([
            'success' => true,
            'message' => 'Usuário atualizado com sucesso'
        ]);
        
    } catch (Exception $e) {
        error_log("Update user error: " . $e->getMessage());
        throw $e;
    }
}

function getPendingApprovals($pdo) {
    try {
        // Relatórios pendentes
        $stmt = $pdo->query("
            SELECT 'report' as type, r.id, r.title as name, r.created_at, u.name as user_name
            FROM reports r
            JOIN users u ON r.user_id = u.id
            WHERE r.approved = 0
            ORDER BY r.created_at DESC
        ");
        $pending_reports = $stmt->fetchAll();
        
        // Localizações pendentes
        $stmt = $pdo->query("
            SELECT 'location' as type, l.id, l.name, l.created_at, u.name as user_name
            FROM locations l
            JOIN users u ON l.suggested_by = u.id
            WHERE l.is_approved = 0
            ORDER BY l.created_at DESC
        ");
        $pending_locations = $stmt->fetchAll();
        
        // Comentários pendentes
        $stmt = $pdo->query("
            SELECT 'comment' as type, c.id, SUBSTRING(c.content, 1, 50) as name, c.created_at, u.name as user_name
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.is_approved = 0
            ORDER BY c.created_at DESC
        ");
        $pending_comments = $stmt->fetchAll();
        
        $pending = array_merge($pending_reports, $pending_locations, $pending_comments);
        
        // Ordenar por data
        usort($pending, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });
        
        echo json_encode([
            'success' => true,
            'pending' => $pending
        ]);
        
    } catch (Exception $e) {
        error_log("Get pending approvals error: " . $e->getMessage());
        throw $e;
    }
}

function approveContent($pdo) {
    try {
        global $user;
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['type']) || !isset($input['id']) || !isset($input['approved'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
            return;
        }
        
        $type = $input['type'];
        $id = (int)$input['id'];
        $approved = (bool)$input['approved'];
        
        switch ($type) {
            case 'report':
                $table = 'reports';
                $field = 'approved';
                break;
            case 'location':
                $table = 'locations';
                $field = 'is_approved';
                break;
            case 'comment':
                $table = 'comments';
                $field = 'is_approved';
                break;
            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Tipo inválido']);
                return;
        }
        
        $stmt = $pdo->prepare("UPDATE $table SET $field = ?, approved_by = ? WHERE id = ?");
        $stmt->execute([$approved, $user['id'], $id]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Conteúdo ' . ($approved ? 'aprovado' : 'rejeitado') . ' com sucesso'
        ]);
        
    } catch (Exception $e) {
        error_log("Approve content error: " . $e->getMessage());
        throw $e;
    }
}

function handleCarousels($pdo, $method) {
    try {
        switch ($method) {
            case 'GET':
                getCarousels($pdo);
                break;
            case 'POST':
                createCarousel($pdo);
                break;
            case 'PUT':
                updateCarousel($pdo);
                break;
            case 'DELETE':
                deleteCarousel($pdo);
                break;
            default:
                http_response_code(405);
                echo json_encode(['success' => false, 'message' => 'Método não permitido']);
        }
    } catch (Exception $e) {
        error_log("Handle carousels error: " . $e->getMessage());
        throw $e;
    }
}

function getCarousels($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT c.*, u.name as created_by_name
            FROM carousels c
            LEFT JOIN users u ON c.created_by = u.id
            ORDER BY c.position_order ASC, c.created_at DESC
        ");
        $carousels = $stmt->fetchAll();
        
        foreach ($carousels as &$carousel) {
            $carousel['is_active'] = (bool)$carousel['is_active'];
        }
        
        echo json_encode([
            'success' => true,
            'carousels' => $carousels
        ]);
        
    } catch (Exception $e) {
        error_log("Get carousels error: " . $e->getMessage());
        throw $e;
    }
}

function createCarousel($pdo) {
    try {
        global $user;
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
            return;
        }
        
        $title = trim($input['title'] ?? '');
        $subtitle = trim($input['subtitle'] ?? '');
        $image = trim($input['image'] ?? '');
        $link_url = trim($input['link_url'] ?? '');
        $link_text = trim($input['link_text'] ?? '');
        $position_order = (int)($input['position_order'] ?? 0);
        $is_active = isset($input['is_active']) ? (bool)$input['is_active'] : true;
        
        if (empty($title) || empty($image)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Título e imagem são obrigatórios']);
            return;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO carousels (title, subtitle, image, link_url, link_text, position_order, is_active, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([$title, $subtitle, $image, $link_url, $link_text, $position_order, $is_active, $user['id']]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Carousel criado com sucesso',
            'carousel_id' => $pdo->lastInsertId()
        ]);
        
    } catch (Exception $e) {
        error_log("Create carousel error: " . $e->getMessage());
        throw $e;
    }
}

function updateCarousel($pdo) {
    try {
        global $user;
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID é obrigatório']);
            return;
        }
        
        $id = (int)$input['id'];
        $title = trim($input['title'] ?? '');
        $subtitle = trim($input['subtitle'] ?? '');
        $image = trim($input['image'] ?? '');
        $link_url = trim($input['link_url'] ?? '');
        $link_text = trim($input['link_text'] ?? '');
        $position_order = (int)($input['position_order'] ?? 0);
        $is_active = isset($input['is_active']) ? (bool)$input['is_active'] : true;
        
        if (empty($title) || empty($image)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Título e imagem são obrigatórios']);
            return;
        }
        
        $stmt = $pdo->prepare("
            UPDATE carousels 
            SET title = ?, subtitle = ?, image = ?, link_url = ?, link_text = ?, position_order = ?, is_active = ?
            WHERE id = ?
        ");
        
        $stmt->execute([$title, $subtitle, $image, $link_url, $link_text, $position_order, $is_active, $id]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Carousel atualizado com sucesso'
        ]);
        
    } catch (Exception $e) {
        error_log("Update carousel error: " . $e->getMessage());
        throw $e;
    }
}

function deleteCarousel($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID é obrigatório']);
            return;
        }
        
        $id = (int)$input['id'];
        
        $stmt = $pdo->prepare("DELETE FROM carousels WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Carousel removido com sucesso'
        ]);
        
    } catch (Exception $e) {
        error_log("Delete carousel error: " . $e->getMessage());
        throw $e;
    }
}

function getSecurityLogs($pdo) {
    try {
        $limit = min((int)($_GET['limit'] ?? 50), 200);
        $offset = max((int)($_GET['offset'] ?? 0), 0);
        
        $stmt = $pdo->prepare("
            SELECT s.*, u.name as user_name, u.email as user_email
            FROM security_logs s
            LEFT JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$limit, $offset]);
        $logs = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'logs' => $logs
        ]);
        
    } catch (Exception $e) {
        error_log("Get security logs error: " . $e->getMessage());
        throw $e;
    }
}
?>