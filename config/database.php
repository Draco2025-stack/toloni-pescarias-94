
<?php
require_once __DIR__ . '/environment.php';

// Detectar ambiente
$isProduction = strpos($_SERVER['HTTP_HOST'], 'tolonipescarias.com.br') !== false;

// Configurações de banco de dados baseadas no ambiente
if ($isProduction) {
    // Configurações da Hostinger (via .env)
    define('DB_HOST', getEnvOrDefault('DB_HOST', 'localhost'));
    define('DB_NAME', getEnvOrDefault('DB_NAME'));
    define('DB_USER', getEnvOrDefault('DB_USER'));
    define('DB_PASS', getEnvOrDefault('DB_PASS'));
    define('DB_CHARSET', getEnvOrDefault('DB_CHARSET', 'utf8mb4'));
} else {
    // Configurações de desenvolvimento (via .env)
    define('DB_HOST', getEnvOrDefault('DB_HOST', 'localhost'));
    define('DB_NAME', getEnvOrDefault('DB_NAME', 'toloni_pescarias'));
    define('DB_USER', getEnvOrDefault('DB_USER', 'root'));
    define('DB_PASS', getEnvOrDefault('DB_PASS', ''));
    define('DB_CHARSET', getEnvOrDefault('DB_CHARSET', 'utf8mb4'));
}

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_PERSISTENT => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ];
    
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    error_log("Database connection failed: " . $e->getMessage());
    die("Erro de conexão com o banco de dados. Tente novamente mais tarde.");
}

// Função para executar queries de forma segura
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

// Função para log de segurança
function logSecurityEvent($pdo, $user_id, $action, $details = '') {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    
    $sql = "INSERT INTO security_logs (user_id, action, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?)";
    executeQuery($pdo, $sql, [$user_id, $action, $ip, $user_agent, $details]);
}
?>
