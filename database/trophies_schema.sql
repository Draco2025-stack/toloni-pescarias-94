-- Tabela de troféus do mês atual
CREATE TABLE IF NOT EXISTS trophies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fisherman_name VARCHAR(100) NOT NULL,
    fish_type VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    weight VARCHAR(20),
    date DATETIME NOT NULL,
    position INT NOT NULL,
    report_id INT,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_date (date),
    INDEX idx_position (position),
    INDEX idx_active (active),
    INDEX idx_report (report_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de arquivo de troféus (histórico mensal)
CREATE TABLE IF NOT EXISTS trophies_archive (
    id INT PRIMARY KEY AUTO_INCREMENT,
    month_year VARCHAR(7) NOT NULL, -- formato YYYY-MM
    fisherman_name VARCHAR(100) NOT NULL,
    fish_type VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    weight VARCHAR(20),
    date DATETIME NOT NULL,
    position INT NOT NULL,
    report_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_month_year (month_year),
    INDEX idx_position (position),
    INDEX idx_report (report_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger para atualizar ranking automaticamente quando um relato é inserido/atualizado
DELIMITER //

CREATE TRIGGER update_trophy_ranking_on_report_insert
    AFTER INSERT ON reports
    FOR EACH ROW
BEGIN
    -- Verificar se o relato atende aos critérios do ranking
    IF NEW.fish_species IS NOT NULL 
       AND NEW.fish_species != '' 
       AND NEW.location_id IS NOT NULL 
       AND NEW.images IS NOT NULL 
       AND JSON_LENGTH(NEW.images) > 0 
       AND NEW.is_public = 1 THEN
        
        -- Chamar atualização do ranking (será feito via API)
        -- Este trigger apenas marca que precisa atualizar
        INSERT INTO system_settings (setting_key, setting_value, setting_type) 
        VALUES ('ranking_needs_update', '1', 'boolean')
        ON DUPLICATE KEY UPDATE setting_value = '1', updated_at = NOW();
    END IF;
END//

CREATE TRIGGER update_trophy_ranking_on_report_update
    AFTER UPDATE ON reports
    FOR EACH ROW
BEGIN
    -- Verificar se houve mudança nos campos relevantes para o ranking
    IF (OLD.fish_species != NEW.fish_species 
        OR OLD.fish_weight != NEW.fish_weight 
        OR OLD.images != NEW.images 
        OR OLD.is_public != NEW.is_public
        OR OLD.location_id != NEW.location_id) THEN
        
        -- Marcar que o ranking precisa ser atualizado
        INSERT INTO system_settings (setting_key, setting_value, setting_type) 
        VALUES ('ranking_needs_update', '1', 'boolean')
        ON DUPLICATE KEY UPDATE setting_value = '1', updated_at = NOW();
    END IF;
END//

CREATE TRIGGER update_trophy_ranking_on_report_delete
    AFTER DELETE ON reports
    FOR EACH ROW
BEGIN
    -- Se o relato deletado estava no ranking, atualizar
    IF EXISTS (SELECT 1 FROM trophies WHERE report_id = OLD.id) THEN
        -- Remover da tabela de troféus
        DELETE FROM trophies WHERE report_id = OLD.id;
        
        -- Marcar que o ranking precisa ser atualizado
        INSERT INTO system_settings (setting_key, setting_value, setting_type) 
        VALUES ('ranking_needs_update', '1', 'boolean')
        ON DUPLICATE KEY UPDATE setting_value = '1', updated_at = NOW();
    END IF;
END//

DELIMITER ;

-- Procedure para reset mensal automático
DELIMITER //

CREATE PROCEDURE ResetMonthlyTrophies()
BEGIN
    DECLARE lastMonth VARCHAR(7);
    DECLARE archiveExists INT DEFAULT 0;
    
    -- Calcular mês anterior
    SET lastMonth = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m');
    
    -- Verificar se já existe arquivo para o mês anterior
    SELECT COUNT(*) INTO archiveExists 
    FROM trophies_archive 
    WHERE month_year = lastMonth;
    
    -- Se não existe arquivo, criar
    IF archiveExists = 0 THEN
        INSERT INTO trophies_archive (
            month_year, fisherman_name, fish_type, location, 
            image_url, weight, date, position, report_id, created_at
        )
        SELECT 
            DATE_FORMAT(date, '%Y-%m'), fisherman_name, fish_type, location,
            image_url, weight, date, position, report_id, NOW()
        FROM trophies 
        WHERE DATE_FORMAT(date, '%Y-%m') = lastMonth
        AND active = 1;
        
        -- Opcional: Limpar troféus do mês anterior da tabela principal
        -- DELETE FROM trophies WHERE DATE_FORMAT(date, '%Y-%m') = lastMonth;
    END IF;
    
    -- Atualizar ranking do mês atual
    CALL UpdateCurrentMonthRanking();
END//

CREATE PROCEDURE UpdateCurrentMonthRanking()
BEGIN
    DECLARE currentMonth VARCHAR(7);
    DECLARE done INT DEFAULT FALSE;
    DECLARE pos INT DEFAULT 1;
    DECLARE rep_id, rep_user_name, rep_fish_type, rep_location, rep_weight, rep_images VARCHAR(500);
    DECLARE rep_date DATETIME;
    DECLARE rep_cursor CURSOR FOR
        SELECT 
            r.id, u.name, r.fish_species, l.name, r.fish_weight, r.images, r.created_at
        FROM reports r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN locations l ON r.location_id = l.id
        WHERE DATE_FORMAT(r.created_at, '%Y-%m') = currentMonth
        AND r.fish_species IS NOT NULL 
        AND r.fish_species != ''
        AND r.location_id IS NOT NULL 
        AND JSON_LENGTH(r.images) > 0
        AND r.is_public = 1
        ORDER BY 
            CASE 
                WHEN r.fish_weight IS NOT NULL AND r.fish_weight != '' THEN 
                    CAST(REPLACE(REPLACE(r.fish_weight, 'kg', ''), ',', '.') AS DECIMAL(10,2))
                ELSE 0 
            END DESC,
            r.likes_count DESC,
            r.created_at ASC
        LIMIT 10;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    SET currentMonth = DATE_FORMAT(CURDATE(), '%Y-%m');
    
    -- Limpar ranking atual do mês
    DELETE FROM trophies WHERE DATE_FORMAT(date, '%Y-%m') = currentMonth;
    
    -- Inserir novo ranking
    OPEN rep_cursor;
    
    read_loop: LOOP
        FETCH rep_cursor INTO rep_id, rep_user_name, rep_fish_type, rep_location, rep_weight, rep_images, rep_date;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        INSERT INTO trophies (
            fisherman_name, fish_type, location, image_url, 
            weight, date, position, report_id, active, created_at
        ) VALUES (
            rep_user_name, rep_fish_type, COALESCE(rep_location, 'Local não informado'), 
            JSON_UNQUOTE(JSON_EXTRACT(rep_images, '$[0]')),
            rep_weight, rep_date, pos, rep_id, 1, NOW()
        );
        
        SET pos = pos + 1;
    END LOOP;
    
    CLOSE rep_cursor;
    
    -- Marcar que o ranking foi atualizado
    INSERT INTO system_settings (setting_key, setting_value, setting_type) 
    VALUES ('ranking_last_update', NOW(), 'string')
    ON DUPLICATE KEY UPDATE setting_value = NOW(), updated_at = NOW();
    
    INSERT INTO system_settings (setting_key, setting_value, setting_type) 
    VALUES ('ranking_needs_update', '0', 'boolean')
    ON DUPLICATE KEY UPDATE setting_value = '0', updated_at = NOW();
END//

DELIMITER ;

-- Event scheduler para execução automática (executar diariamente às 00:05)
CREATE EVENT IF NOT EXISTS daily_trophy_update
ON SCHEDULE EVERY 1 DAY
STARTS DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 5 MINUTE)
DO
BEGIN
    CALL ResetMonthlyTrophies();
END;

-- Configurações iniciais
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES 
('trophy_ranking_enabled', '1', 'boolean', 'Ativar ranking automático de troféus'),
('trophy_min_weight', '0', 'number', 'Peso mínimo para aparecer no ranking (kg)'),
('trophy_max_entries', '10', 'number', 'Número máximo de troféus no ranking'),
('ranking_needs_update', '0', 'boolean', 'Indica se o ranking precisa ser atualizado'),
('ranking_last_update', '', 'string', 'Data da última atualização do ranking')
ON DUPLICATE KEY UPDATE setting_key = setting_key;