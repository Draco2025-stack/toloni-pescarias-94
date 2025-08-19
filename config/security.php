
<?php
// Headers de segurança obrigatórios
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
header('Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\' https://cdn.jsdelivr.net; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src \'self\' https://fonts.gstatic.com; img-src \'self\' data: https:; media-src \'self\' https:');

// Configurações de segurança
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_samesite', 'Strict');

// Funções de sanitização
function sanitizeString($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

function sanitizeEmail($email) {
    return filter_var(trim($email), FILTER_SANITIZE_EMAIL);
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function sanitizeInt($input) {
    return intval($input);
}

function sanitizeUrl($url) {
    return filter_var($url, FILTER_SANITIZE_URL);
}

// Função para gerar token CSRF
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// Função para verificar token CSRF
function verifyCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

// Função para verificar tentativas de login
function checkLoginAttempts($pdo, $ip) {
    $stmt = $pdo->prepare("SELECT attempts, blocked_until FROM failed_logins WHERE ip_address = ?");
    $stmt->execute([$ip]);
    $result = $stmt->fetch();
    
    if ($result) {
        if ($result['blocked_until'] && new DateTime() < new DateTime($result['blocked_until'])) {
            return false; // Ainda bloqueado
        }
        if ($result['attempts'] >= 5) {
            // Bloquear por 15 minutos
            $blocked_until = (new DateTime())->add(new DateInterval('PT15M'))->format('Y-m-d H:i:s');
            $stmt = $pdo->prepare("UPDATE failed_logins SET blocked_until = ? WHERE ip_address = ?");
            $stmt->execute([$blocked_until, $ip]);
            return false;
        }
    }
    return true;
}

// Função para registrar tentativa falhada
function recordFailedLogin($pdo, $ip, $email = null) {
    $stmt = $pdo->prepare("SELECT id, attempts FROM failed_logins WHERE ip_address = ?");
    $stmt->execute([$ip]);
    $result = $stmt->fetch();
    
    if ($result) {
        $new_attempts = $result['attempts'] + 1;
        $stmt = $pdo->prepare("UPDATE failed_logins SET attempts = ?, email = ?, created_at = NOW() WHERE ip_address = ?");
        $stmt->execute([$new_attempts, $email, $ip]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO failed_logins (ip_address, email, attempts) VALUES (?, ?, 1)");
        $stmt->execute([$ip, $email]);
    }
}

// Função para limpar tentativas de login após sucesso
function clearFailedLogins($pdo, $ip) {
    $stmt = $pdo->prepare("DELETE FROM failed_logins WHERE ip_address = ?");
    $stmt->execute([$ip]);
}

// Função para hash de senha seguro
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

// Função para verificar força da senha
function validatePasswordStrength($password) {
    if (strlen($password) < 8) return false;
    if (!preg_match('/[A-Z]/', $password)) return false;
    if (!preg_match('/[a-z]/', $password)) return false;
    if (!preg_match('/[0-9]/', $password)) return false;
    return true;
}

// Função para validar upload de arquivo
function validateFileUpload($file, $allowed_types = ['image/jpeg', 'image/png', 'video/mp4']) {
    if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
        return ['success' => false, 'message' => 'Erro no upload do arquivo'];
    }
    
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime_type = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mime_type, $allowed_types)) {
        return ['success' => false, 'message' => 'Tipo de arquivo não permitido'];
    }
    
    $max_size = $mime_type === 'video/mp4' ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB para vídeo, 10MB para imagem
    if ($file['size'] > $max_size) {
        return ['success' => false, 'message' => 'Arquivo muito grande'];
    }
    
    return ['success' => true, 'mime_type' => $mime_type];
}

// Função para gerar nome de arquivo seguro
function generateSecureFilename($original_name) {
    $extension = strtolower(pathinfo($original_name, PATHINFO_EXTENSION));
    $allowed_extensions = ['jpg', 'jpeg', 'png', 'mp4'];
    
    if (!in_array($extension, $allowed_extensions)) {
        throw new Exception('Extensão de arquivo não permitida');
    }
    
    return time() . '_' . bin2hex(random_bytes(16)) . '.' . $extension;
}
?>
