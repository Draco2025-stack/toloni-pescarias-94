<?php
/**
 * Script de limpeza automática de sessões e dados temporários
 * Configurar no cPanel da Hostinger para executar de hora em hora:
 * 0 * * * * php /caminho/para/cron/cleanup_sessions.php
 */

require_once __DIR__ . '/../config/environment.php';

try {
    $startTime = microtime(true);
    $memoryStart = memory_get_usage();
    
    echo "Iniciando limpeza de sessões e dados temporários...\n";
    
    $config = getAppConfig();
    
    // Conectar ao banco
    $dsn = "mysql:host={$config['db_host']};dbname={$config['db_name']};charset={$config['db_charset']}";
    $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    $totalCleaned = 0;
    
    // 1. Limpar sessões expiradas (se usando tabela de sessões)
    $sessionsCleaned = cleanExpiredSessions($pdo, $config);
    $totalCleaned += $sessionsCleaned;
    echo "Sessões expiradas removidas: $sessionsCleaned\n";
    
    // 2. Limpar rate limits antigos
    $rateLimitsCleaned = cleanOldRateLimits($pdo);
    $totalCleaned += $rateLimitsCleaned;
    echo "Rate limits antigos removidos: $rateLimitsCleaned\n";
    
    // 3. Limpar logs de segurança antigos (manter apenas 30 dias)
    $securityLogsCleaned = cleanOldSecurityLogs($pdo, 30);
    $totalCleaned += $securityLogsCleaned;
    echo "Logs de segurança antigos removidos: $securityLogsCleaned\n";
    
    // 4. Limpar arquivos temporários de upload
    $tempFilesCleaned = cleanTempUploadFiles($config);
    $totalCleaned += $tempFilesCleaned;
    echo "Arquivos temporários removidos: $tempFilesCleaned\n";
    
    // 5. Otimizar tabelas se necessário
    if ($totalCleaned > 100) {
        optimizeDatabase($pdo);
        echo "Otimização do banco de dados executada\n";
    }
    
    // Log da atividade
    logSecurityEvent($pdo, null, 'CLEANUP_SESSIONS', "Total cleaned: $totalCleaned items");
    
    // Log de performance
    logPerformance('CLEANUP_SESSIONS', $startTime, $memoryStart);
    
    echo "Limpeza concluída. Total de itens removidos: $totalCleaned\n";
    
} catch (Exception $e) {
    echo "Erro durante limpeza: " . $e->getMessage() . "\n";
    error_log("Cleanup cron error: " . $e->getMessage());
}

/**
 * Limpar sessões expiradas
 */
function cleanExpiredSessions($pdo, $config) {
    try {
        // Verificar se existe tabela de sessões
        $stmt = $pdo->query("SHOW TABLES LIKE 'sessions'");
        if ($stmt->rowCount() === 0) {
            return 0;
        }
        
        $sessionLifetime = $config['session_lifetime'];
        $expiredTime = date('Y-m-d H:i:s', time() - $sessionLifetime);
        
        $stmt = $pdo->prepare("DELETE FROM sessions WHERE updated_at < ?");
        $stmt->execute([$expiredTime]);
        
        return $stmt->rowCount();
        
    } catch (Exception $e) {
        error_log("Error cleaning expired sessions: " . $e->getMessage());
        return 0;
    }
}

/**
 * Limpar rate limits antigos
 */
function cleanOldRateLimits($pdo) {
    try {
        // Remover registros de rate limit mais antigos que 24 horas
        $cutoffTime = date('Y-m-d H:i:s', time() - (24 * 60 * 60));
        
        $stmt = $pdo->prepare("DELETE FROM rate_limits WHERE last_request < ?");
        $stmt->execute([$cutoffTime]);
        
        return $stmt->rowCount();
        
    } catch (Exception $e) {
        error_log("Error cleaning old rate limits: " . $e->getMessage());
        return 0;
    }
}

/**
 * Limpar logs de segurança antigos
 */
function cleanOldSecurityLogs($pdo, $keepDays = 30) {
    try {
        $cutoffTime = date('Y-m-d H:i:s', time() - ($keepDays * 24 * 60 * 60));
        
        $stmt = $pdo->prepare("DELETE FROM security_logs WHERE created_at < ?");
        $stmt->execute([$cutoffTime]);
        
        return $stmt->rowCount();
        
    } catch (Exception $e) {
        error_log("Error cleaning old security logs: " . $e->getMessage());
        return 0;
    }
}

/**
 * Limpar arquivos temporários de upload
 */
function cleanTempUploadFiles($config) {
    try {
        $uploadPath = $config['upload_path'];
        $tempPath = $uploadPath . '/temp';
        
        if (!is_dir($tempPath)) {
            return 0;
        }
        
        $cutoffTime = time() - (24 * 60 * 60); // 24 horas atrás
        $files = glob($tempPath . '/*');
        $deletedCount = 0;
        
        foreach ($files as $file) {
            if (is_file($file) && filemtime($file) < $cutoffTime) {
                if (unlink($file)) {
                    $deletedCount++;
                }
            }
        }
        
        return $deletedCount;
        
    } catch (Exception $e) {
        error_log("Error cleaning temp upload files: " . $e->getMessage());
        return 0;
    }
}

/**
 * Otimizar banco de dados
 */
function optimizeDatabase($pdo) {
    try {
        // Obter lista de tabelas
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        foreach ($tables as $table) {
            $pdo->exec("OPTIMIZE TABLE `$table`");
        }
        
        return true;
        
    } catch (Exception $e) {
        error_log("Error optimizing database: " . $e->getMessage());
        return false;
    }
}

/**
 * Log de evento de segurança
 */
function logSecurityEvent($pdo, $userId, $action, $details = '') {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO security_logs (user_id, action, details, ip_address, user_agent, created_at) 
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $userId,
            $action,
            $details,
            'cron',
            'cleanup-script'
        ]);
        
    } catch (Exception $e) {
        error_log("Failed to log security event: " . $e->getMessage());
    }
}

/**
 * Log de performance
 */
function logPerformance($action, $startTime, $memoryStart = null) {
    $duration = microtime(true) - $startTime;
    $memoryUsed = $memoryStart ? memory_get_usage() - $memoryStart : memory_get_usage();
    
    $logMessage = "[" . date('Y-m-d H:i:s') . "] $action - Duration: " . round($duration, 3) . "s, Memory: " . formatFileSize($memoryUsed) . "\n";
    
    $config = getAppConfig();
    $logFile = $config['log_path'] . '/performance.log';
    
    if (!is_dir(dirname($logFile))) {
        mkdir(dirname($logFile), 0755, true);
    }
    
    file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    echo $logMessage;
}

/**
 * Formatar tamanho de arquivo
 */
function formatFileSize($bytes, $precision = 2) {
    $units = array('B', 'KB', 'MB', 'GB', 'TB');
    
    for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
        $bytes /= 1024;
    }
    
    return round($bytes, $precision) . ' ' . $units[$i];
}
?>