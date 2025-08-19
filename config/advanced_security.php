<?php
// ===============================================
// SISTEMA DE SEGURANÇA AVANÇADA - 8 CAMADAS
// ===============================================

require_once 'database.php';
require_once 'security.php';

// 1. SISTEMA DE AUTENTICAÇÃO 2FA
class TwoFactorAuth {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function generateSecret(): string {
        return substr(str_replace(['+', '/', '='], ['', '', ''], base64_encode(random_bytes(20))), 0, 32);
    }
    
    public function generateQRCode($secret, $email): string {
        $appName = urlencode('Toloni Pescarias');
        $email = urlencode($email);
        return "otpauth://totp/{$appName}:{$email}?secret={$secret}&issuer={$appName}";
    }
    
    public function enable2FA($userId, $secret): bool {
        $backupCodes = $this->generateBackupCodes();
        $sql = "INSERT INTO user_2fa (user_id, secret, backup_codes, is_enabled) VALUES (?, ?, ?, 1) 
                ON DUPLICATE KEY UPDATE secret=?, backup_codes=?, is_enabled=1";
        return executeQuery($this->pdo, $sql, [$userId, $secret, json_encode($backupCodes), $secret, json_encode($backupCodes)]);
    }
    
    public function verifyTOTP($userId, $code): bool {
        $user2fa = $this->get2FAData($userId);
        if (!$user2fa || !$user2fa['is_enabled']) return false;
        
        $window = 1; // ±1 período de 30s
        $timestamp = floor(time() / 30);
        
        for ($i = -$window; $i <= $window; $i++) {
            if ($this->generateTOTP($user2fa['secret'], $timestamp + $i) === $code) {
                $this->log2FAAttempt($userId, true, 'totp');
                return true;
            }
        }
        
        $this->log2FAAttempt($userId, false, 'totp');
        return false;
    }
    
    private function generateTOTP($secret, $timestamp): string {
        $key = base32_decode($secret);
        $data = pack('N*', 0, $timestamp);
        $hash = hash_hmac('sha1', $data, $key, true);
        $offset = ord($hash[19]) & 0xf;
        $code = ((ord($hash[$offset]) & 0x7f) << 24) |
                ((ord($hash[$offset + 1]) & 0xff) << 16) |
                ((ord($hash[$offset + 2]) & 0xff) << 8) |
                (ord($hash[$offset + 3]) & 0xff);
        return sprintf('%06d', $code % 1000000);
    }
    
    private function generateBackupCodes(): array {
        $codes = [];
        for ($i = 0; $i < 10; $i++) {
            $codes[] = strtoupper(substr(str_replace(['+', '/', '='], ['', '', ''], base64_encode(random_bytes(6))), 0, 8));
        }
        return $codes;
    }
    
    private function get2FAData($userId) {
        $sql = "SELECT * FROM user_2fa WHERE user_id = ?";
        $stmt = executeQuery($this->pdo, $sql, [$userId]);
        return $stmt->fetch();
    }
    
    private function log2FAAttempt($userId, $success, $type) {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        $sql = "INSERT INTO two_fa_logs (user_id, ip_address, success, code_type, user_agent) VALUES (?, ?, ?, ?, ?)";
        executeQuery($this->pdo, $sql, [$userId, $ip, $success, $type, $userAgent]);
    }
}

// 2. SISTEMA DE CRIPTOGRAFIA AVANÇADA
class AdvancedEncryption {
    private $algorithm = 'AES-256-GCM';
    private $keyFile = __DIR__ . '/../.encryption_keys';
    
    public function encryptData($data, $keyName = 'default'): array {
        $key = $this->getOrCreateKey($keyName);
        $iv = random_bytes(16);
        $tag = '';
        $encrypted = openssl_encrypt($data, $this->algorithm, $key, OPENSSL_RAW_DATA, $iv, $tag);
        
        return [
            'data' => base64_encode($encrypted),
            'iv' => base64_encode($iv),
            'tag' => base64_encode($tag),
            'key_name' => $keyName
        ];
    }
    
    public function decryptData($encryptedArray): string {
        $key = $this->getKey($encryptedArray['key_name']);
        return openssl_decrypt(
            base64_decode($encryptedArray['data']),
            $this->algorithm,
            $key,
            OPENSSL_RAW_DATA,
            base64_decode($encryptedArray['iv']),
            base64_decode($encryptedArray['tag'])
        );
    }
    
    private function getOrCreateKey($keyName): string {
        $keys = $this->loadKeys();
        if (!isset($keys[$keyName])) {
            $keys[$keyName] = base64_encode(random_bytes(32));
            $this->saveKeys($keys);
        }
        return base64_decode($keys[$keyName]);
    }
    
    private function getKey($keyName): string {
        $keys = $this->loadKeys();
        return base64_decode($keys[$keyName] ?? '');
    }
    
    private function loadKeys(): array {
        if (!file_exists($this->keyFile)) return [];
        return json_decode(file_get_contents($this->keyFile), true) ?: [];
    }
    
    private function saveKeys($keys): void {
        file_put_contents($this->keyFile, json_encode($keys));
        chmod($this->keyFile, 0600);
    }
}

// 3. SISTEMA HONEYPOT
class HoneypotSystem {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function generateHoneypotField($name = 'website'): string {
        return "<input type='text' name='{$name}' style='display:none !important;' tabindex='-1' autocomplete='off'>";
    }
    
    public function checkHoneypot($fieldName = 'website'): bool {
        if (!empty($_POST[$fieldName])) {
            $this->logHoneypotTrap('field', $fieldName, $_POST[$fieldName]);
            $this->blockIP();
            return false;
        }
        return true;
    }
    
    public function generateHoneypotLink(): string {
        return "<a href='/admin-secret-login' style='display:none;'>Admin</a>";
    }
    
    private function logHoneypotTrap($type, $name, $data = '') {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        $sql = "INSERT INTO honeypot_logs (ip_address, user_agent, trap_type, trap_name, submitted_data) VALUES (?, ?, ?, ?, ?)";
        executeQuery($this->pdo, $sql, [$ip, $userAgent, $type, $name, $data]);
    }
    
    private function blockIP() {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $sql = "UPDATE honeypot_logs SET is_blocked = 1 WHERE ip_address = ?";
        executeQuery($this->pdo, $sql, [$ip]);
        
        // Adicionar à lista negra temporária
        file_put_contents(__DIR__ . '/../.blocked_ips', $ip . "\n", FILE_APPEND | LOCK_EX);
    }
}

// 4. SISTEMA DE WHITELIST IP ADMIN
class IPWhitelist {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function isAdminIPAllowed(): bool {
        if (!$this->isWhitelistEnabled()) return true;
        
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $sql = "SELECT COUNT(*) FROM admin_ip_whitelist WHERE ip_address = ? AND is_active = 1";
        $stmt = executeQuery($this->pdo, $sql, [$ip]);
        
        $allowed = $stmt->fetchColumn() > 0;
        if ($allowed) {
            $this->updateLastUsed($ip);
        }
        
        return $allowed;
    }
    
    public function addIP($ip, $description, $userId): bool {
        $sql = "INSERT INTO admin_ip_whitelist (ip_address, description, created_by) VALUES (?, ?, ?)";
        return executeQuery($this->pdo, $sql, [$ip, $description, $userId]);
    }
    
    private function isWhitelistEnabled(): bool {
        $sql = "SELECT setting_value FROM system_settings WHERE setting_key = 'security_ip_whitelist_enabled'";
        $stmt = executeQuery($this->pdo, $sql);
        return $stmt->fetchColumn() === '1';
    }
    
    private function updateLastUsed($ip) {
        $sql = "UPDATE admin_ip_whitelist SET last_used = NOW() WHERE ip_address = ?";
        executeQuery($this->pdo, $sql, [$ip]);
    }
}

// 5. SISTEMA DE BACKUP AUTOMÁTICO
class AutoBackup {
    private $pdo;
    private $encryption;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->encryption = new AdvancedEncryption();
    }
    
    public function createDatabaseBackup(): array {
        $backupFile = $this->generateBackupPath('database');
        $this->logBackupStart('database', $backupFile);
        
        try {
            $command = sprintf(
                'mysqldump --host=%s --user=%s --password=%s %s > %s',
                DB_HOST, DB_USER, DB_PASS, DB_NAME, $backupFile
            );
            exec($command, $output, $returnVar);
            
            if ($returnVar === 0) {
                $checksum = hash_file('sha256', $backupFile);
                $fileSize = filesize($backupFile);
                
                // Criptografar backup
                $encryptedFile = $backupFile . '.enc';
                $this->encryptFile($backupFile, $encryptedFile);
                unlink($backupFile);
                
                $this->logBackupComplete('database', $encryptedFile, $fileSize, $checksum);
                return ['success' => true, 'file' => $encryptedFile];
            }
        } catch (Exception $e) {
            $this->logBackupError('database', $backupFile, $e->getMessage());
        }
        
        return ['success' => false];
    }
    
    private function generateBackupPath($type): string {
        $backupDir = __DIR__ . '/../backups';
        if (!is_dir($backupDir)) mkdir($backupDir, 0700, true);
        return $backupDir . '/' . $type . '_' . date('Y-m-d_H-i-s') . '.sql';
    }
    
    private function encryptFile($source, $destination) {
        $data = file_get_contents($source);
        $encrypted = $this->encryption->encryptData($data, 'backup');
        file_put_contents($destination, json_encode($encrypted));
    }
    
    private function logBackupStart($type, $file) {
        $sql = "INSERT INTO backup_logs (backup_type, file_path, status) VALUES (?, ?, 'started')";
        executeQuery($this->pdo, $sql, [$type, $file]);
    }
    
    private function logBackupComplete($type, $file, $size, $checksum) {
        $sql = "UPDATE backup_logs SET status = 'completed', file_size = ?, checksum = ?, completed_at = NOW() WHERE file_path = ?";
        executeQuery($this->pdo, $sql, [$size, $checksum, $file]);
    }
    
    private function logBackupError($type, $file, $error) {
        $sql = "UPDATE backup_logs SET status = 'failed', error_message = ? WHERE file_path = ?";
        executeQuery($this->pdo, $sql, [$error, $file]);
    }
}

// Função para base32_decode (necessária para TOTP)
function base32_decode($input) {
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $input = strtoupper($input);
    $output = '';
    $bitsLeft = 0;
    $left = 0;
    
    for ($i = 0; $i < strlen($input); $i++) {
        $val = strpos($alphabet, $input[$i]);
        if ($val === false) continue;
        
        $left = ($left << 5) | $val;
        $bitsLeft += 5;
        
        if ($bitsLeft >= 8) {
            $output .= chr(($left >> ($bitsLeft - 8)) & 255);
            $bitsLeft -= 8;
        }
    }
    
    return $output;
}

// Instanciar classes globalmente
global $twoFA, $encryption, $honeypot, $ipWhitelist, $autoBackup;
$twoFA = new TwoFactorAuth($pdo);
$encryption = new AdvancedEncryption();
$honeypot = new HoneypotSystem($pdo);
$ipWhitelist = new IPWhitelist($pdo);
$autoBackup = new AutoBackup($pdo);
?>