<?php
// Script para backup automático do banco de dados
// Configurar no cPanel da Hostinger para executar diariamente

require_once '../config/database.php';
require_once '../config/hostinger_production.php';

try {
    $startTime = microtime(true);
    $memoryStart = memory_get_usage();
    
    echo "Iniciando backup do banco de dados...\n";
    
    $filename = createDatabaseBackup($pdo);
    
    if ($filename) {
        echo "Backup criado com sucesso: $filename\n";
        
        // Log no banco de dados
        logSecurityEvent($pdo, null, 'DATABASE_BACKUP', "Backup file: $filename");
        
        // Enviar notificação por email (opcional)
        $adminEmail = 'admin@tolonipescarias.com.br'; // Configurar email do admin
        $subject = 'Backup Diário - Toloni Pescarias';
        $message = "Backup do banco de dados criado com sucesso.\n\nArquivo: $filename\nData: " . date('Y-m-d H:i:s');
        
        if (function_exists('sendEmail')) {
            sendEmail($adminEmail, $subject, $message, false);
        }
        
    } else {
        echo "Erro ao criar backup\n";
        
        // Notificar erro por email
        $adminEmail = 'admin@tolonipescarias.com.br';
        $subject = 'ERRO - Backup Diário - Toloni Pescarias';
        $message = "ERRO ao criar backup do banco de dados.\n\nData: " . date('Y-m-d H:i:s') . "\nVerifique os logs do servidor.";
        
        if (function_exists('sendEmail')) {
            sendEmail($adminEmail, $subject, $message, false);
        }
    }
    
    // Log de performance
    logPerformance('DATABASE_BACKUP', $startTime, $memoryStart);
    
} catch (Exception $e) {
    echo "Erro durante backup: " . $e->getMessage() . "\n";
    error_log("Backup cron error: " . $e->getMessage());
}
?>