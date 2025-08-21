-- Toloni Pescarias Database Schema - PRODUÇÃO
-- Schema limpo para importação no phpMyAdmin da Hostinger
-- Criado para MySQL 5.7+ / MariaDB 10.3+
-- Character set: utf8mb4 para suporte completo a emojis

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS toloni_pescarias 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE toloni_pescarias;

-- Configurações do banco
SET time_zone = '+00:00';
SET foreign_key_checks = 1;
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';

-- ===============================================
-- ESTRUTURA DAS TABELAS
-- ===============================================

-- Tabela de usuários
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin TINYINT(1) DEFAULT 0,
    failed_attempts INT DEFAULT 0,
    locked_until DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    email_verified TINYINT(1) DEFAULT 0,
    email_verification_token VARCHAR(64) NULL,
    email_verification_expires TIMESTAMP NULL,
    profile_image VARCHAR(255) NULL,
    bio TEXT NULL,
    phone VARCHAR(20) NULL,
    location VARCHAR(100) NULL,
    experience_level ENUM('iniciante', 'intermediario', 'avancado', 'profissional') DEFAULT 'iniciante',
    active TINYINT(1) DEFAULT 1,
    
    INDEX idx_email (email),
    INDEX idx_active (active),
    INDEX idx_admin (is_admin),
    INDEX idx_created (created_at),
    INDEX idx_verification_token (email_verification_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de localidades
CREATE TABLE locations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'Brasil',
    whatsapp VARCHAR(20),
    website VARCHAR(255),
    access_info TEXT,
    best_season VARCHAR(100),
    fish_species TEXT, -- JSON array de espécies
    facilities TEXT, -- JSON array de facilidades
    difficulty_level ENUM('facil', 'moderado', 'dificil') DEFAULT 'moderado',
    entry_fee DECIMAL(10,2) NULL,
    featured TINYINT(1) DEFAULT 0,
    approved TINYINT(1) DEFAULT 1,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    views_count INT DEFAULT 0,
    rating_avg DECIMAL(3,2) DEFAULT 0.00,
    rating_count INT DEFAULT 0,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_featured (featured),
    INDEX idx_approved (approved),
    INDEX idx_city (city),
    INDEX idx_rating (rating_avg),
    INDEX idx_created (created_at),
    FULLTEXT idx_search (name, description, city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de relatos de pesca
CREATE TABLE reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    location_id INT,
    user_id INT NOT NULL,
    images TEXT, -- JSON array de URLs
    video_url VARCHAR(500),
    fish_species VARCHAR(100),
    fish_weight DECIMAL(5,2) NULL,
    fish_length DECIMAL(5,2) NULL,
    bait_used VARCHAR(100),
    technique_used VARCHAR(100),
    weather_conditions VARCHAR(100),
    water_conditions VARCHAR(100),
    fishing_date DATE,
    fishing_duration INT, -- duração em horas
    equipment_used TEXT,
    featured TINYINT(1) DEFAULT 0,
    is_public TINYINT(1) DEFAULT 1,
    approved TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_featured (featured),
    INDEX idx_approved (approved),
    INDEX idx_public (is_public),
    INDEX idx_user (user_id),
    INDEX idx_location (location_id),
    INDEX idx_created (created_at),
    INDEX idx_fishing_date (fishing_date),
    FULLTEXT idx_search (title, content, fish_species)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de comentários
CREATE TABLE comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_id INT NULL, -- Para comentários aninhados
    content TEXT NOT NULL,
    approved TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_report (report_id),
    INDEX idx_user (user_id),
    INDEX idx_approved (approved),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de avaliações de localidades
CREATE TABLE location_ratings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    location_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_location (user_id, location_id),
    INDEX idx_location (location_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de curtidas de relatos
CREATE TABLE report_likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_report (user_id, report_id),
    INDEX idx_report (report_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de mídia do carrossel administrativo
CREATE TABLE admin_media (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('image', 'video') NOT NULL,
    url VARCHAR(500) NOT NULL,
    title VARCHAR(200),
    alt_text VARCHAR(200),
    description TEXT,
    link_url VARCHAR(500),
    display_order INT DEFAULT 0,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_active (active),
    INDEX idx_order (display_order),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de logs de segurança
CREATE TABLE security_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    details TEXT,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_ip (ip_address),
    INDEX idx_created (created_at),
    INDEX idx_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de tentativas de login falhadas
CREATE TABLE failed_logins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_address VARCHAR(45) NOT NULL,
    email VARCHAR(150),
    attempts INT DEFAULT 1,
    blocked_until DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_ip (ip_address),
    INDEX idx_email (email),
    INDEX idx_blocked (blocked_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de configurações do sistema
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de sessões de usuário
CREATE TABLE user_sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de notificações
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read (read_at),
    INDEX idx_created (created_at),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- TABELAS DE SEGURANÇA AVANÇADA
-- ===============================================

-- Tabela para Autenticação 2FA
CREATE TABLE user_2fa (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    secret VARCHAR(32) NOT NULL,
    backup_codes JSON, -- Array de códigos de backup
    is_enabled TINYINT(1) DEFAULT 0,
    last_used TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Logs de tentativas 2FA
CREATE TABLE two_fa_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    success TINYINT(1) NOT NULL,
    code_type ENUM('totp', 'backup') NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_ip (ip_address),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para Criptografia de Dados
CREATE TABLE encryption_keys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    key_name VARCHAR(50) UNIQUE NOT NULL,
    key_hash VARCHAR(64) NOT NULL, -- Hash da chave para verificação
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    is_active TINYINT(1) DEFAULT 1,
    
    INDEX idx_name (key_name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para Sistema Honeypot
CREATE TABLE honeypot_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    trap_type ENUM('field', 'link', 'form') NOT NULL,
    trap_name VARCHAR(100) NOT NULL,
    submitted_data TEXT,
    is_blocked TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_ip (ip_address),
    INDEX idx_blocked (is_blocked),
    INDEX idx_created (created_at),
    INDEX idx_trap_type (trap_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para Whitelist de IPs Admin
CREATE TABLE admin_ip_whitelist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    description VARCHAR(200),
    created_by INT,
    is_active TINYINT(1) DEFAULT 1,
    last_used TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_ip (ip_address),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para Backup Automático
CREATE TABLE backup_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    backup_type ENUM('database', 'files', 'full') NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    checksum VARCHAR(64),
    encryption_key_id INT,
    status ENUM('started', 'completed', 'failed', 'corrupted') DEFAULT 'started',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    FOREIGN KEY (encryption_key_id) REFERENCES encryption_keys(id) ON DELETE SET NULL,
    INDEX idx_type (backup_type),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para Monitoramento de Integridade
CREATE TABLE file_integrity (
    id INT PRIMARY KEY AUTO_INCREMENT,
    file_path VARCHAR(500) NOT NULL UNIQUE,
    file_hash VARCHAR(64) NOT NULL,
    file_size BIGINT NOT NULL,
    last_modified TIMESTAMP NOT NULL,
    is_critical TINYINT(1) DEFAULT 0,
    status ENUM('ok', 'modified', 'deleted', 'corrupted') DEFAULT 'ok',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_path (file_path),
    INDEX idx_status (status),
    INDEX idx_critical (is_critical),
    INDEX idx_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Logs de alterações de integridade
CREATE TABLE integrity_alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    file_integrity_id INT NOT NULL,
    alert_type ENUM('modified', 'deleted', 'new_file', 'permission_change') NOT NULL,
    old_hash VARCHAR(64),
    new_hash VARCHAR(64),
    details TEXT,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    acknowledged TINYINT(1) DEFAULT 0,
    acknowledged_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (file_integrity_id) REFERENCES file_integrity(id) ON DELETE CASCADE,
    FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_file (file_integrity_id),
    INDEX idx_type (alert_type),
    INDEX idx_severity (severity),
    INDEX idx_acknowledged (acknowledged)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para WAF (Web Application Firewall)
CREATE TABLE waf_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    rule_pattern TEXT NOT NULL,
    rule_type ENUM('sql_injection', 'xss', 'rfi', 'lfi', 'shell_injection', 'custom') NOT NULL,
    action ENUM('block', 'log', 'redirect') DEFAULT 'block',
    is_active TINYINT(1) DEFAULT 1,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (rule_name),
    INDEX idx_type (rule_type),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Logs do WAF
CREATE TABLE waf_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rule_id INT,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    request_method VARCHAR(10),
    request_uri TEXT,
    request_data TEXT,
    matched_pattern TEXT,
    action_taken ENUM('blocked', 'logged', 'redirected') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (rule_id) REFERENCES waf_rules(id) ON DELETE SET NULL,
    INDEX idx_rule (rule_id),
    INDEX idx_ip (ip_address),
    INDEX idx_created (created_at),
    INDEX idx_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para Auditoria e Compliance LGPD
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    entity_type VARCHAR(50) NOT NULL, -- users, reports, locations, etc
    entity_id INT,
    action ENUM('create', 'read', 'update', 'delete', 'export', 'anonymize') NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    reason TEXT,
    compliance_type ENUM('lgpd', 'gdpr', 'general') DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_action (action),
    INDEX idx_compliance (compliance_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para controle de consentimento LGPD
CREATE TABLE user_consents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    consent_type ENUM('data_processing', 'marketing', 'analytics', 'cookies') NOT NULL,
    consent_given TINYINT(1) NOT NULL,
    consent_version VARCHAR(10) DEFAULT '1.0',
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_type (consent_type),
    INDEX idx_given (consent_given),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para relatórios de segurança automáticos
CREATE TABLE security_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_type ENUM('daily', 'weekly', 'monthly', 'incident') NOT NULL,
    report_data JSON,
    status ENUM('generated', 'sent', 'failed') DEFAULT 'generated',
    sent_to TEXT, -- emails dos destinatários
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_type (report_type),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- TRIGGERS AUTOMÁTICOS
-- ===============================================

-- Trigger para atualizar contador de comentários
DELIMITER //
CREATE TRIGGER update_report_comments_count_insert
    AFTER INSERT ON comments
    FOR EACH ROW
BEGIN
    UPDATE reports 
    SET comments_count = (
        SELECT COUNT(*) FROM comments 
        WHERE report_id = NEW.report_id AND approved = 1
    )
    WHERE id = NEW.report_id;
END//

CREATE TRIGGER update_report_comments_count_delete
    AFTER DELETE ON comments
    FOR EACH ROW
BEGIN
    UPDATE reports 
    SET comments_count = (
        SELECT COUNT(*) FROM comments 
        WHERE report_id = OLD.report_id AND approved = 1
    )
    WHERE id = OLD.report_id;
END//

-- Trigger para atualizar contador de curtidas
CREATE TRIGGER update_report_likes_count_insert
    AFTER INSERT ON report_likes
    FOR EACH ROW
BEGIN
    UPDATE reports 
    SET likes_count = (
        SELECT COUNT(*) FROM report_likes 
        WHERE report_id = NEW.report_id
    )
    WHERE id = NEW.report_id;
END//

CREATE TRIGGER update_report_likes_count_delete
    AFTER DELETE ON report_likes
    FOR EACH ROW
BEGIN
    UPDATE reports 
    SET likes_count = (
        SELECT COUNT(*) FROM report_likes 
        WHERE report_id = OLD.report_id
    )
    WHERE id = OLD.report_id;
END//

-- Trigger para atualizar média de avaliações
CREATE TRIGGER update_location_rating_insert
    AFTER INSERT ON location_ratings
    FOR EACH ROW
BEGIN
    UPDATE locations 
    SET 
        rating_avg = (
            SELECT AVG(rating) FROM location_ratings 
            WHERE location_id = NEW.location_id
        ),
        rating_count = (
            SELECT COUNT(*) FROM location_ratings 
            WHERE location_id = NEW.location_id
        )
    WHERE id = NEW.location_id;
END//

CREATE TRIGGER update_location_rating_update
    AFTER UPDATE ON location_ratings
    FOR EACH ROW
BEGIN
    UPDATE locations 
    SET 
        rating_avg = (
            SELECT AVG(rating) FROM location_ratings 
            WHERE location_id = NEW.location_id
        ),
        rating_count = (
            SELECT COUNT(*) FROM location_ratings 
            WHERE location_id = NEW.location_id
        )
    WHERE id = NEW.location_id;
END//

CREATE TRIGGER update_location_rating_delete
    AFTER DELETE ON location_ratings
    FOR EACH ROW
BEGIN
    UPDATE locations 
    SET 
        rating_avg = (
            SELECT COALESCE(AVG(rating), 0) FROM location_ratings 
            WHERE location_id = OLD.location_id
        ),
        rating_count = (
            SELECT COUNT(*) FROM location_ratings 
            WHERE location_id = OLD.location_id
        )
    WHERE id = OLD.location_id;
END//

DELIMITER ;

-- ===============================================
-- STORED PROCEDURES
-- ===============================================

-- Procedure para limpar sessões expiradas
DELIMITER //
CREATE PROCEDURE CleanExpiredSessions()
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
    DELETE FROM failed_logins WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
END//
DELIMITER ;

-- ===============================================
-- DADOS ESSENCIAIS PARA PRODUÇÃO
-- ===============================================

-- Usuário administrador principal (ALTERE A SENHA!)
INSERT INTO users (name, email, password_hash, is_admin, email_verified) VALUES 
('Administrador Toloni', 'admin@tolonipescarias.com', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 1);

-- Configurações essenciais do sistema
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES 
('site_name', 'Toloni Pescarias', 'string', 'Nome do site'),
('site_description', 'Sua plataforma para compartilhar experiências de pesca', 'string', 'Descrição do site'),
('admin_email', 'admin@tolonipescarias.com', 'string', 'Email do administrador'),
('maintenance_mode', '0', 'boolean', 'Modo de manutenção'),
('max_upload_size', '10485760', 'number', 'Tamanho máximo de upload em bytes'),
('items_per_page', '12', 'number', 'Itens por página'),
('allow_comments', '1', 'boolean', 'Permitir comentários'),
('moderate_comments', '0', 'boolean', 'Moderar comentários'),
('email_notifications', '1', 'boolean', 'Notificações por email');

-- Regras WAF básicas para segurança
INSERT INTO waf_rules (rule_name, rule_pattern, rule_type, severity) VALUES 
('SQL Injection - UNION', '/(union|UNION).*(select|SELECT)/i', 'sql_injection', 'critical'),
('SQL Injection - OR 1=1', '/(or|OR)\\s+(1|true)\\s*=\\s*(1|true)/i', 'sql_injection', 'critical'),
('XSS - Script Tag', '/<script[^>]*>.*?<\\/script>/i', 'xss', 'high'),
('XSS - JavaScript Protocol', '/javascript\\s*:/i', 'xss', 'high'),
('XSS - Event Handlers', '/(onload|onclick|onerror|onmouseover)\\s*=/i', 'xss', 'medium'),
('RFI - Remote File Include', '/(http|https|ftp):\\/\\//i', 'rfi', 'high'),
('LFI - Local File Include', '/\\.\\.\\/i', 'lfi', 'medium'),
('Shell Injection - Commands', '/(exec|system|shell_exec|passthru|eval)\\s*\\(/i', 'shell_injection', 'critical'),
('Directory Traversal', '/\\.\\.[\\/\\\\]/i', 'lfi', 'medium'),
('PHP Code Injection', '/<\\?php/i', 'shell_injection', 'critical');

-- Configurações de segurança
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES 
('security_2fa_required', '1', 'boolean', 'Exigir 2FA para administradores'),
('security_backup_interval', '24', 'number', 'Intervalo de backup em horas'),
('security_integrity_check_interval', '1', 'number', 'Intervalo de verificação de integridade em horas'),
('security_waf_enabled', '1', 'boolean', 'Ativar Web Application Firewall'),
('security_honeypot_enabled', '1', 'boolean', 'Ativar sistema Honeypot'),
('security_ip_whitelist_enabled', '1', 'boolean', 'Ativar whitelist de IPs para admin'),
('security_audit_retention_days', '365', 'number', 'Dias de retenção dos logs de auditoria'),
('security_notification_email', 'admin@tolonipescarias.com', 'string', 'Email para notificações de segurança'),
('security_max_login_attempts', '5', 'number', 'Máximo de tentativas de login'),
('security_lockout_duration', '15', 'number', 'Duração do bloqueio em minutos');

-- ===============================================
-- VIEWS PARA RELATÓRIOS
-- ===============================================

-- View de estatísticas de usuários
CREATE VIEW user_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_admin = 1 THEN 1 END) as admin_users,
    COUNT(CASE WHEN active = 1 THEN 1 END) as active_users,
    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_30d
FROM users;

-- View de estatísticas de conteúdo
CREATE VIEW content_stats AS
SELECT 
    (SELECT COUNT(*) FROM locations WHERE approved = 1) as total_locations,
    (SELECT COUNT(*) FROM reports WHERE approved = 1) as total_reports,
    (SELECT COUNT(*) FROM comments WHERE approved = 1) as total_comments,
    (SELECT COUNT(*) FROM admin_media WHERE active = 1) as total_media;

-- ===============================================
-- OTIMIZAÇÕES E FINALIZAÇÃO
-- ===============================================

-- Otimizações de performance
ANALYZE TABLE users, locations, reports, comments, security_logs;

-- ===============================================
-- INSTRUÇÕES IMPORTANTES PARA PRODUÇÃO
-- ===============================================

-- ATENÇÃO: ALTERE IMEDIATAMENTE A SENHA DO ADMINISTRADOR!
-- Senha atual é: password (hash bcrypt)
-- 
-- Para gerar nova senha:
-- 1. Use um gerador de hash bcrypt online ou PHP
-- 2. Execute: UPDATE users SET password_hash = 'NOVO_HASH' WHERE email = 'admin@tolonipescarias.com';
--
-- VERIFIQUE TAMBÉM:
-- 1. Email do administrador está correto
-- 2. Configurações de domínio e URLs
-- 3. Configurações de SMTP se for usar email
-- 4. Backup automático configurado
-- 5. Monitoramento de segurança ativo

COMMIT;