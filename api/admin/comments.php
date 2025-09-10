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

    switch ($method) {
        case 'GET':
            getComments($pdo);
            break;
        case 'DELETE':
            deleteComment($pdo);
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    }

} catch (Exception $e) {
    error_log("Admin Comments API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}

function getComments($pdo) {
    try {
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = max((int)($_GET['offset'] ?? 0), 0);
        $search = $_GET['search'] ?? '';
        
        $where_clause = '';
        $params = [];
        
        if (!empty($search)) {
            $where_clause = "WHERE c.content LIKE ? OR u.name LIKE ? OR r.title LIKE ?";
            $searchTerm = "%$search%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                c.id, c.content, c.created_at, c.is_approved,
                u.name as user_name, u.email as user_email,
                r.title as report_title, r.id as report_id,
                CASE WHEN c.is_approved = 0 THEN 1 ELSE 0 END as is_reported
            FROM comments c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN reports r ON c.report_id = r.id
            $where_clause
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?
        ");
        
        $params[] = $limit;
        $params[] = $offset;
        $stmt->execute($params);
        $comments = $stmt->fetchAll();
        
        // Formatar dados para o frontend
        foreach ($comments as &$comment) {
            $comment['is_reported'] = (bool)$comment['is_reported'];
        }
        
        echo json_encode([
            'success' => true,
            'comments' => $comments
        ]);
        
    } catch (Exception $e) {
        error_log("Get comments error: " . $e->getMessage());
        throw $e;
    }
}

function deleteComment($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['action']) || $input['action'] !== 'delete_comment') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ação inválida']);
            return;
        }
        
        $comment_id = (int)$input['comment_id'];
        
        $stmt = $pdo->prepare("DELETE FROM comments WHERE id = ?");
        $stmt->execute([$comment_id]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Comentário deletado com sucesso'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Comentário não encontrado'
            ]);
        }
        
    } catch (Exception $e) {
        error_log("Delete comment error: " . $e->getMessage());
        throw $e;
    }
}
?>