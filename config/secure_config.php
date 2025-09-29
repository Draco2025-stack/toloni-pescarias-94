<?php
/**
 * CONFIGURAÇÃO SEGURA DE CREDENCIAIS
 * Este arquivo valida e carrega configurações sensíveis de forma segura
 */

require_once __DIR__ . '/environment.php';

/**
 * Valida se todas as configurações críticas estão definidas
 */
function validateSecurityConfig() {
    $errors = [];
    $warnings = [];
    
    // Validações críticas
    $required = [
        'JWT_SECRET' => 'Chave JWT é obrigatória',
        'ENCRYPTION_KEY' => 'Chave de criptografia é obrigatória',
        'DB_HOST' => 'Host do banco de dados é obrigatório',
        'DB_NAME' => 'Nome do banco de dados é obrigatório'
    ];
    
    foreach ($required as $key => $message) {
        $value = getEnvOrDefault($key);
        if (empty($value)) {
            $errors[] = $message . " (variável: {$key})";
        }
    }
    
    // Validações de segurança
    $jwt_secret = getEnvOrDefault('JWT_SECRET');
    if ($jwt_secret && (strlen($jwt_secret) < 64 || $jwt_secret === 'change-this-in-production')) {
        $errors[] = 'JWT_SECRET deve ter pelo menos 64 caracteres e ser único';
    }
    
    $encryption_key = getEnvOrDefault('ENCRYPTION_KEY');
    if ($encryption_key && (strlen($encryption_key) < 32 || $encryption_key === 'change-this-in-production')) {
        $errors[] = 'ENCRYPTION_KEY deve ter pelo menos 32 caracteres e ser única';
    }
    
    // Validações de ambiente de produção
    if (isProductionEnvironment()) {
        $prod_required = [
            'SMTP_USERNAME' => 'Usuário SMTP é obrigatório em produção',
            'SMTP_PASSWORD' => 'Senha SMTP é obrigatória em produção',
            'DB_PASS' => 'Senha do banco é obrigatória em produção'
        ];
        
        foreach ($prod_required as $key => $message) {
            $value = getEnvOrDefault($key);
            if (empty($value)) {
                $warnings[] = $message . " (variável: {$key})";
            }
        }
        
        // Verificar HTTPS em produção
        if (!isset($_SERVER['HTTPS']) || $_SERVER['HTTPS'] !== 'on') {
            $warnings[] = 'HTTPS não está ativo em ambiente de produção';
        }
    }
    
    return [
        'errors' => $errors,
        'warnings' => $warnings,
        'is_valid' => empty($errors)
    ];
}

/**
 * Gera chaves seguras para desenvolvimento
 */
function generateSecureKeys() {
    return [
        'jwt_secret' => bin2hex(random_bytes(64)),
        'encryption_key' => bin2hex(random_bytes(32)),
        'password_salt' => bin2hex(random_bytes(32))
    ];
}

/**
 * Log de segurança seguro (sem expor credenciais)
 */
function logSecurityConfigEvent($event, $details = []) {
    $logData = [
        'timestamp' => date('Y-m-d H:i:s'),
        'event' => $event,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ];
    
    // Sanitizar detalhes para não expor credenciais
    foreach ($details as $key => $value) {
        if (stripos($key, 'password') !== false || 
            stripos($key, 'secret') !== false || 
            stripos($key, 'key') !== false || 
            stripos($key, 'token') !== false) {
            $logData[$key] = '[REDACTED]';
        } else {
            $logData[$key] = $value;
        }
    }
    
    $logPath = getAppConfig('log_path') . '/security.log';
    $logEntry = json_encode($logData) . "\n";
    
    if (is_writable(dirname($logPath))) {
        file_put_contents($logPath, $logEntry, FILE_APPEND | LOCK_EX);
    }
}

/**
 * Inicialização segura do sistema
 */
function initializeSecureConfig() {
    $validation = validateSecurityConfig();
    
    // Log da inicialização
    logSecurityConfigEvent('config_validation', [
        'is_production' => isProductionEnvironment(),
        'errors_count' => count($validation['errors']),
        'warnings_count' => count($validation['warnings'])
    ]);
    
    // Em desenvolvimento, exibir erros
    if (!isProductionEnvironment() && !empty($validation['errors'])) {
        echo "<div style='background: #ff6b6b; color: white; padding: 20px; margin: 20px; border-radius: 5px;'>";
        echo "<h3>🔒 Configurações de Segurança Inválidas</h3>";
        foreach ($validation['errors'] as $error) {
            echo "<p>• {$error}</p>";
        }
        echo "<p><strong>Crie o arquivo .env baseado no .env.example</strong></p>";
        echo "</div>";
    }
    
    // Em produção, falhar silenciosamente
    if (isProductionEnvironment() && !$validation['is_valid']) {
        error_log('SECURITY ERROR: Invalid configuration detected');
        http_response_code(500);
        die('Configuração inválida');
    }
    
    return $validation;
}

// Auto-inicialização
$security_validation = initializeSecureConfig();
?>