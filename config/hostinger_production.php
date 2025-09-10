<?php
// Configurações específicas para produção na Hostinger
// Incluir este arquivo após database.php em produção

// Configurações de upload para Hostinger
ini_set('upload_max_filesize', '5M');
ini_set('post_max_size', '10M');
ini_set('max_execution_time', 300);
ini_set('memory_limit', '256M');

// Configurações de sessão para produção
ini_set('session.cookie_secure', '1');
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.use_strict_mode', '1');

// Configurações de erro para produção
error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/../logs/php_errors.log');

// Criar diretório de logs se não existir
$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

// Configurações de cache para produção
if (function_exists('opcache_get_status')) {
    opcache_enable();
}

// Headers de segurança para produção
function setProductionHeaders() {
    if (!headers_sent()) {
        header('X-Frame-Options: DENY');
        header('X-Content-Type-Options: nosniff');
        header('X-XSS-Protection: 1; mode=block');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: https:; font-src \'self\' https://fonts.gstatic.com;');
    }
}

// Configuração de SMTP para envio de emails na Hostinger
define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'noreply@tolonipescarias.com.br'); // Configurar com email real
define('SMTP_PASSWORD', 'SuaSenhaEmail123'); // Configurar com senha real
define('SMTP_FROM_EMAIL', 'noreply@tolonipescarias.com.br');
define('SMTP_FROM_NAME', 'Toloni Pescarias');

// Função para envio de emails
function sendEmail($to, $subject, $body, $isHtml = true) {
    require_once __DIR__ . '/../vendor/phpmailer/src/PHPMailer.php';
    require_once __DIR__ . '/../vendor/phpmailer/src/SMTP.php';
    require_once __DIR__ . '/../vendor/phpmailer/src/Exception.php';
    
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    
    try {
        // Configurações do servidor
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USERNAME;
        $mail->Password = SMTP_PASSWORD;
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = SMTP_PORT;
        $mail->CharSet = 'UTF-8';
        
        // Remetente e destinatário
        $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
        $mail->addAddress($to);
        
        // Conteúdo
        $mail->isHTML($isHtml);
        $mail->Subject = $subject;
        $mail->Body = $body;
        
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Email error: " . $mail->ErrorInfo);
        return false;
    }
}

// Configurações de backup automático
define('BACKUP_DIR', __DIR__ . '/../backups');
define('BACKUP_RETENTION_DAYS', 30);

// Função para backup do banco de dados
function createDatabaseBackup($pdo) {
    try {
        $backupDir = BACKUP_DIR;
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }
        
        $filename = 'backup_' . date('Y-m-d_H-i-s') . '.sql';
        $filepath = $backupDir . '/' . $filename;
        
        // Obter lista de tabelas
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $backup = "-- Backup do banco de dados Toloni Pescarias\n";
        $backup .= "-- Criado em: " . date('Y-m-d H:i:s') . "\n\n";
        $backup .= "SET FOREIGN_KEY_CHECKS=0;\n\n";
        
        foreach ($tables as $table) {
            // Estrutura da tabela
            $stmt = $pdo->query("SHOW CREATE TABLE `$table`");
            $create = $stmt->fetch(PDO::FETCH_ASSOC);
            $backup .= "DROP TABLE IF EXISTS `$table`;\n";
            $backup .= $create['Create Table'] . ";\n\n";
            
            // Dados da tabela
            $stmt = $pdo->query("SELECT * FROM `$table`");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (!empty($rows)) {
                $backup .= "INSERT INTO `$table` VALUES\n";
                $values = [];
                foreach ($rows as $row) {
                    $escapedRow = array_map(function($value) use ($pdo) {
                        return $value === null ? 'NULL' : $pdo->quote($value);
                    }, $row);
                    $values[] = '(' . implode(',', $escapedRow) . ')';
                }
                $backup .= implode(",\n", $values) . ";\n\n";
            }
        }
        
        $backup .= "SET FOREIGN_KEY_CHECKS=1;\n";
        
        file_put_contents($filepath, $backup);
        
        // Limpar backups antigos
        cleanOldBackups();
        
        return $filename;
    } catch (Exception $e) {
        error_log("Backup error: " . $e->getMessage());
        return false;
    }
}

// Função para limpar backups antigos
function cleanOldBackups() {
    $backupDir = BACKUP_DIR;
    if (!is_dir($backupDir)) return;
    
    $files = glob($backupDir . '/backup_*.sql');
    $retentionTime = time() - (BACKUP_RETENTION_DAYS * 24 * 60 * 60);
    
    foreach ($files as $file) {
        if (filemtime($file) < $retentionTime) {
            unlink($file);
        }
    }
}

// Configurações de rate limiting
define('RATE_LIMIT_REQUESTS', 100); // Requests por hora
define('RATE_LIMIT_WINDOW', 3600); // 1 hora em segundos

// Função para verificar rate limiting
function checkRateLimit($pdo, $identifier) {
    try {
        $window_start = time() - RATE_LIMIT_WINDOW;
        
        // Limpar registros antigos
        $stmt = $pdo->prepare("DELETE FROM rate_limits WHERE created_at < ?");
        $stmt->execute([date('Y-m-d H:i:s', $window_start)]);
        
        // Contar requests no período
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM rate_limits WHERE identifier = ? AND created_at >= ?");
        $stmt->execute([$identifier, date('Y-m-d H:i:s', $window_start)]);
        $count = $stmt->fetchColumn();
        
        if ($count >= RATE_LIMIT_REQUESTS) {
            return false;
        }
        
        // Registrar este request
        $stmt = $pdo->prepare("INSERT INTO rate_limits (identifier) VALUES (?)");
        $stmt->execute([$identifier]);
        
        return true;
    } catch (Exception $e) {
        error_log("Rate limit error: " . $e->getMessage());
        return true; // Permitir em caso de erro
    }
}

// Configurações de monitoramento
function logPerformance($action, $startTime, $memoryStart = null) {
    $duration = microtime(true) - $startTime;
    $memoryUsed = $memoryStart ? memory_get_usage() - $memoryStart : memory_get_usage();
    
    $logEntry = date('Y-m-d H:i:s') . " - $action - Duration: " . number_format($duration, 4) . "s - Memory: " . number_format($memoryUsed / 1024 / 1024, 2) . "MB\n";
    
    $logFile = __DIR__ . '/../logs/performance.log';
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

// Aplicar headers de segurança automaticamente
if (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'tolonipescarias.com.br') !== false) {
    setProductionHeaders();
}

// Configuração de timezone
date_default_timezone_set('America/Sao_Paulo');
?>