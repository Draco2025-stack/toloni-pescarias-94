<?php
require_once '../../config/cors_config.php';

require_once '../../config/database.php';
require_once '../../config/security.php';

// Função para notificar webhook de troféus
function notifyTrophyWebhook($action, $reportData) {
    try {
        $webhookUrl = '/api/trophy_webhook.php';
        $postData = json_encode([
            'action' => $action,
            ...$reportData
        ]);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $_SERVER['HTTP_HOST'] . $webhookUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5); // Timeout rápido para não travar
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            error_log("Trophy webhook success: $action");
        } else {
            error_log("Trophy webhook failed: $action (HTTP: $httpCode)");
        }
        
    } catch (Exception $e) {
        error_log("Trophy webhook error: " . $e->getMessage());
    }
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $path = $_GET['path'] ?? '';

    switch ($method) {
        case 'GET':
            if (empty($path)) {
                getReports($pdo);
            } else {
                getReport($pdo, $path);
            }
            break;
            
        case 'POST':
            createReport($pdo);
            break;
            
        case 'PUT':
            updateReport($pdo, $path);
            break;
            
        case 'DELETE':
            deleteReport($pdo, $path);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    }

} catch (Exception $e) {
    error_log("Reports API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}

function getReports($pdo) {
    try {
        $limit = min((int)($_GET['limit'] ?? 20), 50);
        $offset = max((int)($_GET['offset'] ?? 0), 0);
        $location_id = $_GET['location_id'] ?? null;
        $user_id = $_GET['user_id'] ?? null;
        $approved_only = $_GET['approved_only'] ?? '1';
        $public_only = $_GET['public_only'] ?? '1';
        $search = $_GET['search'] ?? '';
        
        $where_conditions = [];
        $params = [];
        
        if ($approved_only === '1') {
            $where_conditions[] = "r.approved = 1";
        }
        
        if ($public_only === '1') {
            $where_conditions[] = "r.is_public = 1";
        }
        
        if ($location_id) {
            $where_conditions[] = "r.location_id = ?";
            $params[] = $location_id;
        }
        
        if ($user_id) {
            $where_conditions[] = "r.user_id = ?";
            $params[] = $user_id;
        }
        
        if (!empty($search)) {
            $where_conditions[] = "MATCH(r.title, r.content) AGAINST(? IN BOOLEAN MODE)";
            $params[] = $search;
        }
        
        $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
        
        $sql = "
            SELECT 
                r.id, r.title, r.content, r.location_id, r.custom_location,
                r.images, r.fish_species, r.fish_weight, r.weather_conditions,
                r.water_conditions, r.bait_used, r.technique_used, r.fishing_date,
                r.fishing_time, r.is_public, r.approved, r.likes_count,
                r.comments_count, r.views_count, r.featured, r.created_at,
                u.name as user_name, u.profile_image as user_avatar,
                l.name as location_name, l.city as location_city, l.state as location_state
            FROM reports r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN locations l ON r.location_id = l.id
            $where_clause
            ORDER BY r.featured DESC, r.created_at DESC
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $reports = $stmt->fetchAll();
        
        // Processar dados
        foreach ($reports as &$report) {
            $report['images'] = json_decode($report['images'] ?? '[]', true);
            $report['is_public'] = (bool)$report['is_public'];
            $report['approved'] = (bool)$report['approved'];
            $report['featured'] = (bool)$report['featured'];
            $report['fish_weight'] = $report['fish_weight'] ? (float)$report['fish_weight'] : null;
        }
        
        // Contar total para paginação
        $count_sql = "SELECT COUNT(*) FROM reports r $where_clause";
        $count_params = array_slice($params, 0, -2); // Remove limit e offset
        $count_stmt = $pdo->prepare($count_sql);
        $count_stmt->execute($count_params);
        $total = $count_stmt->fetchColumn();
        
        echo json_encode([
            'success' => true,
            'reports' => $reports,
            'pagination' => [
                'total' => (int)$total,
                'limit' => $limit,
                'offset' => $offset,
                'has_more' => ($offset + $limit) < $total
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Get reports error: " . $e->getMessage());
        throw $e;
    }
}

function getReport($pdo, $id) {
    try {
        $stmt = $pdo->prepare("
            SELECT 
                r.*, 
                u.name as user_name, u.profile_image as user_avatar,
                l.name as location_name, l.city as location_city, l.state as location_state
            FROM reports r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN locations l ON r.location_id = l.id
            WHERE r.id = ?
        ");
        $stmt->execute([$id]);
        $report = $stmt->fetch();
        
        if (!$report) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Relatório não encontrado']);
            return;
        }
        
        // Processar dados
        $report['images'] = json_decode($report['images'] ?? '[]', true);
        $report['is_public'] = (bool)$report['is_public'];
        $report['approved'] = (bool)$report['approved'];
        $report['featured'] = (bool)$report['featured'];
        $report['fish_weight'] = $report['fish_weight'] ? (float)$report['fish_weight'] : null;
        
        // Incrementar visualizações
        $stmt = $pdo->prepare("UPDATE reports SET views_count = views_count + 1 WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode([
            'success' => true,
            'report' => $report
        ]);
        
    } catch (Exception $e) {
        error_log("Get report error: " . $e->getMessage());
        throw $e;
    }
}

function createReport($pdo) {
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
        $title = trim($input['title'] ?? '');
        $content = trim($input['content'] ?? '');
        
        if (empty($title) || empty($content)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Título e conteúdo são obrigatórios']);
            return;
        }
        
        if (strlen($title) > 200) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Título muito longo']);
            return;
        }
        
        $location_id = !empty($input['location_id']) ? (int)$input['location_id'] : null;
        $custom_location = trim($input['custom_location'] ?? '');
        $images = $input['images'] ?? [];
        $fish_species = trim($input['fish_species'] ?? '');
        $fish_weight = !empty($input['fish_weight']) ? (float)$input['fish_weight'] : null;
        $weather_conditions = trim($input['weather_conditions'] ?? '');
        $water_conditions = trim($input['water_conditions'] ?? '');
        $bait_used = trim($input['bait_used'] ?? '');
        $technique_used = trim($input['technique_used'] ?? '');
        $fishing_date = !empty($input['fishing_date']) ? $input['fishing_date'] : null;
        $fishing_time = !empty($input['fishing_time']) ? $input['fishing_time'] : null;
        $is_public = isset($input['is_public']) ? (bool)$input['is_public'] : true;
        
        // Inserir relatório
        $stmt = $pdo->prepare("
            INSERT INTO reports (
                user_id, title, content, location_id, custom_location, images,
                fish_species, fish_weight, weather_conditions, water_conditions,
                bait_used, technique_used, fishing_date, fishing_time, is_public
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $user['id'], $title, $content, $location_id, $custom_location, 
            json_encode($images), $fish_species, $fish_weight, $weather_conditions,
            $water_conditions, $bait_used, $technique_used, $fishing_date, 
            $fishing_time, $is_public
        ]);
        
        $report_id = $pdo->lastInsertId();
        
        // Log de segurança
        logSecurityEvent($pdo, $user['id'], 'REPORT_CREATED', "Report ID: $report_id");
        
        // Notificar webhook de troféus (assíncrono)
        if ($fish_species && $is_public) {
            notifyTrophyWebhook('report_created', [
                'report_id' => $report_id,
                'fish_species' => $fish_species,
                'location' => $custom_location ?: ($location_id ? "location_$location_id" : ''),
                'images' => $images,
                'fish_weight' => $fish_weight,
                'is_public' => $is_public,
                'approved' => true // Novos relatos são aprovados por padrão
            ]);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Relatório criado com sucesso',
            'report_id' => $report_id
        ]);
        
    } catch (Exception $e) {
        error_log("Create report error: " . $e->getMessage());
        throw $e;
    }
}

function updateReport($pdo, $id) {
    try {
        // Validar autenticação
        $user = validateSession($pdo);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Usuário não autenticado']);
            return;
        }
        
        // Verificar se o relatório existe e pertence ao usuário
        $stmt = $pdo->prepare("SELECT user_id FROM reports WHERE id = ?");
        $stmt->execute([$id]);
        $report = $stmt->fetch();
        
        if (!$report) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Relatório não encontrado']);
            return;
        }
        
        if ($report['user_id'] !== $user['id'] && !$user['is_admin']) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Sem permissão para editar este relatório']);
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
        
        if (isset($input['title'])) {
            $title = trim($input['title']);
            if (empty($title) || strlen($title) > 200) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Título inválido']);
                return;
            }
            $updates[] = "title = ?";
            $params[] = $title;
        }
        
        if (isset($input['content'])) {
            $content = trim($input['content']);
            if (empty($content)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Conteúdo é obrigatório']);
                return;
            }
            $updates[] = "content = ?";
            $params[] = $content;
        }
        
        if (isset($input['is_public'])) {
            $updates[] = "is_public = ?";
            $params[] = (bool)$input['is_public'];
        }
        
        // Campos adicionais para admins
        if ($user['is_admin']) {
            if (isset($input['approved'])) {
                $updates[] = "approved = ?";
                $params[] = (bool)$input['approved'];
                
                if ($input['approved']) {
                    $updates[] = "approved_by = ?";
                    $params[] = $user['id'];
                    $updates[] = "approval_date = CURRENT_TIMESTAMP";
                }
            }
            
            if (isset($input['featured'])) {
                $updates[] = "featured = ?";
                $params[] = (bool)$input['featured'];
            }
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Nenhum campo para atualizar']);
            return;
        }
        
        $updates[] = "updated_at = CURRENT_TIMESTAMP";
        $params[] = $id;
        
        $sql = "UPDATE reports SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        // Log de segurança
        logSecurityEvent($pdo, $user['id'], 'REPORT_UPDATED', "Report ID: $id");
        
        // Buscar dados atualizados do relatório para webhook
        $stmt = $pdo->prepare("
            SELECT fish_species, custom_location, location_id, images, fish_weight, is_public, approved
            FROM reports WHERE id = ?
        ");
        $stmt->execute([$id]);
        $reportData = $stmt->fetch();
        
        // Notificar webhook de troféus (assíncrono)
        if ($reportData && $reportData['fish_species'] && $reportData['is_public']) {
            notifyTrophyWebhook('report_updated', [
                'report_id' => $id,
                'fish_species' => $reportData['fish_species'],
                'location' => $reportData['custom_location'] ?: ($reportData['location_id'] ? "location_{$reportData['location_id']}" : ''),
                'images' => json_decode($reportData['images'] ?? '[]', true),
                'fish_weight' => $reportData['fish_weight'],
                'is_public' => (bool)$reportData['is_public'],
                'approved' => (bool)$reportData['approved']
            ]);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Relatório atualizado com sucesso'
        ]);
        
    } catch (Exception $e) {
        error_log("Update report error: " . $e->getMessage());
        throw $e;
    }
}

function deleteReport($pdo, $id) {
    try {
        // Validar autenticação
        $user = validateSession($pdo);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Usuário não autenticado']);
            return;
        }
        
        // Verificar se o relatório existe e pertence ao usuário
        $stmt = $pdo->prepare("SELECT user_id FROM reports WHERE id = ?");
        $stmt->execute([$id]);
        $report = $stmt->fetch();
        
        if (!$report) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Relatório não encontrado']);
            return;
        }
        
        if ($report['user_id'] !== $user['id'] && !$user['is_admin']) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Sem permissão para excluir este relatório']);
            return;
        }
        
        // Excluir relatório
        $stmt = $pdo->prepare("DELETE FROM reports WHERE id = ?");
        $stmt->execute([$id]);
        
        // Notificar webhook de troféus antes de deletar
        notifyTrophyWebhook('report_deleted', [
            'report_id' => $id
        ]);
        
        // Log de segurança
        logSecurityEvent($pdo, $user['id'], 'REPORT_DELETED', "Report ID: $id");
        
        echo json_encode([
            'success' => true,
            'message' => 'Relatório excluído com sucesso'
        ]);
        
    } catch (Exception $e) {
        error_log("Delete report error: " . $e->getMessage());
        throw $e;
    }
}
?>