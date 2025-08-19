
<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/security.php';

// Middleware para proteção de rotas admin
function adminMiddleware() {
    startSecureSession();
    
    if (!isLoggedIn()) {
        logSecurityEvent($GLOBALS['pdo'], null, 'UNAUTHORIZED_ADMIN_ACCESS', 'Tentativa de acesso admin sem login');
        header('Location: /auth/login.php?error=login_required');
        exit;
    }
    
    if (!isAdmin()) {
        logSecurityEvent($GLOBALS['pdo'], $_SESSION['user_id'], 'FORBIDDEN_ADMIN_ACCESS', 'Usuário não-admin tentou acessar área administrativa');
        header('HTTP/1.1 403 Forbidden');
        header('Location: /?error=access_denied');
        exit;
    }
    
    // Log de acesso autorizado
    logSecurityEvent($GLOBALS['pdo'], $_SESSION['user_id'], 'ADMIN_ACCESS', 'Acesso à área administrativa autorizado');
}

// Middleware para proteção de rotas de usuário
function userMiddleware() {
    startSecureSession();
    
    if (!isLoggedIn()) {
        header('Location: /auth/login.php?redirect=' . urlencode($_SERVER['REQUEST_URI']));
        exit;
    }
}

// Middleware para verificação de CSRF em formulários
function csrfMiddleware() {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $token = $_POST['csrf_token'] ?? '';
        if (!verifyCSRFToken($token)) {
            logSecurityEvent($GLOBALS['pdo'], $_SESSION['user_id'] ?? null, 'CSRF_ATTACK', 'Token CSRF inválido');
            header('HTTP/1.1 403 Forbidden');
            die('Token de segurança inválido. Recarregue a página e tente novamente.');
        }
    }
}

// Middleware para rate limiting
function rateLimitMiddleware($max_requests = 100, $time_window = 3600) {
    $ip = $_SERVER['REMOTE_ADDR'];
    $cache_key = "rate_limit_" . md5($ip);
    
    // Implementação simples usando arquivos (em produção, usar Redis ou memcached)
    $cache_file = sys_get_temp_dir() . '/' . $cache_key;
    
    if (file_exists($cache_file)) {
        $data = json_decode(file_get_contents($cache_file), true);
        $current_time = time();
        
        if ($current_time - $data['start_time'] < $time_window) {
            if ($data['requests'] >= $max_requests) {
                logSecurityEvent($GLOBALS['pdo'], $_SESSION['user_id'] ?? null, 'RATE_LIMIT_EXCEEDED', "IP: $ip");
                header('HTTP/1.1 429 Too Many Requests');
                die('Muitas requisições. Tente novamente mais tarde.');
            }
            $data['requests']++;
        } else {
            $data = ['start_time' => $current_time, 'requests' => 1];
        }
    } else {
        $data = ['start_time' => time(), 'requests' => 1];
    }
    
    file_put_contents($cache_file, json_encode($data));
}

// Middleware para logs de auditoria automáticos
function auditMiddleware() {
    $action = $_SERVER['REQUEST_METHOD'] . ' ' . $_SERVER['REQUEST_URI'];
    $details = json_encode([
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'referer' => $_SERVER['HTTP_REFERER'] ?? '',
        'query_params' => $_GET,
        'post_data' => array_keys($_POST) // Não logar valores sensíveis
    ]);
    
    logSecurityEvent($GLOBALS['pdo'], $_SESSION['user_id'] ?? null, 'PAGE_ACCESS', $details);
}

// Função para validar e sanitizar entrada de dados
function validateAndSanitizeInput($data, $rules) {
    $cleaned = [];
    $errors = [];
    
    foreach ($rules as $field => $rule) {
        $value = $data[$field] ?? null;
        
        if ($rule['required'] && empty($value)) {
            $errors[$field] = "Campo {$field} é obrigatório";
            continue;
        }
        
        if (!empty($value)) {
            switch ($rule['type']) {
                case 'email':
                    $cleaned[$field] = sanitizeEmail($value);
                    if (!validateEmail($cleaned[$field])) {
                        $errors[$field] = "Email inválido";
                    }
                    break;
                    
                case 'string':
                    $cleaned[$field] = sanitizeString($value);
                    if (isset($rule['max_length']) && strlen($cleaned[$field]) > $rule['max_length']) {
                        $errors[$field] = "Campo {$field} muito longo";
                    }
                    break;
                    
                case 'int':
                    $cleaned[$field] = sanitizeInt($value);
                    if (isset($rule['min']) && $cleaned[$field] < $rule['min']) {
                        $errors[$field] = "Valor mínimo para {$field} é {$rule['min']}";
                    }
                    break;
                    
                case 'url':
                    $cleaned[$field] = sanitizeUrl($value);
                    if (!filter_var($cleaned[$field], FILTER_VALIDATE_URL)) {
                        $errors[$field] = "URL inválida";
                    }
                    break;
                    
                default:
                    $cleaned[$field] = sanitizeString($value);
            }
        }
    }
    
    return ['data' => $cleaned, 'errors' => $errors];
}
?>
