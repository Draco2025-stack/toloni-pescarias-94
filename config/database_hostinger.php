<?php
/**
 * Configuração de banco de dados unificada para Hostinger
 * Detecta automaticamente ambiente (desenvolvimento/produção)
 */

// Detectar ambiente baseado no domínio
$isProduction = (
    isset($_SERVER['HTTP_HOST']) && 
    (strpos($_SERVER['HTTP_HOST'], 'tolonipescarias.com.br') !== false ||
     strpos($_SERVER['HTTP_HOST'], 'tolonipescarias.com') !== false)
);

if ($isProduction) {
    // ====================================
    // PRODUÇÃO - HOSTINGER
    // ====================================
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'u123456789_toloni');    // ALTERAR: nome real do banco
    define('DB_USER', 'u123456789_user');      // ALTERAR: usuário real  
    define('DB_PASS', 'SuaSenhaSegura123!');   // ALTERAR: senha real
    define('DB_CHARSET', 'utf8mb4');
    
    // URLs de produção
    define('SITE_URL', 'https://tolonipescarias.com.br');
    define('API_BASE_URL', 'https://tolonipescarias.com.br/api');
    
} else {
    // ====================================
    // DESENVOLVIMENTO
    // ====================================
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'toloni_pescarias');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('DB_CHARSET', 'utf8mb4');
    
    // URLs de desenvolvimento
    define('SITE_URL', 'http://localhost:8080');
    define('API_BASE_URL', 'http://localhost:8080/api');
}

// ====================================
// CONEXÃO PDO SEGURA
// ====================================
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_PERSISTENT => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET . " COLLATE " . DB_CHARSET . "_unicode_ci"
    ];
    
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    error_log("Database connection failed: " . $e->getMessage());
    
    // Em desenvolvimento, mostrar erro detalhado
    if (!$isProduction) {
        die("Erro de conexão: " . $e->getMessage());
    } else {
        die("Erro interno do servidor. Tente novamente mais tarde.");
    }
}

// ====================================
// FUNÇÕES AUXILIARES
// ====================================

/**
 * Executar query de forma segura
 */
function executeQuery($pdo, $sql, $params = []) {
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    } catch (PDOException $e) {
        error_log("Query error: " . $e->getMessage() . " | SQL: " . $sql);
        throw $e;
    }
}

/**
 * Log de eventos de segurança
 */
function logSecurityEvent($pdo, $user_id, $action, $details = '') {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    
    $sql = "INSERT INTO security_logs (user_id, action, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?)";
    try {
        executeQuery($pdo, $sql, [$user_id, $action, $ip, $user_agent, $details]);
    } catch (PDOException $e) {
        error_log("Security log error: " . $e->getMessage());
    }
}

/**
 * Verificar se estamos em produção
 */
function isProduction() {
    global $isProduction;
    return $isProduction;
}

/**
 * Get base URL
 */
function getBaseURL() {
    return defined('SITE_URL') ? SITE_URL : 'http://localhost:8080';
}

/**
 * Get API base URL
 */
function getAPIBaseURL() {
    return defined('API_BASE_URL') ? API_BASE_URL : 'http://localhost:8080/api';
}
?>