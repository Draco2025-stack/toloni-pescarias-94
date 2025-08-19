<?php
// ===============================================
// SISTEMAS DE SEGURANÇA AVANÇADA (CONTINUAÇÃO)
// WAF, INTEGRIDADE E AUDITORIA
// ===============================================

require_once 'database.php';

// 6. SISTEMA DE MONITORAMENTO DE INTEGRIDADE
class FileIntegrityMonitor {
    private $pdo;
    private $criticalFiles = [
        'config/database.php',
        'config/security.php',
        'config/session.php',
        'includes/middleware.php',
        'auth/login.php',
        'auth/register.php',
        'index.php',
        '.htaccess'
    ];
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function initializeIntegrityCheck(): void {
        foreach ($this->criticalFiles as $file) {
            if (file_exists($file)) {
                $this->addFileToMonitoring($file, true);
            }
        }
    }
    
    public function checkFileIntegrity(): array {
        $alerts = [];
        $sql = "SELECT * FROM file_integrity WHERE is_critical = 1";
        $stmt = executeQuery($this->pdo, $sql);
        
        while ($fileRecord = $stmt->fetch()) {
            $filePath = $fileRecord['file_path'];
            
            if (!file_exists($filePath)) {
                $this->createIntegrityAlert($fileRecord['id'], 'deleted', 'Arquivo crítico foi deletado');
                $alerts[] = "CRÍTICO: Arquivo deletado - {$filePath}";
                continue;
            }
            
            $currentHash = hash_file('sha256', $filePath);
            $currentSize = filesize($filePath);
            $currentModified = filemtime($filePath);
            
            if ($currentHash !== $fileRecord['file_hash']) {
                $this->createIntegrityAlert($fileRecord['id'], 'modified', 'Hash do arquivo alterado', $fileRecord['file_hash'], $currentHash);
                $this->updateFileRecord($fileRecord['id'], $currentHash, $currentSize, $currentModified, 'modified');
                $alerts[] = "ALERTA: Arquivo modificado - {$filePath}";
            }
        }
        
        return $alerts;
    }
    
    public function addFileToMonitoring($filePath, $isCritical = false): void {
        if (!file_exists($filePath)) return;
        
        $hash = hash_file('sha256', $filePath);
        $size = filesize($filePath);
        $modified = filemtime($filePath);
        
        $sql = "INSERT INTO file_integrity (file_path, file_hash, file_size, last_modified, is_critical) 
                VALUES (?, ?, ?, FROM_UNIXTIME(?), ?) 
                ON DUPLICATE KEY UPDATE 
                file_hash = ?, file_size = ?, last_modified = FROM_UNIXTIME(?), is_critical = ?";
        
        executeQuery($this->pdo, $sql, [
            $filePath, $hash, $size, $modified, $isCritical,
            $hash, $size, $modified, $isCritical
        ]);
    }
    
    private function createIntegrityAlert($fileId, $type, $details, $oldHash = null, $newHash = null) {
        $severity = $type === 'deleted' ? 'critical' : 'high';
        $sql = "INSERT INTO integrity_alerts (file_integrity_id, alert_type, old_hash, new_hash, details, severity) 
                VALUES (?, ?, ?, ?, ?, ?)";
        executeQuery($this->pdo, $sql, [$fileId, $type, $oldHash, $newHash, $details, $severity]);
        
        // Enviar notificação
        $this->sendIntegrityAlert($type, $details);
    }
    
    private function updateFileRecord($id, $hash, $size, $modified, $status) {
        $sql = "UPDATE file_integrity SET file_hash = ?, file_size = ?, last_modified = FROM_UNIXTIME(?), status = ? WHERE id = ?";
        executeQuery($this->pdo, $sql, [$hash, $size, $modified, $status, $id]);
    }
    
    private function sendIntegrityAlert($type, $details) {
        $subject = "ALERTA DE INTEGRIDADE - Toloni Pescarias";
        $message = "Tipo: {$type}\nDetalhes: {$details}\nHorário: " . date('Y-m-d H:i:s');
        
        $adminEmail = $this->getSecurityEmail();
        mail($adminEmail, $subject, $message);
    }
    
    private function getSecurityEmail(): string {
        $sql = "SELECT setting_value FROM system_settings WHERE setting_key = 'security_notification_email'";
        $stmt = executeQuery($this->pdo, $sql);
        return $stmt->fetchColumn() ?: 'admin@tolonipescarias.com';
    }
}

// 7. WEB APPLICATION FIREWALL (WAF)
class WebApplicationFirewall {
    private $pdo;
    private $blockedIPs = [];
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->loadBlockedIPs();
    }
    
    public function checkRequest(): bool {
        if (!$this->isWAFEnabled()) return true;
        
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        // Verificar IP bloqueado
        if (in_array($ip, $this->blockedIPs)) {
            $this->logWAFEvent(null, 'blocked', 'IP previamente bloqueado');
            return false;
        }
        
        // Obter dados da requisição
        $requestData = $this->getRequestData();
        $rules = $this->getActiveRules();
        
        foreach ($rules as $rule) {
            if ($this->matchesRule($requestData, $rule)) {
                return $this->executeRuleAction($rule, $requestData);
            }
        }
        
        return true;
    }
    
    private function getRequestData(): array {
        return [
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'GET',
            'uri' => $_SERVER['REQUEST_URI'] ?? '',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'get' => $_GET,
            'post' => $_POST,
            'headers' => getallheaders()
        ];
    }
    
    private function getActiveRules(): array {
        $sql = "SELECT * FROM waf_rules WHERE is_active = 1 ORDER BY severity DESC";
        $stmt = executeQuery($this->pdo, $sql);
        return $stmt->fetchAll();
    }
    
    private function matchesRule($requestData, $rule): bool {
        $pattern = $rule['rule_pattern'];
        $allData = json_encode($requestData);
        
        // Remover as barras do padrão regex se existirem
        if (preg_match('/^\/.*\/[gimx]*$/i', $pattern)) {
            return preg_match($pattern, $allData);
        }
        
        // Busca simples se não for regex
        return stripos($allData, $pattern) !== false;
    }
    
    private function executeRuleAction($rule, $requestData): bool {
        $action = $rule['action'];
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        $this->logWAFEvent($rule['id'], $action, "Regra ativada: {$rule['rule_name']}", $rule);
        
        switch ($action) {
            case 'block':
                $this->blockIP($ip);
                http_response_code(403);
                die('Acesso negado por motivos de segurança.');
                
            case 'redirect':
                header('Location: /403.html');
                exit;
                
            case 'log':
            default:
                return true;
        }
    }
    
    private function logWAFEvent($ruleId, $action, $details, $rule = null) {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        $pattern = $rule ? $rule['rule_pattern'] : '';
        $severity = $rule ? $rule['severity'] : 'medium';
        
        $sql = "INSERT INTO waf_logs (rule_id, ip_address, user_agent, request_method, request_uri, matched_pattern, action_taken, severity) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        executeQuery($this->pdo, $sql, [$ruleId, $ip, $userAgent, $method, $uri, $pattern, $action, $severity]);
    }
    
    private function blockIP($ip) {
        $this->blockedIPs[] = $ip;
        file_put_contents(__DIR__ . '/../.blocked_ips', $ip . "\n", FILE_APPEND | LOCK_EX);
    }
    
    private function loadBlockedIPs() {
        $file = __DIR__ . '/../.blocked_ips';
        if (file_exists($file)) {
            $this->blockedIPs = array_filter(array_map('trim', file($file)));
        }
    }
    
    private function isWAFEnabled(): bool {
        $sql = "SELECT setting_value FROM system_settings WHERE setting_key = 'security_waf_enabled'";
        $stmt = executeQuery($this->pdo, $sql);
        return $stmt->fetchColumn() === '1';
    }
}

// 8. SISTEMA DE AUDITORIA E COMPLIANCE LGPD
class AuditCompliance {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function logAction($userId, $entityType, $entityId, $action, $oldValues = null, $newValues = null, $reason = '') {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        $complianceType = $this->determineComplianceType($entityType, $action);
        
        $sql = "INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_values, new_values, ip_address, user_agent, reason, compliance_type) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        executeQuery($this->pdo, $sql, [
            $userId, $entityType, $entityId, $action,
            $oldValues ? json_encode($oldValues) : null,
            $newValues ? json_encode($newValues) : null,
            $ip, $userAgent, $reason, $complianceType
        ]);
    }
    
    public function generateComplianceReport($type = 'monthly'): array {
        $period = $this->getPeriodQuery($type);
        
        $report = [
            'period' => $type,
            'generated_at' => date('Y-m-d H:i:s'),
            'data_access' => $this->getDataAccessStats($period),
            'data_modifications' => $this->getDataModificationStats($period),
            'user_consents' => $this->getUserConsentStats($period),
            'security_events' => $this->getSecurityEventStats($period),
            'recommendations' => $this->generateRecommendations()
        ];
        
        $this->saveSecurityReport($type, $report);
        return $report;
    }
    
    public function recordUserConsent($userId, $consentType, $given, $version = '1.0') {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        
        $sql = "INSERT INTO user_consents (user_id, consent_type, consent_given, consent_version, ip_address, user_agent) 
                VALUES (?, ?, ?, ?, ?, ?)";
        executeQuery($this->pdo, $sql, [$userId, $consentType, $given, $version, $ip, $userAgent]);
    }
    
    public function anonymizeUserData($userId, $reason = 'User request') {
        // Log da ação antes de anonimizar
        $this->logAction($userId, 'users', $userId, 'anonymize', null, null, $reason);
        
        // Anonimizar dados pessoais
        $anonymousData = [
            'name' => 'Usuário Anônimo #' . $userId,
            'email' => 'anonimo' . $userId . '@example.com',
            'phone' => null,
            'location' => null,
            'bio' => null,
            'profile_image' => null
        ];
        
        $sql = "UPDATE users SET name = ?, email = ?, phone = ?, location = ?, bio = ?, profile_image = ? WHERE id = ?";
        executeQuery($this->pdo, $sql, array_merge(array_values($anonymousData), [$userId]));
        
        return true;
    }
    
    private function determineComplianceType($entityType, $action): string {
        $personalDataEntities = ['users', 'user_consents', 'user_sessions'];
        
        if (in_array($entityType, $personalDataEntities)) {
            return 'lgpd';
        }
        
        return 'general';
    }
    
    private function getPeriodQuery($type): array {
        switch ($type) {
            case 'daily':
                return ['DATE(created_at) = CURDATE()', []];
            case 'weekly':
                return ['created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)', []];
            case 'monthly':
            default:
                return ['created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)', []];
        }
    }
    
    private function getDataAccessStats($period): array {
        $sql = "SELECT action, COUNT(*) as count FROM audit_logs WHERE {$period[0]} AND action = 'read' GROUP BY action";
        $stmt = executeQuery($this->pdo, $sql, $period[1]);
        return $stmt->fetchAll();
    }
    
    private function getDataModificationStats($period): array {
        $sql = "SELECT action, entity_type, COUNT(*) as count FROM audit_logs 
                WHERE {$period[0]} AND action IN ('create', 'update', 'delete') 
                GROUP BY action, entity_type";
        $stmt = executeQuery($this->pdo, $sql, $period[1]);
        return $stmt->fetchAll();
    }
    
    private function getUserConsentStats($period): array {
        $sql = "SELECT consent_type, consent_given, COUNT(*) as count FROM user_consents 
                WHERE {$period[0]} GROUP BY consent_type, consent_given";
        $stmt = executeQuery($this->pdo, $sql, $period[1]);
        return $stmt->fetchAll();
    }
    
    private function getSecurityEventStats($period): array {
        $sql = "SELECT severity, COUNT(*) as count FROM security_logs 
                WHERE {$period[0]} GROUP BY severity";
        $stmt = executeQuery($this->pdo, $sql, $period[1]);
        return $stmt->fetchAll();
    }
    
    private function generateRecommendations(): array {
        return [
            'Manter logs de auditoria atualizados',
            'Revisar consentimentos expirados',
            'Verificar integridade dos arquivos críticos',
            'Atualizar regras do WAF conforme necessário',
            'Realizar backup regular dos dados'
        ];
    }
    
    private function saveSecurityReport($type, $data) {
        $sql = "INSERT INTO security_reports (report_type, report_data, status) VALUES (?, ?, 'generated')";
        executeQuery($this->pdo, $sql, [$type, json_encode($data)]);
    }
}

// Instanciar classes globalmente
global $fileIntegrity, $waf, $auditCompliance;
$fileIntegrity = new FileIntegrityMonitor($pdo);
$waf = new WebApplicationFirewall($pdo);
$auditCompliance = new AuditCompliance($pdo);

// Executar WAF automaticamente
if (php_sapi_name() !== 'cli') {
    $waf->checkRequest();
}
?>