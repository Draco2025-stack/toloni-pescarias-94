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
            getReports($pdo);
            break;
        case 'POST':
            updateReportStatus($pdo);
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    }

} catch (Exception $e) {
    error_log("Admin Reports API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}

function getReports($pdo) {
    try {
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = max((int)($_GET['offset'] ?? 0), 0);
        $search = $_GET['search'] ?? '';
        
        $where_clause = '';
        $params = [];
        
        if (!empty($search)) {
            $where_clause = "WHERE r.title LIKE ? OR u.name LIKE ? OR l.name LIKE ?";
            $searchTerm = "%$search%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                r.id, r.title, r.description, r.species, r.weight, r.length,
                r.bait_used, r.technique_used, r.weather_conditions, 
                r.is_public, r.approved, r.featured, r.created_at,
                u.name as user_name, u.email as user_email,
                l.name as location_name,
                COUNT(DISTINCT c.id) as comments_count,
                COUNT(DISTINCT rl.id) as likes_count
            FROM reports r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN locations l ON r.location_id = l.id
            LEFT JOIN comments c ON r.id = c.report_id
            LEFT JOIN report_likes rl ON r.id = rl.report_id
            $where_clause
            GROUP BY r.id
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        ");
        
        $params[] = $limit;
        $params[] = $offset;
        $stmt->execute($params);
        $reports = $stmt->fetchAll();
        
        // Formatar dados para o frontend
        foreach ($reports as &$report) {
            $report['is_public'] = (bool)$report['is_public'];
            $report['approved'] = (bool)$report['approved'];
            $report['featured'] = (bool)$report['featured'];
            $report['comments_count'] = (int)$report['comments_count'];
            $report['likes_count'] = (int)$report['likes_count'];
        }
        
        echo json_encode([
            'success' => true,
            'reports' => $reports
        ]);
        
    } catch (Exception $e) {
        error_log("Get reports error: " . $e->getMessage());
        throw $e;
    }
}

function updateReportStatus($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['action'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ação não especificada']);
            return;
        }

        switch ($input['action']) {
            case 'update_report_status':
                $report_id = (int)$input['report_id'];
                $approved = (bool)$input['approved'];
                $featured = isset($input['featured']) ? (bool)$input['featured'] : false;
                
                $stmt = $pdo->prepare("UPDATE reports SET approved = ?, featured = ? WHERE id = ?");
                $stmt->execute([$approved, $featured, $report_id]);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Status do relatório atualizado com sucesso'
                ]);
                break;
                
            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Ação inválida']);
        }
        
    } catch (Exception $e) {
        error_log("Update report status error: " . $e->getMessage());
        throw $e;
    }
}
?>