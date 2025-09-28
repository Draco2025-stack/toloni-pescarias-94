<?php
require_once __DIR__ . '/../../config/environment.php';
require_once __DIR__ . '/../../config/cors_unified.php';
require_once __DIR__ . '/../../config/session_cookies.php';
require_once __DIR__ . '/../middleware/auth.php';

// Verificar se é admin
requireAdmin();

try {
    $config = getAppConfig();
    
    // Conectar ao banco
    $dsn = "mysql:host={$config['db_host']};dbname={$config['db_name']};charset={$config['db_charset']}";
    $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    // Coletar informações do sistema
    $systemInfo = [
        'timestamp' => date('Y-m-d H:i:s'),
        'server' => [
            'php_version' => PHP_VERSION,
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size')
        ],
        'database' => [
            'status' => 'connected',
            'host' => $config['db_host'],
            'name' => $config['db_name']
        ],
        'environment' => [
            'is_production' => $config['is_production'],
            'debug_mode' => $config['debug_mode'],
            'site_url' => $config['site_url'],
            'api_url' => $config['api_url']
        ],
        'storage' => [],
        'security' => [],
        'performance' => []
    ];
    
    // Verificar versão do MySQL
    try {
        $stmt = $pdo->query("SELECT VERSION() as version");
        $result = $stmt->fetch();
        $systemInfo['database']['version'] = $result['version'];
    } catch (Exception $e) {
        $systemInfo['database']['version_error'] = $e->getMessage();
    }
    
    // Verificar contadores de tabelas principais
    try {
        $tables = ['users', 'reports', 'comments', 'locations', 'carousels'];
        $counts = [];
        
        foreach ($tables as $table) {
            try {
                $stmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
                $result = $stmt->fetch();
                $counts[$table] = (int)$result['count'];
            } catch (Exception $e) {
                $counts[$table] = 'error: ' . $e->getMessage();
            }
        }
        
        $systemInfo['database']['table_counts'] = $counts;
    } catch (Exception $e) {
        $systemInfo['database']['table_counts_error'] = $e->getMessage();
    }
    
    // Verificar espaço em disco
    $uploadPath = $config['upload_path'];
    if (is_dir($uploadPath)) {
        $totalSpace = disk_total_space($uploadPath);
        $freeSpace = disk_free_space($uploadPath);
        $usedSpace = $totalSpace - $freeSpace;
        
        $systemInfo['storage'] = [
            'upload_path' => $uploadPath,
            'total_space' => $totalSpace ? formatBytes($totalSpace) : 'Unknown',
            'free_space' => $freeSpace ? formatBytes($freeSpace) : 'Unknown',
            'used_space' => $usedSpace ? formatBytes($usedSpace) : 'Unknown',
            'usage_percent' => $totalSpace ? round(($usedSpace / $totalSpace) * 100, 2) : 0
        ];
    } else {
        $systemInfo['storage']['error'] = 'Upload directory not found: ' . $uploadPath;
    }
    
    // Verificar logs recentes
    $logPath = $config['log_path'];
    if (is_dir($logPath)) {
        $errorLogFile = $logPath . '/error.log';
        $securityLogFile = $logPath . '/security.log';
        
        $systemInfo['security']['logs'] = [
            'error_log_exists' => file_exists($errorLogFile),
            'error_log_size' => file_exists($errorLogFile) ? formatBytes(filesize($errorLogFile)) : 'N/A',
            'security_log_exists' => file_exists($securityLogFile),
            'security_log_size' => file_exists($securityLogFile) ? formatBytes(filesize($securityLogFile)) : 'N/A'
        ];
        
        // Contar erros recentes (últimas 24h)
        if (file_exists($errorLogFile)) {
            $recentErrors = countRecentLogEntries($errorLogFile, 24);
            $systemInfo['security']['recent_errors_24h'] = $recentErrors;
        }
    }
    
    // Verificar status dos serviços críticos
    $systemInfo['services'] = [
        'smtp_configured' => !empty($config['smtp_username']) && !empty($config['smtp_password']),
        'uploads_writable' => is_writable($uploadPath),
        'logs_writable' => is_writable($logPath),
        'session_active' => session_status() === PHP_SESSION_ACTIVE
    ];
    
    // Verificar memória atual
    $systemInfo['performance'] = [
        'memory_usage' => formatBytes(memory_get_usage(true)),
        'memory_peak' => formatBytes(memory_get_peak_usage(true)),
        'load_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']
    ];
    
    // Alertas críticos
    $alerts = [];
    
    // Verificar uso de disco
    if (isset($systemInfo['storage']['usage_percent']) && $systemInfo['storage']['usage_percent'] > 90) {
        $alerts[] = [
            'level' => 'critical',
            'message' => 'Espaço em disco baixo: ' . $systemInfo['storage']['usage_percent'] . '% usado'
        ];
    }
    
    // Verificar erros recentes
    if (isset($systemInfo['security']['recent_errors_24h']) && $systemInfo['security']['recent_errors_24h'] > 100) {
        $alerts[] = [
            'level' => 'warning',
            'message' => 'Muitos erros nas últimas 24h: ' . $systemInfo['security']['recent_errors_24h']
        ];
    }
    
    // Verificar serviços
    foreach ($systemInfo['services'] as $service => $status) {
        if (!$status) {
            $alerts[] = [
                'level' => 'warning',
                'message' => "Serviço com problema: $service"
            ];
        }
    }
    
    $systemInfo['alerts'] = $alerts;
    $systemInfo['status'] = empty($alerts) ? 'healthy' : 'warning';
    
    // Se houver alertas críticos, enviar email
    $criticalAlerts = array_filter($alerts, function($alert) {
        return $alert['level'] === 'critical';
    });
    
    if (!empty($criticalAlerts) && function_exists('sendEmail')) {
        $subject = 'ALERTA CRÍTICO - Sistema Toloni Pescarias';
        $body = "Alertas críticos detectados no sistema:\n\n";
        
        foreach ($criticalAlerts as $alert) {
            $body .= "• " . $alert['message'] . "\n";
        }
        
        $body .= "\nVerifique: " . $config['site_url'] . "/api/admin/system-status.php";
        
        try {
            sendEmail($config['admin_email'], $subject, $body, false);
        } catch (Exception $e) {
            error_log("Failed to send critical alert email: " . $e->getMessage());
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $systemInfo
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    error_log("System status error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $config['debug_mode'] ? $e->getMessage() : 'System status check failed'
    ]);
}

/**
 * Formatar bytes em formato legível
 */
function formatBytes($bytes, $precision = 2) {
    $units = array('B', 'KB', 'MB', 'GB', 'TB');
    
    for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
        $bytes /= 1024;
    }
    
    return round($bytes, $precision) . ' ' . $units[$i];
}

/**
 * Contar entradas de log recentes
 */
function countRecentLogEntries($logFile, $hours = 24) {
    if (!file_exists($logFile)) {
        return 0;
    }
    
    $cutoffTime = time() - ($hours * 3600);
    $count = 0;
    
    $handle = fopen($logFile, 'r');
    if ($handle) {
        while (($line = fgets($handle)) !== false) {
            // Assumir formato de log: [YYYY-MM-DD HH:II:SS] ...
            if (preg_match('/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/', $line, $matches)) {
                $logTime = strtotime($matches[1]);
                if ($logTime >= $cutoffTime) {
                    $count++;
                }
            }
        }
        fclose($handle);
    }
    
    return $count;
}
?>