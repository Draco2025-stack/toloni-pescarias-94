<?php
// Configuração global de ambiente com carregamento de variáveis de ambiente
// Este arquivo deve ser incluído em todos os pontos de entrada da aplicação

/**
 * Carrega variáveis de ambiente do arquivo .env se existir
 */
function loadEnvironmentVariables() {
    $envFile = __DIR__ . '/../.env';
    
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) {
                continue; // Skip comments
            }
            
            if (strpos($line, '=') !== false) {
                list($name, $value) = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value);
                
                // Remove quotes from value
                $value = trim($value, '"\'');
                
                if (!array_key_exists($name, $_ENV)) {
                    $_ENV[$name] = $value;
                }
            }
        }
    }
}

/**
 * Obtém valor de variável de ambiente com fallback
 */
function getEnvOrDefault($key, $default = null) {
    // Check $_ENV first
    if (isset($_ENV[$key])) {
        return $_ENV[$key];
    }
    
    // Check getenv
    $value = getenv($key);
    if ($value !== false) {
        return $value;
    }
    
    // Check $_SERVER
    if (isset($_SERVER[$key])) {
        return $_SERVER[$key];
    }
    
    return $default;
}

/**
 * Detecta se está em ambiente de produção
 */
function isProductionEnvironment() {
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $env = getEnvOrDefault('APP_ENV', 'development');
    
    return $env === 'production' || 
           strpos($host, 'tolonipescarias.com.br') !== false ||
           strpos($host, '.com') !== false;
}

/**
 * Obtém configuração baseada no ambiente
 */
function getEnvironmentConfig() {
    $isProduction = isProductionEnvironment();
    
    return [
        'is_production' => $isProduction,
        'debug_mode' => !$isProduction,
        'log_level' => $isProduction ? 'error' : 'debug',
        
        // Database
        'db_host' => getEnvOrDefault('DB_HOST', 'localhost'),
        'db_name' => getEnvOrDefault('DB_NAME', 'toloni_db'),
        'db_user' => getEnvOrDefault('DB_USER', 'root'),
        'db_pass' => getEnvOrDefault('DB_PASS', ''),
        'db_charset' => getEnvOrDefault('DB_CHARSET', 'utf8mb4'),
        
        // URLs
        'site_url' => getEnvOrDefault('SITE_URL', $isProduction ? 'https://tolonipescarias.com.br' : 'http://localhost:5173'),
        'api_url' => getEnvOrDefault('API_URL', $isProduction ? 'https://tolonipescarias.com.br/api' : 'http://localhost:5173/api'),
        
        // SMTP
        'smtp_host' => getEnvOrDefault('SMTP_HOST', 'smtp.hostinger.com'),
        'smtp_port' => (int)getEnvOrDefault('SMTP_PORT', '587'),
        'smtp_username' => getEnvOrDefault('SMTP_USERNAME', ''),
        'smtp_password' => getEnvOrDefault('SMTP_PASSWORD', ''),
        'smtp_from_email' => getEnvOrDefault('SMTP_FROM_EMAIL', 'noreply@tolonipescarias.com.br'),
        'smtp_from_name' => getEnvOrDefault('SMTP_FROM_NAME', 'Toloni Pescarias'),
        
        // Security
        'jwt_secret' => getEnvOrDefault('JWT_SECRET', 'change-this-in-production'),
        'encryption_key' => getEnvOrDefault('ENCRYPTION_KEY', 'change-this-in-production'),
        
        // Upload
        'upload_max_size' => (int)getEnvOrDefault('UPLOAD_MAX_SIZE', '10485760'), // 10MB
        'upload_allowed_types' => explode(',', getEnvOrDefault('UPLOAD_ALLOWED_TYPES', 'jpg,jpeg,png,gif,webp')),
        
        // Session
        'session_lifetime' => (int)getEnvOrDefault('SESSION_LIFETIME', '604800'), // 7 days
        'cookie_domain' => getEnvOrDefault('COOKIE_DOMAIN', $isProduction ? '.tolonipescarias.com.br' : ''),
        'cookie_secure' => $isProduction,
        
        // Admin
        'admin_email' => getEnvOrDefault('ADMIN_EMAIL', 'admin@tolonipescarias.com.br'),
        
        // Paths
        'upload_path' => getEnvOrDefault('UPLOAD_PATH', __DIR__ . '/../uploads'),
        'log_path' => getEnvOrDefault('LOG_PATH', __DIR__ . '/../logs'),
        'backup_path' => getEnvOrDefault('BACKUP_PATH', __DIR__ . '/../backups'),
    ];
}

// Auto-load environment variables
loadEnvironmentVariables();

// Make config globally available
$GLOBALS['app_config'] = getEnvironmentConfig();

/**
 * Helper function to get app config
 */
function getAppConfig($key = null) {
    if ($key === null) {
        return $GLOBALS['app_config'];
    }
    
    return $GLOBALS['app_config'][$key] ?? null;
}
?>