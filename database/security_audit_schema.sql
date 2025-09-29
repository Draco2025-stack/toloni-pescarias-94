-- Schema para auditoria de segurança - Toloni Pescarias

-- Tabela de logs de auditoria de segurança
CREATE TABLE IF NOT EXISTS security_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL DEFAULT 'USER',
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NULL,
    resource_id INT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    details TEXT,
    severity ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'LOW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_severity (severity),
    INDEX idx_created_at (created_at),
    INDEX idx_ip_address (ip_address)
);

-- Tabela de alertas de segurança
CREATE TABLE IF NOT EXISTS security_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alert_type VARCHAR(100) NOT NULL,
    severity ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
    user_id INT NULL,
    ip_address VARCHAR(45) NOT NULL,
    details TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by INT NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_alert_type (alert_type),
    INDEX idx_severity (severity),
    INDEX idx_resolved (resolved),
    INDEX idx_created_at (created_at)
);

-- Tabela de roles de usuários (extensão futura)
CREATE TABLE IF NOT EXISTS user_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    granted_by INT NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id),
    UNIQUE KEY unique_user_role (user_id, role),
    INDEX idx_user_id (user_id),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
);

-- Tabela de sessões de usuário (melhoria da segurança)
CREATE TABLE IF NOT EXISTS user_sessions_enhanced (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(128) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    logout_reason VARCHAR(50) NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_token (session_token),
    INDEX idx_user_id (user_id),
    INDEX idx_token (session_token),
    INDEX idx_expires (expires_at),
    INDEX idx_active (is_active)
);

-- View para estatísticas de segurança
CREATE OR REPLACE VIEW security_stats AS
SELECT 
    DATE(created_at) as date,
    severity,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT ip_address) as unique_ips
FROM security_audit_log 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at), severity
ORDER BY date DESC, severity;

-- View para usuários suspeitos
CREATE OR REPLACE VIEW suspicious_users AS
SELECT 
    user_id,
    user_email,
    COUNT(*) as failed_attempts,
    COUNT(DISTINCT ip_address) as different_ips,
    MAX(created_at) as last_attempt
FROM security_audit_log 
WHERE action LIKE '%FAILED%' 
    AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY user_id, user_email
HAVING failed_attempts >= 5 OR different_ips >= 3
ORDER BY failed_attempts DESC;