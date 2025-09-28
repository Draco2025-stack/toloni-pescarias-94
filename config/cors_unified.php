<?php
/**
 * CONFIGURAÇÃO CORS UNIFICADA
 * Para funcionar em desenvolvimento e produção
 */

// ====================================
// LOGGING CENTRALIZADO
// ====================================
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Criar pasta logs se não existir
$logsDir = __DIR__ . '/../logs';
if (!is_dir($logsDir)) {
    mkdir($logsDir, 0755, true);
}

// Configurar arquivo de log diário
ini_set('error_log', $logsDir . '/app-' . date('Y-m-d') . '.log');
error_reporting(E_ALL);

// Detectar ambiente
$isProduction = (
    isset($_SERVER['HTTP_HOST']) && 
    (strpos($_SERVER['HTTP_HOST'], 'tolonipescarias.com.br') !== false ||
     strpos($_SERVER['HTTP_HOST'], 'tolonipescarias.com') !== false)
);

if ($isProduction) {
    // ====================================
    // PRODUÇÃO - CORS RESTRITIVO
    // ====================================
    $allowedOrigins = [
        'https://tolonipescarias.com.br',
        'https://www.tolonipescarias.com.br'
    ];
    
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header('Access-Control-Allow-Origin: https://tolonipescarias.com.br');
    }
    
} else {
    // ====================================
    // DESENVOLVIMENTO - CORS PERMISSIVO
    // ====================================
    $allowedOrigins = [
        'http://localhost:8080',
        'https://localhost:8080',
        'http://127.0.0.1:8080',
        'https://127.0.0.1:8080'
    ];
    
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    // Permitir IPs locais da rede (192.168.x.x)
    if (preg_match('/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d+$/', $origin)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    // Permitir origens conhecidas
    elseif (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    // Permitir Lovable preview
    elseif (strpos($origin, 'lovable') !== false) {
        header("Access-Control-Allow-Origin: $origin");
    }
    else {
        header('Access-Control-Allow-Origin: *');
    }
}

// ====================================
// HEADERS CORS COMUNS
// ====================================
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400'); // 24 horas

// ====================================
// HEADERS DE SEGURANÇA
// ====================================
if ($isProduction) {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: https:; font-src \'self\' data:');
}

// ====================================
// TRATAR OPTIONS (PREFLIGHT)
// ====================================
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ====================================
// HEADERS DE RESPOSTA JSON
// ====================================
header('Content-Type: application/json; charset=utf-8');

/**
 * Enviar resposta JSON padronizada
 */
function sendJsonResponse($success, $data = null, $error = null, $httpCode = 200) {
    http_response_code($httpCode);
    
    $response = [
        'success' => $success,
        'data' => $data,
        'timestamp' => date('c')
    ];
    
    if ($error) {
        $response['error'] = $error;
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Enviar erro padronizado
 */
function sendError($code, $message, $httpCode = 400, $details = null) {
    $error = [
        'code' => $code,
        'message' => $message
    ];
    
    if ($details) {
        $error['details'] = $details;
    }
    
    sendJsonResponse(false, null, $error, $httpCode);
}

/**
 * Validar método HTTP
 */
function requireMethod($method) {
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        sendError('METHOD_NOT_ALLOWED', 'Método não permitido', 405);
    }
}

/**
 * Validar autenticação
 */
function requireAuth() {
    global $pdo;
    
    require_once __DIR__ . '/session_cookies.php';
    
    $user = validateSession($pdo);
    if (!$user) {
        sendError('UNAUTHORIZED', 'Autenticação necessária', 401);
    }
    
    return $user;
}

/**
 * Validar admin
 */
function requireAdmin() {
    $user = requireAuth();
    
    if (!$user['is_admin']) {
        sendError('FORBIDDEN', 'Privilégios de administrador necessários', 403);
    }
    
    return $user;
}
?>