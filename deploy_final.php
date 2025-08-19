<?php
// Script de verificação final e migração para Hostinger
// Execute este script após fazer o upload para verificar se tudo está funcionando

header('Content-Type: application/json; charset=utf-8');

// Incluir configurações
require_once 'config/database.php';
require_once 'config/admin_config.php';
require_once 'config/session_cookies.php';

function checkSystemStatus() {
    global $pdo;
    $status = [
        'database' => false,
        'admin_user' => false,
        'php_extensions' => [],
        'file_permissions' => [],
        'environment' => 'unknown',
        'errors' => [],
        'warnings' => []
    ];
    
    // 1. Verificar conexão com banco
    try {
        if ($pdo instanceof PDO) {
            $pdo->query('SELECT 1');
            $status['database'] = true;
        }
    } catch (Exception $e) {
        $status['errors'][] = 'Erro de conexão com banco: ' . $e->getMessage();
    }
    
    // 2. Verificar se usuário admin existe
    try {
        $stmt = $pdo->prepare("SELECT id, email, is_admin, email_verified FROM users WHERE email = ?");
        $stmt->execute([ADMIN_EMAIL]);
        $admin = $stmt->fetch();
        
        if ($admin) {
            $status['admin_user'] = [
                'exists' => true,
                'is_admin' => (bool)$admin['is_admin'],
                'email_verified' => (bool)$admin['email_verified']
            ];
            
            if (!$admin['is_admin']) {
                $status['warnings'][] = 'Usuário admin existe mas não tem privilégios de admin';
            }
        } else {
            $status['admin_user'] = ['exists' => false];
            $status['warnings'][] = 'Usuário admin não encontrado - será criado automaticamente no primeiro login';
        }
    } catch (Exception $e) {
        $status['errors'][] = 'Erro ao verificar usuário admin: ' . $e->getMessage();
    }
    
    // 3. Verificar extensões PHP
    $required_extensions = ['pdo_mysql', 'openssl', 'curl', 'json', 'mbstring'];
    foreach ($required_extensions as $ext) {
        $status['php_extensions'][$ext] = extension_loaded($ext);
        if (!extension_loaded($ext)) {
            $status['errors'][] = "Extensão PHP '$ext' não está carregada";
        }
    }
    
    // 4. Verificar permissões de arquivos
    $paths_to_check = [
        'config/' => 'readable',
        'api/' => 'readable',
        'logs/' => 'writable'
    ];
    
    foreach ($paths_to_check as $path => $required_perm) {
        if (file_exists($path)) {
            if ($required_perm === 'writable') {
                $status['file_permissions'][$path] = is_writable($path);
            } else {
                $status['file_permissions'][$path] = is_readable($path);
            }
        } else {
            $status['file_permissions'][$path] = false;
            if ($path === 'logs/' && $required_perm === 'writable') {
                $status['warnings'][] = "Diretório '$path' não existe - criar manualmente";
            }
        }
    }
    
    // 5. Detectar ambiente
    $host = $_SERVER['HTTP_HOST'] ?? 'unknown';
    if (strpos($host, 'localhost') !== false) {
        $status['environment'] = 'development';
    } elseif (strpos($host, 'lovable') !== false) {
        $status['environment'] = 'lovable';
    } elseif (strpos($host, 'tolonipescarias.com.br') !== false) {
        $status['environment'] = 'production';
    }
    
    // 6. Verificações específicas para produção
    if ($status['environment'] === 'production') {
        // Verificar HTTPS
        if (!isset($_SERVER['HTTPS']) || $_SERVER['HTTPS'] !== 'on') {
            $status['warnings'][] = 'HTTPS não está ativo - necessário para cookies seguros';
        }
        
        // Verificar se as chaves de segurança foram alteradas
        if (defined('JWT_SECRET_KEY') && strpos(JWT_SECRET_KEY, 'sua-chave') !== false) {
            $status['errors'][] = 'Chaves de segurança não foram alteradas para produção';
        }
    }
    
    return $status;
}

function runHealthCheck() {
    $health = [
        'timestamp' => date('c'),
        'system_status' => checkSystemStatus(),
        'endpoints_test' => []
    ];
    
    // Testar endpoints principais
    $endpoints = [
        '/api/auth/check-session.php',
        '/api/auth/login.php',
        '/api/auth/register.php'
    ];
    
    foreach ($endpoints as $endpoint) {
        $file_path = ltrim($endpoint, '/');
        $health['endpoints_test'][$endpoint] = file_exists($file_path);
    }
    
    return $health;
}

// Executar verificação
try {
    $result = runHealthCheck();
    
    // Determinar status geral
    $has_errors = !empty($result['system_status']['errors']);
    $has_warnings = !empty($result['system_status']['warnings']);
    
    $result['overall_status'] = $has_errors ? 'error' : ($has_warnings ? 'warning' : 'ok');
    $result['ready_for_production'] = !$has_errors && $result['system_status']['database'] && $result['system_status']['environment'] === 'production';
    
    http_response_code($has_errors ? 500 : 200);
    echo json_encode($result, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'overall_status' => 'error',
        'error' => $e->getMessage(),
        'timestamp' => date('c')
    ], JSON_PRETTY_PRINT);
}
?>