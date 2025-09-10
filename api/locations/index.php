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
    $method = $_SERVER['REQUEST_METHOD'];
    $path = $_GET['path'] ?? '';

    switch ($method) {
        case 'GET':
            if (empty($path)) {
                getLocations($pdo);
            } else {
                getLocation($pdo, $path);
            }
            break;
            
        case 'POST':
            createLocation($pdo);
            break;
            
        case 'PUT':
            updateLocation($pdo, $path);
            break;
            
        case 'DELETE':
            deleteLocation($pdo, $path);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    }

} catch (Exception $e) {
    error_log("Locations API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}

function getLocations($pdo) {
    try {
        $limit = min((int)($_GET['limit'] ?? 20), 50);
        $offset = max((int)($_GET['offset'] ?? 0), 0);
        $approved_only = $_GET['approved_only'] ?? '1';
        $featured_only = $_GET['featured_only'] ?? '0';
        $search = $_GET['search'] ?? '';
        $city = $_GET['city'] ?? '';
        $state = $_GET['state'] ?? '';
        
        $where_conditions = [];
        $params = [];
        
        if ($approved_only === '1') {
            $where_conditions[] = "is_approved = 1";
        }
        
        if ($featured_only === '1') {
            $where_conditions[] = "is_featured = 1";
        }
        
        if (!empty($search)) {
            $where_conditions[] = "(name LIKE ? OR description LIKE ? OR city LIKE ?)";
            $searchTerm = "%$search%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        if (!empty($city)) {
            $where_conditions[] = "city LIKE ?";
            $params[] = "%$city%";
        }
        
        if (!empty($state)) {
            $where_conditions[] = "state = ?";
            $params[] = $state;
        }
        
        $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
        
        $sql = "
            SELECT 
                l.*,
                u.name as suggested_by_name,
                (SELECT COUNT(*) FROM reports WHERE location_id = l.id AND approved = 1) as reports_count
            FROM locations l
            LEFT JOIN users u ON l.suggested_by = u.id
            $where_clause
            ORDER BY l.is_featured DESC, l.name ASC
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $locations = $stmt->fetchAll();
        
        // Processar dados
        foreach ($locations as &$location) {
            $location['images'] = json_decode($location['images'] ?? '[]', true);
            $location['fish_species'] = json_decode($location['fish_species'] ?? '[]', true);
            $location['facilities'] = json_decode($location['facilities'] ?? '[]', true);
            $location['is_approved'] = (bool)$location['is_approved'];
            $location['is_featured'] = (bool)$location['is_featured'];
            $location['latitude'] = $location['latitude'] ? (float)$location['latitude'] : null;
            $location['longitude'] = $location['longitude'] ? (float)$location['longitude'] : null;
            $location['reports_count'] = (int)$location['reports_count'];
        }
        
        // Contar total para paginação
        $count_sql = "SELECT COUNT(*) FROM locations l $where_clause";
        $count_params = array_slice($params, 0, -2); // Remove limit e offset
        $count_stmt = $pdo->prepare($count_sql);
        $count_stmt->execute($count_params);
        $total = $count_stmt->fetchColumn();
        
        echo json_encode([
            'success' => true,
            'locations' => $locations,
            'pagination' => [
                'total' => (int)$total,
                'limit' => $limit,
                'offset' => $offset,
                'has_more' => ($offset + $limit) < $total
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Get locations error: " . $e->getMessage());
        throw $e;
    }
}

function getLocation($pdo, $id) {
    try {
        $stmt = $pdo->prepare("
            SELECT 
                l.*,
                u.name as suggested_by_name,
                a.name as approved_by_name,
                (SELECT COUNT(*) FROM reports WHERE location_id = l.id AND approved = 1) as reports_count
            FROM locations l
            LEFT JOIN users u ON l.suggested_by = u.id
            LEFT JOIN users a ON l.approved_by = a.id
            WHERE l.id = ?
        ");
        $stmt->execute([$id]);
        $location = $stmt->fetch();
        
        if (!$location) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Localização não encontrada']);
            return;
        }
        
        // Processar dados
        $location['images'] = json_decode($location['images'] ?? '[]', true);
        $location['fish_species'] = json_decode($location['fish_species'] ?? '[]', true);
        $location['facilities'] = json_decode($location['facilities'] ?? '[]', true);
        $location['is_approved'] = (bool)$location['is_approved'];
        $location['is_featured'] = (bool)$location['is_featured'];
        $location['latitude'] = $location['latitude'] ? (float)$location['latitude'] : null;
        $location['longitude'] = $location['longitude'] ? (float)$location['longitude'] : null;
        $location['reports_count'] = (int)$location['reports_count'];
        
        echo json_encode([
            'success' => true,
            'location' => $location
        ]);
        
    } catch (Exception $e) {
        error_log("Get location error: " . $e->getMessage());
        throw $e;
    }
}

function createLocation($pdo) {
    try {
        // Validar autenticação
        $user = validateSession($pdo);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Usuário não autenticado']);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
            return;
        }
        
        // Validações
        $name = trim($input['name'] ?? '');
        $description = trim($input['description'] ?? '');
        $city = trim($input['city'] ?? '');
        $state = trim($input['state'] ?? '');
        
        if (empty($name) || empty($city) || empty($state)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Nome, cidade e estado são obrigatórios']);
            return;
        }
        
        if (strlen($name) > 150) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Nome muito longo']);
            return;
        }
        
        $latitude = !empty($input['latitude']) ? (float)$input['latitude'] : null;
        $longitude = !empty($input['longitude']) ? (float)$input['longitude'] : null;
        $address = trim($input['address'] ?? '');
        $country = trim($input['country'] ?? 'Brasil');
        $featured_image = trim($input['featured_image'] ?? '');
        $images = $input['images'] ?? [];
        $fish_species = $input['fish_species'] ?? [];
        $facilities = $input['facilities'] ?? [];
        $difficulty_level = $input['difficulty_level'] ?? 'moderado';
        $access_type = $input['access_type'] ?? 'publico';
        
        // Validar enums
        $allowed_difficulty = ['facil', 'moderado', 'dificil'];
        if (!in_array($difficulty_level, $allowed_difficulty)) {
            $difficulty_level = 'moderado';
        }
        
        $allowed_access = ['publico', 'privado', 'clube'];
        if (!in_array($access_type, $allowed_access)) {
            $access_type = 'publico';
        }
        
        // Determinar se deve ser aprovado automaticamente (admins)
        $is_approved = $user['is_admin'] ? 1 : 0;
        $approved_by = $user['is_admin'] ? $user['id'] : null;
        
        // Inserir localização
        $stmt = $pdo->prepare("
            INSERT INTO locations (
                name, description, latitude, longitude, address, city, state, country,
                featured_image, images, fish_species, facilities, difficulty_level,
                access_type, is_approved, suggested_by, approved_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $name, $description, $latitude, $longitude, $address, $city, $state, $country,
            $featured_image, json_encode($images), json_encode($fish_species), 
            json_encode($facilities), $difficulty_level, $access_type, $is_approved, 
            $user['id'], $approved_by
        ]);
        
        $location_id = $pdo->lastInsertId();
        
        // Log de segurança
        logSecurityEvent($pdo, $user['id'], 'LOCATION_CREATED', "Location ID: $location_id");
        
        $message = $is_approved ? 'Localização criada e aprovada com sucesso' : 'Localização sugerida com sucesso e será avaliada pelos administradores';
        
        echo json_encode([
            'success' => true,
            'message' => $message,
            'location_id' => $location_id,
            'is_approved' => $is_approved
        ]);
        
    } catch (Exception $e) {
        error_log("Create location error: " . $e->getMessage());
        throw $e;
    }
}

function updateLocation($pdo, $id) {
    try {
        // Validar autenticação
        $user = validateSession($pdo);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Usuário não autenticado']);
            return;
        }
        
        // Verificar se a localização existe
        $stmt = $pdo->prepare("SELECT suggested_by FROM locations WHERE id = ?");
        $stmt->execute([$id]);
        $location = $stmt->fetch();
        
        if (!$location) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Localização não encontrada']);
            return;
        }
        
        // Verificar permissões
        if ($location['suggested_by'] !== $user['id'] && !$user['is_admin']) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Sem permissão para editar esta localização']);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
            return;
        }
        
        // Atualizar campos permitidos
        $updates = [];
        $params = [];
        
        if (isset($input['name'])) {
            $name = trim($input['name']);
            if (empty($name) || strlen($name) > 150) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Nome inválido']);
                return;
            }
            $updates[] = "name = ?";
            $params[] = $name;
        }
        
        if (isset($input['description'])) {
            $updates[] = "description = ?";
            $params[] = trim($input['description']);
        }
        
        // Campos específicos para admins
        if ($user['is_admin']) {
            if (isset($input['is_approved'])) {
                $updates[] = "is_approved = ?";
                $params[] = (bool)$input['is_approved'];
                
                if ($input['is_approved']) {
                    $updates[] = "approved_by = ?";
                    $params[] = $user['id'];
                }
            }
            
            if (isset($input['is_featured'])) {
                $updates[] = "is_featured = ?";
                $params[] = (bool)$input['is_featured'];
            }
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Nenhum campo para atualizar']);
            return;
        }
        
        $updates[] = "updated_at = CURRENT_TIMESTAMP";
        $params[] = $id;
        
        $sql = "UPDATE locations SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        // Log de segurança
        logSecurityEvent($pdo, $user['id'], 'LOCATION_UPDATED', "Location ID: $id");
        
        echo json_encode([
            'success' => true,
            'message' => 'Localização atualizada com sucesso'
        ]);
        
    } catch (Exception $e) {
        error_log("Update location error: " . $e->getMessage());
        throw $e;
    }
}

function deleteLocation($pdo, $id) {
    try {
        // Validar autenticação (apenas admins podem excluir)
        $user = validateSession($pdo);
        if (!$user || !$user['is_admin']) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Sem permissão para excluir localizações']);
            return;
        }
        
        // Verificar se existem relatórios vinculados
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM reports WHERE location_id = ?");
        $stmt->execute([$id]);
        $reports_count = $stmt->fetchColumn();
        
        if ($reports_count > 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Não é possível excluir localização com relatórios vinculados']);
            return;
        }
        
        // Excluir localização
        $stmt = $pdo->prepare("DELETE FROM locations WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Localização não encontrada']);
            return;
        }
        
        // Log de segurança
        logSecurityEvent($pdo, $user['id'], 'LOCATION_DELETED', "Location ID: $id");
        
        echo json_encode([
            'success' => true,
            'message' => 'Localização excluída com sucesso'
        ]);
        
    } catch (Exception $e) {
        error_log("Delete location error: " . $e->getMessage());
        throw $e;
    }
}
?>