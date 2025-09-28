<?php
/**
 * Script de backup automático do banco de dados
 * Configurar no cPanel da Hostinger para executar diariamente:
 * 0 2 * * * php /caminho/para/cron/backup_database.php
 */

require_once __DIR__ . '/../config/environment.php';

try {
    $startTime = microtime(true);
    $memoryStart = memory_get_usage();
    
    echo "Iniciando backup do banco de dados...\n";
    
    $config = getAppConfig();
    
    // Conectar ao banco
    $dsn = "mysql:host={$config['db_host']};dbname={$config['db_name']};charset={$config['db_charset']}";
    $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    $filename = createDatabaseBackup($pdo, $config);
    
    if ($filename) {
        echo "Backup criado com sucesso: $filename\n";
        
        // Log no banco de dados
        logSecurityEvent($pdo, null, 'DATABASE_BACKUP', "Backup file: $filename");
        
        // Limpeza de backups antigos
        cleanOldBackups($config);
        
        // Enviar notificação por email (opcional)
        if (function_exists('sendEmail') && !empty($config['admin_email'])) {
            $subject = 'Backup Diário - Toloni Pescarias';
            $message = "Backup do banco de dados criado com sucesso.\n\n";
            $message .= "Arquivo: $filename\n";
            $message .= "Data: " . date('Y-m-d H:i:s') . "\n";
            $message .= "Tamanho: " . formatFileSize(filesize($config['backup_path'] . '/' . $filename));
            
            sendEmail($config['admin_email'], $subject, $message, false);
        }
        
    } else {
        echo "Erro ao criar backup\n";
        
        // Notificar erro por email
        if (function_exists('sendEmail') && !empty($config['admin_email'])) {
            $subject = 'ERRO - Backup Diário - Toloni Pescarias';
            $message = "ERRO ao criar backup do banco de dados.\n\n";
            $message .= "Data: " . date('Y-m-d H:i:s') . "\n";
            $message .= "Verifique os logs do servidor.";
            
            sendEmail($config['admin_email'], $subject, $message, false);
        }
    }
    
    // Log de performance
    logPerformance('DATABASE_BACKUP', $startTime, $memoryStart);
    
} catch (Exception $e) {
    echo "Erro durante backup: " . $e->getMessage() . "\n";
    error_log("Backup cron error: " . $e->getMessage());
    
    // Notificar erro crítico por email
    if (function_exists('sendEmail') && !empty($config['admin_email'])) {
        $subject = 'ERRO CRÍTICO - Backup Diário - Toloni Pescarias';
        $message = "ERRO CRÍTICO durante backup do banco de dados.\n\n";
        $message .= "Erro: " . $e->getMessage() . "\n";
        $message .= "Data: " . date('Y-m-d H:i:s') . "\n";
        $message .= "Verifique o sistema imediatamente.";
        
        try {
            sendEmail($config['admin_email'], $subject, $message, false);
        } catch (Exception $emailError) {
            error_log("Failed to send backup error email: " . $emailError->getMessage());
        }
    }
}

/**
 * Criar backup do banco de dados
 */
function createDatabaseBackup($pdo, $config) {
    try {
        // Criar diretório de backup se não existir
        $backupDir = $config['backup_path'];
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }
        
        // Nome do arquivo de backup
        $timestamp = date('Y-m-d_H-i-s');
        $filename = "backup_toloni_{$timestamp}.sql";
        $filepath = $backupDir . '/' . $filename;
        
        // Abrir arquivo para escrita
        $file = fopen($filepath, 'w');
        if (!$file) {
            throw new Exception("Não foi possível criar arquivo de backup: $filepath");
        }
        
        // Cabeçalho do backup
        fwrite($file, "-- Backup do banco de dados Toloni Pescarias\n");
        fwrite($file, "-- Data: " . date('Y-m-d H:i:s') . "\n");
        fwrite($file, "-- Banco: " . $config['db_name'] . "\n\n");
        fwrite($file, "SET FOREIGN_KEY_CHECKS=0;\n");
        fwrite($file, "SET SQL_MODE=\"NO_AUTO_VALUE_ON_ZERO\";\n");
        fwrite($file, "SET AUTOCOMMIT=0;\n");
        fwrite($file, "START TRANSACTION;\n\n");
        
        // Obter lista de tabelas
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        foreach ($tables as $table) {
            echo "Fazendo backup da tabela: $table\n";
            
            // Estrutura da tabela
            $stmt = $pdo->query("SHOW CREATE TABLE `$table`");
            $createTable = $stmt->fetch();
            
            fwrite($file, "-- Estrutura da tabela `$table`\n");
            fwrite($file, "DROP TABLE IF EXISTS `$table`;\n");
            fwrite($file, $createTable['Create Table'] . ";\n\n");
            
            // Dados da tabela
            $stmt = $pdo->query("SELECT * FROM `$table`");
            $rowCount = 0;
            
            fwrite($file, "-- Dados da tabela `$table`\n");
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                if ($rowCount === 0) {
                    $columns = array_keys($row);
                    fwrite($file, "INSERT INTO `$table` (`" . implode('`, `', $columns) . "`) VALUES\n");
                }
                
                $values = array_map(function($value) use ($pdo) {
                    return $value === null ? 'NULL' : $pdo->quote($value);
                }, array_values($row));
                
                $comma = $rowCount > 0 ? ",\n" : "";
                fwrite($file, $comma . "(" . implode(', ', $values) . ")");
                $rowCount++;
            }
            
            if ($rowCount > 0) {
                fwrite($file, ";\n");
            }
            
            fwrite($file, "\n");
        }
        
        // Rodapé do backup
        fwrite($file, "SET FOREIGN_KEY_CHECKS=1;\n");
        fwrite($file, "COMMIT;\n");
        fclose($file);
        
        // Verificar se o arquivo foi criado com sucesso
        if (file_exists($filepath) && filesize($filepath) > 0) {
            return $filename;
        } else {
            throw new Exception("Arquivo de backup criado mas está vazio");
        }
        
    } catch (Exception $e) {
        if (isset($file) && is_resource($file)) {
            fclose($file);
        }
        
        if (isset($filepath) && file_exists($filepath)) {
            unlink($filepath);
        }
        
        throw $e;
    }
}

/**
 * Limpar backups antigos
 */
function cleanOldBackups($config, $keepDays = 7) {
    try {
        $backupDir = $config['backup_path'];
        if (!is_dir($backupDir)) {
            return;
        }
        
        $cutoffTime = time() - ($keepDays * 24 * 60 * 60);
        $files = glob($backupDir . '/backup_toloni_*.sql');
        $deletedCount = 0;
        
        foreach ($files as $file) {
            if (filemtime($file) < $cutoffTime) {
                if (unlink($file)) {
                    echo "Backup antigo removido: " . basename($file) . "\n";
                    $deletedCount++;
                }
            }
        }
        
        if ($deletedCount > 0) {
            echo "Total de backups antigos removidos: $deletedCount\n";
        }
        
    } catch (Exception $e) {
        echo "Erro ao limpar backups antigos: " . $e->getMessage() . "\n";
        error_log("Cleanup old backups error: " . $e->getMessage());
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
            $_SERVER['REMOTE_ADDR'] ?? 'cron',
            $_SERVER['HTTP_USER_AGENT'] ?? 'cron-backup'
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

/**
 * Enviar email (se disponível)
 */
if (!function_exists('sendEmail')) {
    function sendEmail($to, $subject, $body, $isHtml = true) {
        // Incluir PHPMailer se disponível
        $phpmailerPath = __DIR__ . '/../api/phpmailer/src/PHPMailer.php';
        if (file_exists($phpmailerPath)) {
            require_once $phpmailerPath;
            require_once __DIR__ . '/../api/phpmailer/src/SMTP.php';
            require_once __DIR__ . '/../api/phpmailer/src/Exception.php';
            
            $config = getAppConfig();
            
            $mail = new PHPMailer\PHPMailer\PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $config['smtp_host'];
            $mail->SMTPAuth = true;
            $mail->Username = $config['smtp_username'];
            $mail->Password = $config['smtp_password'];
            $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = $config['smtp_port'];
            $mail->CharSet = 'UTF-8';
            
            $mail->setFrom($config['smtp_from_email'], $config['smtp_from_name']);
            $mail->addAddress($to);
            $mail->Subject = $subject;
            
            if ($isHtml) {
                $mail->isHTML(true);
                $mail->Body = $body;
            } else {
                $mail->Body = $body;
            }
            
            $mail->send();
            return true;
        }
        
        return false;
    }
}
?>