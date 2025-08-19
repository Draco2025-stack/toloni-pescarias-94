<?php
/**
 * Script para reset mensal automático dos troféus
 * Deve ser executado mensalmente via Cron Job na Hostinger
 * 
 * Exemplo de Cron Job (dia 1 de cada mês às 02:00):
 * 0 2 1 * * /usr/bin/php /home/usuario/public_html/api/cron_monthly_reset.php
 */

// Configuração de ambiente
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/cron_errors.log');

// Headers para execução via web (caso necessário para testes)
if (isset($_SERVER['HTTP_HOST'])) {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    
    // Verificar se é uma requisição válida
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }
}

try {
    // Incluir configuração do banco
    require_once __DIR__ . '/../config/database.php';
    
    // Log de início
    error_log('[' . date('Y-m-d H:i:s') . '] Iniciando reset mensal dos troféus...');
    
    // Executar procedure de reset mensal
    $stmt = $pdo->prepare("CALL ResetMonthlyTrophies()");
    $result = $stmt->execute();
    
    if ($result) {
        // Verificar quantos registros foram processados
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as current_trophies,
                (SELECT COUNT(*) FROM trophies_archive WHERE month_year = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m')) as archived_trophies
        ");
        $stmt->execute();
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $message = "Reset mensal concluído com sucesso! " .
                  "Troféus atuais: {$stats['current_trophies']}, " .
                  "Troféus arquivados: {$stats['archived_trophies']}";
        
        error_log('[' . date('Y-m-d H:i:s') . '] ' . $message);
        
        if (isset($_SERVER['HTTP_HOST'])) {
            echo json_encode([
                'success' => true,
                'message' => $message,
                'stats' => $stats
            ]);
        }
    } else {
        throw new Exception('Falha ao executar procedure de reset mensal');
    }
    
} catch (Exception $e) {
    $error = 'Erro no reset mensal: ' . $e->getMessage();
    error_log('[' . date('Y-m-d H:i:s') . '] ' . $error);
    
    if (isset($_SERVER['HTTP_HOST'])) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => $error
        ]);
    }
    
    exit(1);
}

exit(0);
?>