<?php
require_once '../../config/database_hostinger.php';
require_once '../../config/cors_unified.php';
require_once '../../config/session_cookies.php';
require_once '../includes/middleware.php';

// Set content type to JSON
header('Content-Type: application/json');

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verificar se é admin
$user = validateSession($pdo);
if (!$user || $user['role'] !== 'admin') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Acesso negado']);
    exit;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';
    
    switch ($method) {
        case 'GET':
            if ($action === 'current') {
                getCurrentMonthTrophies();
            } elseif ($action === 'archive') {
                getArchivedTrophies();
            } elseif ($action === 'logs') {
                getTrophyLogs();
            } else {
                getCurrentMonthTrophies();
            }
            break;
        case 'POST':
            if ($action === 'update-ranking') {
                manualUpdateRanking();
            } elseif ($action === 'reset-monthly') {
                resetMonthlyTrophies();
            } else {
                throw new Exception('Ação não reconhecida');
            }
            break;
        default:
            throw new Exception('Método não permitido');
    }
    
} catch (Exception $e) {
    error_log("Admin trophies error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro interno do servidor: ' . $e->getMessage()
    ]);
}

function getCurrentMonthTrophies() {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT 
            t.*,
            r.title as report_title
        FROM trophies t
        LEFT JOIN reports r ON t.report_id = r.id
        WHERE t.active = 1
        ORDER BY t.position ASC, t.created_at DESC
    ");
    
    $stmt->execute();
    $trophies = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'trophies' => $trophies,
        'count' => count($trophies)
    ]);
}

function getArchivedTrophies() {
    global $pdo;
    
    $month = $_GET['month'] ?? date('Y-m');
    
    $stmt = $pdo->prepare("
        SELECT * FROM trophies_archive 
        WHERE month_year = ?
        ORDER BY position ASC
    ");
    
    $stmt->execute([$month]);
    $trophies = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'trophies' => $trophies,
        'month' => $month,
        'count' => count($trophies)
    ]);
}

function manualUpdateRanking() {
    global $pdo, $user;
    
    try {
        $updated_count = updateTrophyRanking($pdo);
        
        // Log da ação
        logTrophyAction('manual_update', $user['id'], [
            'updated_entries' => $updated_count,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Ranking atualizado manualmente com sucesso',
            'updated_entries' => $updated_count
        ]);
        
    } catch (Exception $e) {
        error_log("Manual ranking update error: " . $e->getMessage());
        throw $e;
    }
}

function resetMonthlyTrophies() {
    global $pdo, $user;
    
    try {
        $pdo->beginTransaction();
        
        // Arquivar troféus do mês atual
        $currentMonth = date('Y-m');
        $stmt = $pdo->prepare("
            INSERT INTO trophies_archive (month_year, fisherman_name, fish_type, location, image_url, weight, date, position, report_id)
            SELECT ?, fisherman_name, fish_type, location, image_url, weight, date, position, report_id
            FROM trophies 
            WHERE active = 1
        ");
        $stmt->execute([$currentMonth]);
        $archived_count = $stmt->rowCount();
        
        // Limpar troféus atuais
        $pdo->prepare("DELETE FROM trophies WHERE active = 1")->execute();
        
        // Gerar novo ranking
        $new_count = updateTrophyRanking($pdo);
        
        $pdo->commit();
        
        // Log da ação
        logTrophyAction('monthly_reset', $user['id'], [
            'archived_count' => $archived_count,
            'new_count' => $new_count,
            'month' => $currentMonth
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Reset mensal executado com sucesso',
            'archived_count' => $archived_count,
            'new_count' => $new_count
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Monthly reset error: " . $e->getMessage());
        throw $e;
    }
}

function updateTrophyRanking($pdo) {
    // Buscar os melhores relatos do mês atual
    $stmt = $pdo->prepare("
        SELECT 
            r.id as report_id,
            u.name as fisherman_name,
            r.fish_species as fish_type,
            r.location,
            r.images,
            r.fish_weight as weight,
            r.created_at as date,
            COALESCE(likes.likes_count, 0) as likes_count
        FROM reports r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN (
            SELECT report_id, COUNT(*) as likes_count
            FROM report_likes 
            GROUP BY report_id
        ) likes ON r.id = likes.report_id
        WHERE 
            r.is_public = 1 
            AND r.approved = 1
            AND r.fish_species IS NOT NULL 
            AND r.fish_species != ''
            AND r.location IS NOT NULL 
            AND r.location != ''
            AND r.images IS NOT NULL 
            AND r.images != ''
            AND r.images != '[]'
            AND MONTH(r.created_at) = MONTH(CURRENT_DATE())
            AND YEAR(r.created_at) = YEAR(CURRENT_DATE())
        ORDER BY 
            CAST(NULLIF(REGEXP_REPLACE(r.fish_weight, '[^0-9.]', ''), '') AS DECIMAL(10,2)) DESC,
            likes_count DESC,
            r.created_at ASC
        LIMIT 10
    ");
    
    $stmt->execute();
    $top_reports = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Limpar ranking atual
    $pdo->prepare("DELETE FROM trophies WHERE active = 1")->execute();
    
    // Inserir novos troféus
    $position = 1;
    foreach ($top_reports as $report) {
        $images = json_decode($report['images'], true);
        $image_url = is_array($images) && count($images) > 0 ? $images[0] : '';
        
        $stmt = $pdo->prepare("
            INSERT INTO trophies (fisherman_name, fish_type, location, image_url, weight, date, position, report_id, active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        ");
        
        $stmt->execute([
            $report['fisherman_name'],
            $report['fish_type'],
            $report['location'],
            $image_url,
            $report['weight'],
            $report['date'],
            $position,
            $report['report_id']
        ]);
        
        $position++;
    }
    
    return count($top_reports);
}

function getTrophyLogs() {
    global $pdo;
    
    $limit = min((int)($_GET['limit'] ?? 50), 200);
    $offset = (int)($_GET['offset'] ?? 0);
    
    $stmt = $pdo->prepare("
        SELECT 
            l.*,
            u.name as user_name
        FROM trophy_logs l
        LEFT JOIN users u ON l.user_id = u.id
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
    ");
    
    $stmt->execute([$limit, $offset]);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'logs' => $logs
    ]);
}

function logTrophyAction($action, $userId, $data = []) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO trophy_logs (action, user_id, data, created_at)
            VALUES (?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $action,
            $userId,
            json_encode($data)
        ]);
        
    } catch (Exception $e) {
        error_log("Trophy log error: " . $e->getMessage());
    }
}
?>