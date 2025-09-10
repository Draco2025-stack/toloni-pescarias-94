-- Schema completo do banco de dados Toloni Pescarias
-- Executar este arquivo após criar o banco de dados

-- Tabela de usuários (base)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bio TEXT,
    profile_image VARCHAR(255),
    phone VARCHAR(20),
    location VARCHAR(100),
    experience_level ENUM('iniciante', 'intermediario', 'avancado', 'profissional') DEFAULT 'iniciante',
    is_admin TINYINT(1) DEFAULT 0,
    is_verified TINYINT(1) DEFAULT 0,
    verification_token VARCHAR(100),
    reset_token VARCHAR(100),
    reset_expires TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_verification_token (verification_token),
    INDEX idx_reset_token (reset_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de localizações
CREATE TABLE locations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'Brasil',
    featured_image VARCHAR(255),
    images JSON,
    fish_species JSON,
    facilities JSON,
    difficulty_level ENUM('facil', 'moderado', 'dificil') DEFAULT 'moderado',
    access_type ENUM('publico', 'privado', 'clube') DEFAULT 'publico',
    is_approved TINYINT(1) DEFAULT 0,
    is_featured TINYINT(1) DEFAULT 0,
    suggested_by INT,
    approved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (suggested_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_city_state (city, state),
    INDEX idx_coordinates (latitude, longitude),
    INDEX idx_approved (is_approved),
    INDEX idx_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de relatórios/reports
CREATE TABLE reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    location_id INT,
    custom_location VARCHAR(255),
    images JSON,
    fish_species VARCHAR(100),
    fish_weight DECIMAL(5, 2),
    weather_conditions VARCHAR(100),
    water_conditions VARCHAR(100),
    bait_used VARCHAR(100),
    technique_used VARCHAR(100),
    fishing_date DATE,
    fishing_time TIME,
    is_public TINYINT(1) DEFAULT 1,
    approved TINYINT(1) DEFAULT 0,
    approved_by INT,
    approval_date TIMESTAMP NULL,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    views_count INT DEFAULT 0,
    featured TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_location_id (location_id),
    INDEX idx_approved (approved),
    INDEX idx_public (is_public),
    INDEX idx_featured (featured),
    INDEX idx_created_at (created_at),
    FULLTEXT KEY ft_title_content (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de comentários
CREATE TABLE comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_id INT NULL,
    content TEXT NOT NULL,
    is_approved TINYINT(1) DEFAULT 1,
    approved_by INT,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_report_id (report_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_approved (is_approved),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de likes
CREATE TABLE likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    target_type ENUM('report', 'comment') NOT NULL,
    target_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (user_id, target_type, target_id),
    INDEX idx_target (target_type, target_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de carousels
CREATE TABLE carousels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(255),
    image VARCHAR(255) NOT NULL,
    link_url VARCHAR(255),
    link_text VARCHAR(100),
    position_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    start_date TIMESTAMP NULL,
    end_date TIMESTAMP NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_active (is_active),
    INDEX idx_position (position_order),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de sessões
CREATE TABLE user_sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de logs de segurança
CREATE TABLE security_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger para atualizar contador de comentários
DELIMITER //
CREATE TRIGGER update_comments_count_insert 
    AFTER INSERT ON comments 
    FOR EACH ROW 
BEGIN
    UPDATE reports 
    SET comments_count = (
        SELECT COUNT(*) FROM comments 
        WHERE report_id = NEW.report_id AND is_approved = 1
    ) 
    WHERE id = NEW.report_id;
END;//

CREATE TRIGGER update_comments_count_delete 
    AFTER DELETE ON comments 
    FOR EACH ROW 
BEGIN
    UPDATE reports 
    SET comments_count = (
        SELECT COUNT(*) FROM comments 
        WHERE report_id = OLD.report_id AND is_approved = 1
    ) 
    WHERE id = OLD.report_id;
END;//

-- Trigger para atualizar contador de likes
CREATE TRIGGER update_likes_count_insert 
    AFTER INSERT ON likes 
    FOR EACH ROW 
BEGIN
    IF NEW.target_type = 'report' THEN
        UPDATE reports 
        SET likes_count = (
            SELECT COUNT(*) FROM likes 
            WHERE target_type = 'report' AND target_id = NEW.target_id
        ) 
        WHERE id = NEW.target_id;
    ELSEIF NEW.target_type = 'comment' THEN
        UPDATE comments 
        SET likes_count = (
            SELECT COUNT(*) FROM likes 
            WHERE target_type = 'comment' AND target_id = NEW.target_id
        ) 
        WHERE id = NEW.target_id;
    END IF;
END;//

CREATE TRIGGER update_likes_count_delete 
    AFTER DELETE ON likes 
    FOR EACH ROW 
BEGIN
    IF OLD.target_type = 'report' THEN
        UPDATE reports 
        SET likes_count = (
            SELECT COUNT(*) FROM likes 
            WHERE target_type = 'report' AND target_id = OLD.target_id
        ) 
        WHERE id = OLD.target_id;
    ELSEIF OLD.target_type = 'comment' THEN
        UPDATE comments 
        SET likes_count = (
            SELECT COUNT(*) FROM likes 
            WHERE target_type = 'comment' AND target_id = OLD.target_id
        ) 
        WHERE id = OLD.target_id;
    END IF;
END;//

DELIMITER ;

-- Inserir dados iniciais

-- Usuário administrador padrão
INSERT INTO users (name, email, password_hash, is_admin, is_verified) VALUES 
('Administrador', 'admin@tolonipescarias.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 1);

-- Algumas localizações iniciais
INSERT INTO locations (name, description, city, state, latitude, longitude, is_approved) VALUES 
('Represa Billings', 'Grande represa na região metropolitana de São Paulo, ideal para pesca de tucunaré e traíra.', 'São Bernardo do Campo', 'SP', -23.7842, -46.5617, 1),
('Rio Tietê - Barra Bonita', 'Famoso ponto de pesca no interior paulista, conhecido pela diversidade de espécies.', 'Barra Bonita', 'SP', -22.4911, -48.5478, 1),
('Pantanal - Rio Paraguai', 'Um dos melhores destinos de pesca esportiva do Brasil.', 'Corumbá', 'MS', -19.0067, -57.6538, 1);