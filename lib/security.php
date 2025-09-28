<?php
/**
 * Biblioteca de Segurança Avançada - Toloni Pescarias
 * Rate limiting, validação de entrada, CSRF e monitoramento
 */

require_once __DIR__ . '/../config/database_hostinger.php';
require_once __DIR__ . '/response.php';

/**
 * Rate Limiting baseado em banco de dados
 */
class RateLimiter {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function checkLimit($identifier, $maxRequests = 60, $windowMinutes = 1): bool {
        try {
            // Limpar registros antigos
            $this->cleanup($windowMinutes);
            
            // Contar requisições no período
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) FROM rate_limits 
                WHERE identifier = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)
            ");
            $stmt->execute([$identifier, $windowMinutes]);
            $count = $stmt->fetchColumn();
            
            if ($count >= $maxRequests) {
                return false;
            }
            
            // Registrar esta requisição
            $stmt = $this->pdo->prepare("INSERT INTO rate_limits (identifier) VALUES (?)");
            $stmt->execute([$identifier]);
            
            return true;
        } catch (Exception $e) {
            error_log("Rate limit error: " . $e->getMessage());
            return true; // Em caso de erro, permitir (fail-open)
        }
    }
    
    private function cleanup($windowMinutes): void {
        try {
            $stmt = $this->pdo->prepare("
                DELETE FROM rate_limits 
                WHERE created_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)
            ");
            $stmt->execute([$windowMinutes * 2]); // Manter o dobro do período
        } catch (Exception $e) {
            error_log("Rate limit cleanup error: " . $e->getMessage());
        }
    }
}

/**
 * Middleware de Rate Limiting
 */
function checkRateLimit($endpoint, $maxRequests = 60, $windowMinutes = 1): void {
    global $pdo;
    
    $rateLimiter = new RateLimiter($pdo);
    $identifier = getUserIdentifier() . ":$endpoint";
    
    if (!$rateLimiter->checkLimit($identifier, $maxRequests, $windowMinutes)) {
        http_response_code(429);
        header('Retry-After: ' . ($windowMinutes * 60));
        json_error('Muitas tentativas. Tente novamente em alguns minutos.', 429);
    }
}

/**
 * Obter identificador único do usuário (IP + User-Agent hash)
 */
function getUserIdentifier(): string {
    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    return hash('sha256', $ip . ':' . $userAgent);
}

/**
 * Validação de entrada robusta
 */
class InputValidator {
    public static function validateString($input, $maxLength = 255, $required = true): ?string {
        if ($input === null || $input === '') {
            return $required ? null : '';
        }
        
        $cleaned = trim(strip_tags($input));
        return strlen($cleaned) <= $maxLength ? $cleaned : null;
    }
    
    public static function validateEmail($email): ?string {
        $email = filter_var($email, FILTER_VALIDATE_EMAIL);
        return $email && strlen($email) <= 255 ? $email : null;
    }
    
    public static function validateInt($input, $min = null, $max = null): ?int {
        $value = filter_var($input, FILTER_VALIDATE_INT);
        if ($value === false) return null;
        
        if ($min !== null && $value < $min) return null;
        if ($max !== null && $value > $max) return null;
        
        return $value;
    }
    
    public static function validateFloat($input, $min = null, $max = null): ?float {
        $value = filter_var($input, FILTER_VALIDATE_FLOAT);
        if ($value === false) return null;
        
        if ($min !== null && $value < $min) return null;
        if ($max !== null && $value > $max) return null;
        
        return $value;
    }
    
    public static function validateArray($input, $maxItems = 100): ?array {
        if (!is_array($input)) return null;
        return count($input) <= $maxItems ? $input : null;
    }
}

/**
 * CSRF Protection
 */
class CSRFProtection {
    public static function generateToken(): string {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        
        return $_SESSION['csrf_token'];
    }
    
    public static function validateToken($token): bool {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
    }
    
    public static function requireValidToken(): void {
        $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
        
        if (!$token || !self::validateToken($token)) {
            json_error('Token CSRF inválido ou ausente', 403);
        }
    }
}

/**
 * Monitoramento de Performance
 */
class PerformanceMonitor {
    private static $startTime;
    private static $startMemory;
    
    public static function start(): void {
        self::$startTime = microtime(true);
        self::$startMemory = memory_get_usage(true);
    }
    
    public static function end($action, $userId = null): void {
        global $pdo;
        
        try {
            $duration = microtime(true) - self::$startTime;
            $memory = memory_get_usage(true) - self::$startMemory;
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            
            $stmt = $pdo->prepare("
                INSERT INTO performance_logs (action, duration, memory_usage, user_id, ip_address) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$action, $duration, $memory, $userId, $ip]);
            
            // Log para alertas se performance ruim
            if ($duration > 2.0) {
                error_log("SLOW_QUERY: $action took {$duration}s");
            }
            
            if ($memory > 50 * 1024 * 1024) { // 50MB
                error_log("HIGH_MEMORY: $action used " . number_format($memory / 1024 / 1024, 2) . "MB");
            }
            
        } catch (Exception $e) {
            error_log("Performance monitoring error: " . $e->getMessage());
        }
    }
}

/**
 * Middleware principal de segurança
 */
function securityMiddleware($endpoint, $options = []): void {
    // Iniciar monitoramento
    PerformanceMonitor::start();
    
    // Rate limiting
    $maxRequests = $options['rate_limit'] ?? 60;
    $windowMinutes = $options['rate_window'] ?? 1;
    checkRateLimit($endpoint, $maxRequests, $windowMinutes);
    
    // CSRF para operações de escrita
    if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'DELETE']) && !($options['skip_csrf'] ?? false)) {
        CSRFProtection::requireValidToken();
    }
    
    // Validar método HTTP
    $allowedMethods = $options['methods'] ?? ['GET', 'POST', 'PUT', 'DELETE'];
    if (!in_array($_SERVER['REQUEST_METHOD'], $allowedMethods)) {
        json_error('Método HTTP não permitido', 405);
    }
}

/**
 * Finalizar monitoramento ao término da requisição
 */
function finishSecurityMonitoring($action, $userId = null): void {
    PerformanceMonitor::end($action, $userId);
}

/**
 * Sanitização SQL adicional
 */
function prepareSafeQuery($pdo, $sql, $params = []): PDOStatement {
    try {
        $stmt = $pdo->prepare($sql);
        
        // Log queries suspeitas
        if (preg_match('/\b(union|select|insert|update|delete|drop|create|alter)\b/i', implode(' ', $params))) {
            error_log("SUSPICIOUS_QUERY: Potential SQL injection attempt");
            logSecurityEvent($pdo, null, 'SUSPICIOUS_QUERY', 'Params: ' . json_encode($params));
        }
        
        return $stmt;
    } catch (Exception $e) {
        error_log("SQL preparation error: " . $e->getMessage());
        throw $e;
    }
}
?>