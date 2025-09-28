<?php
/**
 * Webhook para atualização automática do ranking de troféus
 * Processa eventos de criação, atualização e deleção de relatos
 */

require_once '../config/database_hostinger.php';
require_once '../config/cors_unified.php';
require_once '../config/session_cookies.php';

// Configuração de logs
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/trophy_webhook.log');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Log da requisição
error_log('[' . date('Y-m-d H:i:s') . '] Webhook chamado - IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));

// Apenas aceitar requisições POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    if (!$input) {
        throw new Exception('Dados de entrada inválidos');
    }
    
    error_log('[' . date('Y-m-d H:i:s') . '] Ação recebida: ' . $action);
    
    switch ($action) {
        case 'report_created':
        case 'report_updated':
            handleReportChange($input);
            break;
        case 'report_deleted':
            handleReportDeleted($input);
            break;
        default:
            throw new Exception('Ação não reconhecida: ' . $action);
    }
    
    error_log('[' . date('Y-m-d H:i:s') . '] Webhook processado com sucesso');
    
} catch (Exception $e) {
    error_log('[' . date('Y-m-d H:i:s') . '] Erro no webhook: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro: ' . $e->getMessage()
    ]);
}

function handleReportChange($data) {
    global $pdo;
    
    // Verificar se o relato atende aos critérios do ranking
    $reportId = $data['report_id'] ?? null;
    $fishSpecies = $data['fish_species'] ?? '';
    $location = $data['location'] ?? '';
    $images = $data['images'] ?? [];
    $isPublic = $data['is_public'] ?? false;
    $approved = $data['approved'] ?? false;
    
    if (!$reportId) {
        throw new Exception('ID do relato não fornecido');
    }
    
    // Verificar se atende aos critérios
    $meetsCriteria = (
        !empty($fishSpecies) &&
        !empty($location) &&
        is_array($images) && count($images) > 0 &&
        $isPublic === true &&
        $approved === true
    );
    
    if ($meetsCriteria) {
        // Aguardar um pouco e então atualizar o ranking
        sleep(1); // Aguardar 1 segundo para garantir que o relato foi salvo
        
        // Chamar função de atualização do ranking
        $updatedEntries = updateTrophyRanking();
        
        error_log('[' . date('Y-m-d H:i:s') . '] Ranking atualizado - ' . $updatedEntries . ' troféus processados');
        
        echo json_encode([
            'success' => true,
            'message' => 'Ranking atualizado com sucesso',
            'meets_criteria' => true,
            'updated_entries' => $updatedEntries
        ]);
    } else {
        error_log('[' . date('Y-m-d H:i:s') . '] Relato não atende critérios - Espécie: ' . $fishSpecies . ', Público: ' . ($isPublic ? 'sim' : 'não') . ', Aprovado: ' . ($approved ? 'sim' : 'não'));
        
        echo json_encode([
            'success' => true,
            'message' => 'Relato não atende aos critérios do ranking',
            'meets_criteria' => false
        ]);
    }
}

function handleReportDeleted($data) {
    global $pdo;
    
    $reportId = $data['report_id'] ?? null;
    
    if (!$reportId) {
        throw new Exception('ID do relato não fornecido');
    }
    
    // Verificar se o relato estava no ranking
    $checkSql = "SELECT COUNT(*) as count FROM trophies WHERE report_id = :reportId";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->bindParam(':reportId', $reportId);
    $checkStmt->execute();
    $exists = $checkStmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    if ($exists > 0) {
        // Remover do ranking
        $deleteSql = "DELETE FROM trophies WHERE report_id = :reportId";
        $deleteStmt = $pdo->prepare($deleteSql);
        $deleteStmt->bindParam(':reportId', $reportId);
        $deleteStmt->execute();
        
        // Atualizar ranking para reorganizar posições
        $updatedEntries = updateTrophyRanking();
        
        error_log('[' . date('Y-m-d H:i:s') . '] Troféu removido e ranking reorganizado - ' . $updatedEntries . ' troféus restantes');
        
        echo json_encode([
            'success' => true,
            'message' => 'Troféu removido e ranking atualizado',
            'was_in_ranking' => true,
            'updated_entries' => $updatedEntries
        ]);
    } else {
        error_log('[' . date('Y-m-d H:i:s') . '] Tentativa de remover relato que não estava no ranking - ID: ' . $reportId);
        
        echo json_encode([
            'success' => true,
            'message' => 'Relato não estava no ranking',
            'was_in_ranking' => false
        ]);
    }
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
            COALESCE(l.name, 'Local não informado') as location,
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
    
    return count($eligibleReports);
}
?>