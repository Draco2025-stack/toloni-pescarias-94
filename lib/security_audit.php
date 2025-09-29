<?php
/**
 * Sistema de Auditoria de Segurança - Toloni Pescarias
 */

require_once '../config/database_hostinger.php';

/**
 * Log detalhado de ações de segurança
 */
function logSecurityAction($pdo, $user, $action, $resource = null, $details = []) {
    try {
        // Estruturar dados do log
        $logData = [
            'user_id' => $user['id'] ?? null,
            'user_email' => $user['email'] ?? 'anonymous',
            'user_role' => getUserRole($user) ?? 'unknown',
            'action' => $action,
            'resource_type' => $resource['type'] ?? null,
            'resource_id' => $resource['id'] ?? null,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'timestamp' => date('Y-m-d H:i:s'),
            'details' => is_array($details) ? json_encode($details) : $details,
            'severity' => determineSeverity($action)
        ];
        
        // Salvar no log de segurança
        $stmt = $pdo->prepare("
            INSERT INTO security_audit_log 
            (user_id, user_email, user_role, action, resource_type, resource_id, 
             ip_address, user_agent, details, severity, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $logData['user_id'],
            $logData['user_email'],
            $logData['user_role'],
            $logData['action'],
            $logData['resource_type'],
            $logData['resource_id'],
            $logData['ip_address'],
            $logData['user_agent'],
            $logData['details'],
            $logData['severity']
        ]);
        
        // Verificar se precisa de alerta
        if (shouldTriggerAlert($logData)) {
            triggerSecurityAlert($pdo, $logData);
        }
        
    } catch (Exception $e) {
        error_log("Security audit logging failed: " . $e->getMessage());
    }
}

/**
 * Determina severidade da ação
 */
function determineSeverity($action) {
    $highSeverity = [
        'UNAUTHORIZED_ACCESS',
        'PRIVILEGE_ESCALATION',
        'ADMIN_LOGIN_FAILED',
        'SUSPICIOUS_ACTIVITY',
        'DATA_BREACH_ATTEMPT'
    ];
    
    $mediumSeverity = [
        'LOGIN_FAILED',
        'INVALID_TOKEN',
        'RATE_LIMIT_EXCEEDED'
    ];
    
    if (in_array($action, $highSeverity)) return 'HIGH';
    if (in_array($action, $mediumSeverity)) return 'MEDIUM';
    return 'LOW';
}

/**
 * Verifica se deve disparar alerta
 */
function shouldTriggerAlert($logData) {
    // Alerta para ações de alta severidade
    if ($logData['severity'] === 'HIGH') return true;
    
    // Alerta para múltiplas tentativas falhadas
    if (strpos($logData['action'], 'FAILED') !== false) {
        return countRecentFailures($logData['ip_address']) >= 5;
    }
    
    return false;
}

/**
 * Conta falhas recentes por IP
 */
function countRecentFailures($ip) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as failures 
            FROM security_audit_log 
            WHERE ip_address = ? 
            AND action LIKE '%FAILED%' 
            AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ");
        
        $stmt->execute([$ip]);
        $result = $stmt->fetch();
        
        return $result['failures'] ?? 0;
    } catch (Exception $e) {
        return 0;
    }
}

/**
 * Dispara alerta de segurança
 */
function triggerSecurityAlert($pdo, $logData) {
    // Log crítico
    error_log("SECURITY ALERT: " . json_encode($logData));
    
    // Salvar alerta na base
    try {
        $stmt = $pdo->prepare("
            INSERT INTO security_alerts 
            (alert_type, severity, user_id, ip_address, details, created_at) 
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $logData['action'],
            $logData['severity'],
            $logData['user_id'],
            $logData['ip_address'],
            $logData['details']
        ]);
    } catch (Exception $e) {
        error_log("Failed to save security alert: " . $e->getMessage());
    }
}

/**
 * Obter estatísticas de segurança para dashboard
 */
function getSecurityStats($pdo, $days = 7) {
    try {
        $stats = [];
        
        // Total de eventos por severidade
        $stmt = $pdo->prepare("
            SELECT severity, COUNT(*) as count 
            FROM security_audit_log 
            WHERE created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY severity
        ");
        $stmt->execute([$days]);
        $stats['events_by_severity'] = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        // Top IPs suspeitos
        $stmt = $pdo->prepare("
            SELECT ip_address, COUNT(*) as attempts 
            FROM security_audit_log 
            WHERE severity IN ('HIGH', 'MEDIUM') 
            AND created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY ip_address 
            ORDER BY attempts DESC 
            LIMIT 10
        ");
        $stmt->execute([$days]);
        $stats['suspicious_ips'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Alertas recentes
        $stmt = $pdo->prepare("
            SELECT * FROM security_alerts 
            WHERE created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
            ORDER BY created_at DESC 
            LIMIT 20
        ");
        $stmt->execute([$days]);
        $stats['recent_alerts'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return $stats;
    } catch (Exception $e) {
        error_log("Security stats query failed: " . $e->getMessage());
        return [];
    }
}

/**
 * Verifica padrões suspeitos de acesso
 */
function detectSuspiciousPatterns($pdo) {
    try {
        // Detectar tentativas de escalação de privilégio
        $stmt = $pdo->prepare("
            SELECT user_id, COUNT(*) as attempts 
            FROM security_audit_log 
            WHERE action = 'UNAUTHORIZED_ACCESS' 
            AND details LIKE '%ADMIN%'
            AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
            GROUP BY user_id
            HAVING attempts >= 3
        ");
        $stmt->execute();
        $privilegeEscalation = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Detectar acesso de múltiplos IPs pelo mesmo usuário
        $stmt = $pdo->prepare("
            SELECT user_id, COUNT(DISTINCT ip_address) as ip_count 
            FROM security_audit_log 
            WHERE user_id IS NOT NULL 
            AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
            GROUP BY user_id
            HAVING ip_count >= 5
        ");
        $stmt->execute();
        $multipleIPs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'privilege_escalation' => $privilegeEscalation,
            'multiple_ips' => $multipleIPs
        ];
    } catch (Exception $e) {
        error_log("Suspicious pattern detection failed: " . $e->getMessage());
        return [];
    }
}
?>