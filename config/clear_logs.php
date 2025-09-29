<?php
/**
 * Script para limpar logs sensíveis em produção
 * Execute este script após corrigir problemas de segurança
 */

require_once __DIR__ . '/environment.php';

function clearSensitiveLogs() {
    $logPath = getAppConfig('log_path') ?? __DIR__ . '/../logs';
    $cleared = [];
    
    // Lista de arquivos de log para limpar
    $logFiles = [
        'security.log',
        'error.log',
        'debug.log',
        'application.log',
        'access.log'
    ];
    
    foreach ($logFiles as $logFile) {
        $filePath = $logPath . '/' . $logFile;
        
        if (file_exists($filePath)) {
            // Fazer backup do log atual
            $backupPath = $filePath . '.backup.' . date('Y-m-d-H-i-s');
            copy($filePath, $backupPath);
            
            // Limpar o arquivo de log
            file_put_contents($filePath, '');
            $cleared[] = $logFile;
        }
    }
    
    return $cleared;
}

function logSecurityCleanup() {
    $logPath = getAppConfig('log_path') ?? __DIR__ . '/../logs';
    $securityLog = $logPath . '/security.log';
    
    $cleanupEvent = [
        'timestamp' => date('Y-m-d H:i:s'),
        'event' => 'security_cleanup',
        'description' => 'Logs limpos após correções de segurança',
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'cli',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'cleanup_script'
    ];
    
    file_put_contents($securityLog, json_encode($cleanupEvent) . "\n", FILE_APPEND | LOCK_EX);
}

// Executar apenas se chamado diretamente
if (basename(__FILE__) == basename($_SERVER["SCRIPT_NAME"] ?? '')) {
    echo "🧹 Limpando logs sensíveis...\n";
    
    $cleared = clearSensitiveLogs();
    
    if (!empty($cleared)) {
        echo "✅ Logs limpos: " . implode(', ', $cleared) . "\n";
        logSecurityCleanup();
        echo "✅ Backup criado e novo log de segurança iniciado\n";
    } else {
        echo "ℹ️  Nenhum log encontrado para limpar\n";
    }
    
    echo "🔒 Limpeza de segurança concluída!\n";
}
?>