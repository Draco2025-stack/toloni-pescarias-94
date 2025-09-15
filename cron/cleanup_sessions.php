<?php
// Script para limpeza de sessões expiradas e logs antigos
// Configurar no cPanel da Hostinger para executar a cada hora

require_once '../config/database.php';
require_once '../config/hostinger_production.php';
require_once '../config/security.php';

try {
    $startTime = microtime(true);
    $memoryStart = memory_get_usage();
    
    echo "Iniciando limpeza de dados...\n";
    
    // Limpar sessões expiradas (mais de 24 horas)
    $stmt = $pdo->prepare("DELETE FROM user_sessions WHERE last_activity < DATE_SUB(NOW(), INTERVAL 24 HOUR)");
    $stmt->execute();
    $sessionsCleaned = $stmt->rowCount();
    echo "Sessões expiradas removidas: $sessionsCleaned\n";
    
    // Limpar logs de segurança antigos (mais de 90 dias)
    $stmt = $pdo->prepare("DELETE FROM security_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)");
    $stmt->execute();
    $securityLogsCleaned = $stmt->rowCount();
    echo "Logs de segurança antigos removidos: $securityLogsCleaned\n";
    
    // Limpar rate limits antigos (mais de 1 hora)
    $stmt = $pdo->prepare("DELETE FROM rate_limits WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)");
    $stmt->execute();
    $rateLimitsCleaned = $stmt->rowCount();
    echo "Rate limits antigos removidos: $rateLimitsCleaned\n";
    
    // Limpar logs de performance antigos (mais de 30 dias)
    if ($pdo->query("SHOW TABLES LIKE 'performance_logs'")->rowCount() > 0) {
        $stmt = $pdo->prepare("DELETE FROM performance_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)");
        $stmt->execute();
        $performanceLogsCleaned = $stmt->rowCount();
        echo "Logs de performance antigos removidos: $performanceLogsCleaned\n";
    }
    
    // Otimizar tabelas
    $tables = ['users', 'reports', 'comments', 'locations', 'user_sessions', 'security_logs', 'rate_limits'];
    foreach ($tables as $table) {
        $pdo->exec("OPTIMIZE TABLE $table");
    }
    echo "Otimização de tabelas concluída\n";
    
    // Log da limpeza
    $summary = "Sessions: $sessionsCleaned, Security logs: $securityLogsCleaned, Rate limits: $rateLimitsCleaned";
    logSecurityEvent($pdo, null, 'CLEANUP_COMPLETED', $summary);
    
    // Log de performance
    logPerformance('CLEANUP_PROCESS', $startTime, $memoryStart);
    
    echo "Limpeza concluída com sucesso\n";
    
} catch (Exception $e) {
    echo "Erro durante limpeza: " . $e->getMessage() . "\n";
    error_log("Cleanup cron error: " . $e->getMessage());
}
?>