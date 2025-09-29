<?php
/**
 * API de Localizações - Toloni Pescarias
 * Segue padrão do prompt-mestre
 */

// Incluir configurações unificadas
require_once '../../config/database_hostinger.php';
require_once '../../config/cors_unified.php';
require_once '../../config/session_cookies.php';
require_once '../../config/roles_system.php';
require_once '../../lib/security_audit.php';

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
        
        // Padronizar paginação
        $page = max(1, (int)($_GET['page'] ?? 1));
        $currentOffset = ($page - 1) * $limit;
        $hasNext = ($currentOffset + $limit) < $total;
        
        sendJsonResponse(true, [
            'locations' => $locations,
            'page' => $page,
            'limit' => $limit,
            'total' => (int)$total,
            'hasNext' => $hasNext
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
        // Validar autenticação com novo sistema de roles
        $user = requireRole($pdo, 'USER', 'create_location');
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            json_error('Dados inválidos', 400);
        }
        
        // Validações com InputValidator
        $name = InputValidator::validateString($input['name'] ?? '', 150, true);
        $description = InputValidator::validateString($input['description'] ?? '', 2000, false);
        $city = InputValidator::validateString($input['city'] ?? '', 100, true);
        $state = InputValidator::validateString($input['state'] ?? '', 50, true);
        
        if (!$name || !$city || !$state) {
            json_error('Nome, cidade e estado são obrigatórios', 400);
        }
        
        $latitude = !empty($input['latitude']) ? InputValidator::validateFloat($input['latitude']) : null;
        $longitude = !empty($input['longitude']) ? InputValidator::validateFloat($input['longitude']) : null;
        $address = InputValidator::validateString($input['address'] ?? '', 255, false);
        $country = InputValidator::validateString($input['country'] ?? 'Brasil', 100, false) ?: 'Brasil';
        $featured_image = InputValidator::validateString($input['featured_image'] ?? '', 255, false);
        $images = InputValidator::validateArray($input['images'] ?? [], 10);
        $fish_species = InputValidator::validateArray($input['fish_species'] ?? [], 20);
        $facilities = InputValidator::validateArray($input['facilities'] ?? [], 15);
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
        
        // Determinar se deve ser aprovado automaticamente
        $is_approved = hasRole($user, 'EDITOR') ? 1 : 0;
        $approved_by = $is_approved ? $user['id'] : null;
        
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
        logSecurityAction($pdo, $user, 'LOCATION_CREATED', 
            ['type' => 'location', 'id' => $location_id], 
            ['auto_approved' => $is_approved, 'city' => $city, 'state' => $state]
        );
        
        $message = $is_approved ? 'Localização criada e aprovada com sucesso' : 'Localização sugerida com sucesso e será avaliada pelos administradores';
        
        json_ok([
            'message' => $message,
            'location_id' => $location_id,
            'is_approved' => $is_approved
        ], 201);
        
    } catch (Exception $e) {
        error_log("Create location error: " . $e->getMessage());
        throw $e;
    }
}

function updateLocation($pdo, $id) {
    try {
        // Verificar ownership ou role de editor
        $user = requireOwnershipOrRole($pdo, 'location', $id, 'EDITOR', 'update_location');
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            json_error('Dados inválidos', 400);
        }
        
        // Atualizar campos permitidos
        $updates = [];
        $params = [];
        
        if (isset($input['name'])) {
            $name = InputValidator::validateString($input['name'], 150, true);
            if (!$name) {
                json_error('Nome inválido', 400);
            }
            $updates[] = "name = ?";
            $params[] = $name;
        }
        
        if (isset($input['description'])) {
            $description = InputValidator::validateString($input['description'], 2000, false);
            $updates[] = "description = ?";
            $params[] = $description;
        }
        
        // Campos específicos para editores/admins
        if (hasRole($user, 'EDITOR')) {
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
            json_error('Nenhum campo para atualizar', 400);
        }
        
        $updates[] = "updated_at = CURRENT_TIMESTAMP";
        $params[] = $id;
        
        $sql = "UPDATE locations SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        // Log de segurança
        logSecurityAction($pdo, $user, 'LOCATION_UPDATED', 
            ['type' => 'location', 'id' => $id], 
            ['fields_updated' => array_keys($input)]
        );
        
        json_ok(['message' => 'Localização atualizada com sucesso']);
        
    } catch (Exception $e) {
        error_log("Update location error: " . $e->getMessage());
        throw $e;
    }
}

function deleteLocation($pdo, $id) {
    try {
        // Apenas editores e admins podem excluir
        $user = requireRole($pdo, 'EDITOR', 'delete_location');
        
        // Verificar se existem relatórios vinculados
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM reports WHERE location_id = ?");
        $stmt->execute([$id]);
        $reports_count = $stmt->fetchColumn();
        
        if ($reports_count > 0) {
            json_error('Não é possível excluir localização com relatórios vinculados', 400);
        }
        
        // Excluir localização
        $stmt = $pdo->prepare("DELETE FROM locations WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() === 0) {
            json_error('Localização não encontrada', 404);
        }
        
        // Log de segurança
        logSecurityAction($pdo, $user, 'LOCATION_DELETED', 
            ['type' => 'location', 'id' => $id], 
            ['reports_count' => $reports_count]
        );
        
        json_ok(['message' => 'Localização excluída com sucesso']);
        
    } catch (Exception $e) {
        error_log("Delete location error: " . $e->getMessage());
        throw $e;
    }
}
?>