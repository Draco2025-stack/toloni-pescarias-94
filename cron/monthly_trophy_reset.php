<?php
/**
 * Cron Job para Reset Mensal de Troféus
 * Execute este script mensalmente via cron da Hostinger
 * Comando sugerido: 0 2 1 * * /usr/bin/php /path/to/cron/monthly_trophy_reset.php
 */

require_once '../config/database.php';
require_once '../config/hostinger_production.php';
require_once '../config/security.php';

try {
    $startTime = microtime(true);
    logPerformance("Monthly trophy reset started", $startTime);
    
    echo "=== RESET MENSAL DE TROFÉUS ===\n";
    echo "Data: " . date('Y-m-d H:i:s') . "\n";
    
    $pdo->beginTransaction();
    
    // 1. Arquivar troféus do mês anterior
    $previousMonth = date('Y-m', strtotime('-1 month'));
    $currentMonth = date('Y-m');
    
    echo "Arquivando troféus de: $previousMonth\n";
    
    $stmt = $pdo->prepare("
        INSERT INTO trophies_archive (month_year, fisherman_name, fish_type, location, image_url, weight, date, position, report_id)
        SELECT ?, fisherman_name, fish_type, location, image_url, weight, date, position, report_id
        FROM trophies 
        WHERE active = 1
        AND DATE_FORMAT(created_at, '%Y-%m') = ?
    ");
    $stmt->execute([$previousMonth, $previousMonth]);
    $archived_count = $stmt->rowCount();
    
    echo "Troféus arquivados: $archived_count\n";
    
    // 2. Limpar troféus antigos (manter apenas do mês atual)
    $stmt = $pdo->prepare("
        DELETE FROM trophies 
        WHERE active = 1 
        AND DATE_FORMAT(created_at, '%Y-%m') != ?
    ");
    $stmt->execute([$currentMonth]);
    $cleaned_count = $stmt->rowCount();
    
    echo "Troféus limpos: $cleaned_count\n";
    
    // 3. Atualizar ranking do mês atual
    echo "Atualizando ranking do mês atual: $currentMonth\n";
    
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
            AND DATE_FORMAT(r.created_at, '%Y-%m') = ?
        ORDER BY 
            CAST(NULLIF(REGEXP_REPLACE(r.fish_weight, '[^0-9.]', ''), '') AS DECIMAL(10,2)) DESC,
            likes_count DESC,
            r.created_at ASC
        LIMIT 10
    ");
    
    $stmt->execute([$currentMonth]);
    $top_reports = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Limpar ranking atual do mês
    $pdo->prepare("DELETE FROM trophies WHERE active = 1")->execute();
    
    // Inserir novos troféus
    $position = 1;
    $inserted_count = 0;
    
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
        $inserted_count++;
    }
    
    echo "Novos troféus inseridos: $inserted_count\n";
    
    // 4. Log da operação
    $stmt = $pdo->prepare("
        INSERT INTO trophy_logs (action, user_id, data, created_at)
        VALUES ('monthly_reset_cron', NULL, ?, NOW())
    ");
    
    $logData = [
        'archived_count' => $archived_count,
        'cleaned_count' => $cleaned_count,
        'inserted_count' => $inserted_count,
        'previous_month' => $previousMonth,
        'current_month' => $currentMonth,
        'execution_time' => microtime(true) - $startTime
    ];
    
    $stmt->execute([json_encode($logData)]);
    
    $pdo->commit();
    
    echo "Reset mensal concluído com sucesso!\n";
    echo "Tempo de execução: " . number_format(microtime(true) - $startTime, 2) . "s\n";
    echo "========================\n";
    
    logPerformance("Monthly trophy reset completed successfully", $startTime);
    
} catch (Exception $e) {
    if (isset($pdo)) {
        $pdo->rollBack();
    }
    
    $error_msg = "ERRO no reset mensal: " . $e->getMessage();
    echo $error_msg . "\n";
    error_log($error_msg);
    
    // Tentar logar o erro no banco se possível
    try {
        if (isset($pdo)) {
            $stmt = $pdo->prepare("
                INSERT INTO trophy_logs (action, user_id, data, created_at)
                VALUES ('monthly_reset_error', NULL, ?, NOW())
            ");
            
            $stmt->execute([json_encode([
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ])]);
        }
    } catch (Exception $logError) {
        error_log("Erro ao logar erro do cron: " . $logError->getMessage());
    }
    
    exit(1);
}
?>