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
            getLocations($pdo);
            break;
        case 'POST':
            updateLocationStatus($pdo);
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    }

} catch (Exception $e) {
    error_log("Admin Locations API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}

function getLocations($pdo) {
    try {
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = max((int)($_GET['offset'] ?? 0), 0);
        $search = $_GET['search'] ?? '';
        
        $where_clause = '';
        $params = [];
        
        if (!empty($search)) {
            $where_clause = "WHERE l.name LIKE ? OR l.description LIKE ? OR u.name LIKE ?";
            $searchTerm = "%$search%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                l.id, l.name, l.description, l.latitude, l.longitude,
                l.city, l.state, l.fishing_type, l.fish_species,
                l.is_approved, l.featured, l.created_at,
                u.name as suggested_by, u.email as suggested_by_email
            FROM locations l
            LEFT JOIN users u ON l.suggested_by = u.id
            $where_clause
            GROUP BY l.id
            ORDER BY l.created_at DESC
            LIMIT ? OFFSET ?
        ");
        
        $params[] = $limit;
        $params[] = $offset;
        $stmt->execute($params);
        $locations = $stmt->fetchAll();
        
        // Formatar dados para o frontend
        foreach ($locations as &$location) {
            $location['approved'] = (bool)$location['is_approved'];
            $location['featured'] = (bool)$location['featured'];
            // Converter string de espécies para array se necessário
            if ($location['fish_species']) {
                $location['fish_species'] = explode(',', $location['fish_species']);
            } else {
                $location['fish_species'] = [];
            }
        }
        
        echo json_encode([
            'success' => true,
            'locations' => $locations
        ]);
        
    } catch (Exception $e) {
        error_log("Get locations error: " . $e->getMessage());
        throw $e;
    }
}

function updateLocationStatus($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['action'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ação não especificada']);
            return;
        }

        switch ($input['action']) {
            case 'update_location_status':
                $location_id = (int)$input['location_id'];
                $approved = (bool)$input['approved'];
                $featured = isset($input['featured']) ? (bool)$input['featured'] : false;
                
                $stmt = $pdo->prepare("UPDATE locations SET is_approved = ?, featured = ? WHERE id = ?");
                $stmt->execute([$approved, $featured, $location_id]);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Status da localização atualizado com sucesso'
                ]);
                break;
                
            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Ação inválida']);
        }
        
    } catch (Exception $e) {
        error_log("Update location status error: " . $e->getMessage());
        throw $e;
    }
}
?>