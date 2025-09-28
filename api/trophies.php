<?php
require_once '../config/database_hostinger.php';
require_once '../config/cors_unified.php';
require_once '../config/session_cookies.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'getCurrentMonth':
            getCurrentMonthTrophies();
            break;
        case 'updateRanking':
            updateTrophyRanking();
            break;
        case 'getByMonth':
            getTrophiesByMonth();
            break;
        case 'autoUpdate':
            autoUpdateFromReports();
            break;
        default:
            throw new Exception('Ação não encontrada');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro: ' . $e->getMessage()
    ]);
}

function getCurrentMonthTrophies() {
    global $pdo;
    
    $currentMonth = date('Y-m');
    
    $sql = "
        SELECT 
            t.id,
            t.fisherman_name,
            t.fish_type,
            t.location,
            t.image_url,
            t.weight,
            t.date,
            t.position,
            t.report_id
        FROM trophies t
        WHERE DATE_FORMAT(t.date, '%Y-%m') = :currentMonth 
        AND t.active = 1
        ORDER BY t.position ASC
        LIMIT 10
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':currentMonth', $currentMonth);
    $stmt->execute();
    
    $trophies = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'trophies' => $trophies
    ]);
}

function updateTrophyRanking() {
    global $pdo;
    
    $currentMonth = date('Y-m');
    
    // Buscar todos os relatos do mês atual que atendem aos critérios do ranking
    $sql = "
        SELECT 
            r.id as report_id,
            u.name as fisherman_name,
            r.fish_species as fish_type,
            COALESCE(l.name, r.location_id) as location,
            r.images,
            r.fish_weight as weight,
            r.created_at as date,
            r.likes_count,
            CASE 
                WHEN r.fish_weight IS NOT NULL AND r.fish_weight != '' THEN 
                    CAST(REPLACE(REPLACE(r.fish_weight, 'kg', ''), ',', '.') AS DECIMAL(10,2))
                ELSE 0 
            END as weight_numeric
        FROM reports r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN locations l ON r.location_id = l.id
        WHERE DATE_FORMAT(r.created_at, '%Y-%m') = :currentMonth
        AND r.fish_species IS NOT NULL 
        AND r.fish_species != ''
        AND (r.location_id IS NOT NULL OR l.name IS NOT NULL)
        AND JSON_LENGTH(r.images) > 0
        AND r.is_public = 1
        AND r.approved = 1
        ORDER BY 
            weight_numeric DESC,
            r.likes_count DESC,
            r.created_at ASC
        LIMIT 10
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':currentMonth', $currentMonth);
    $stmt->execute();
    
    $eligibleReports = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Limpar ranking atual do mês
    $deleteSql = "DELETE FROM trophies WHERE DATE_FORMAT(date, '%Y-%m') = :currentMonth";
    $deleteStmt = $pdo->prepare($deleteSql);
    $deleteStmt->bindParam(':currentMonth', $currentMonth);
    $deleteStmt->execute();
    
    // Inserir novo ranking
    $position = 1;
    foreach ($eligibleReports as $report) {
        $images = json_decode($report['images'], true);
        $imageUrl = !empty($images) ? $images[0] : '';
        
        $insertSql = "
            INSERT INTO trophies (
                fisherman_name, fish_type, location, image_url, 
                weight, date, position, report_id, active, created_at
            ) VALUES (
                :fisherman_name, :fish_type, :location, :image_url,
                :weight, :date, :position, :report_id, 1, NOW()
            )
        ";
        
        $insertStmt = $pdo->prepare($insertSql);
        $insertStmt->execute([
            ':fisherman_name' => $report['fisherman_name'],
            ':fish_type' => $report['fish_type'],
            ':location' => $report['location'],
            ':image_url' => $imageUrl,
            ':weight' => $report['weight'],
            ':date' => $report['date'],
            ':position' => $position,
            ':report_id' => $report['report_id']
        ]);
        
        $position++;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Ranking atualizado com sucesso',
        'updated_entries' => count($eligibleReports)
    ]);
}

function getTrophiesByMonth() {
    global $pdo;
    
    $month = $_GET['month'] ?? '';
    if (empty($month)) {
        throw new Exception('Mês não especificado');
    }
    
    $sql = "
        SELECT 
            t.id,
            t.fisherman_name,
            t.fish_type,
            t.location,
            t.image_url,
            t.weight,
            t.date,
            t.position,
            t.report_id
        FROM trophies t
        WHERE DATE_FORMAT(t.date, '%Y-%m') = :month 
        AND t.active = 1
        ORDER BY t.position ASC
        LIMIT 10
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':month', $month);
    $stmt->execute();
    
    $trophies = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'trophies' => $trophies
    ]);
}

function autoUpdateFromReports() {
    global $pdo;
    
    // Verificar se é um novo mês (primeiro dia do mês às 00:00)
    $today = date('Y-m-d');
    $firstDayOfMonth = date('Y-m-01');
    
    if ($today === $firstDayOfMonth) {
        // Arquivar ranking do mês anterior se ainda não foi feito
        $lastMonth = date('Y-m', strtotime('-1 month'));
        
        // Verificar se já existe arquivo do mês anterior
        $checkSql = "SELECT COUNT(*) as count FROM trophies_archive WHERE month_year = :lastMonth";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->bindParam(':lastMonth', $lastMonth);
        $checkStmt->execute();
        $exists = $checkStmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        if ($exists == 0) {
            // Arquivar troféus do mês anterior
            $archiveSql = "
                INSERT INTO trophies_archive (
                    month_year, fisherman_name, fish_type, location, 
                    image_url, weight, date, position, report_id, created_at
                )
                SELECT 
                    DATE_FORMAT(date, '%Y-%m'), fisherman_name, fish_type, location,
                    image_url, weight, date, position, report_id, NOW()
                FROM trophies 
                WHERE DATE_FORMAT(date, '%Y-%m') = :lastMonth
                AND active = 1
            ";
            
            $archiveStmt = $pdo->prepare($archiveSql);
            $archiveStmt->bindParam(':lastMonth', $lastMonth);
            $archiveStmt->execute();
        }
    }
    
    // Atualizar ranking do mês atual
    updateTrophyRanking();
}
?>