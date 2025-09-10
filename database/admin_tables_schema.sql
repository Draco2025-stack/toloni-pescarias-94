-- Tabelas para funcionalidades administrativas

-- Tabela para cronograma de pescarias
CREATE TABLE IF NOT EXISTS fishing_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME,
    max_participants INT,
    price DECIMAL(10,2),
    image_url VARCHAR(500),
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (date),
    INDEX idx_active (active)
);

-- Tabela para carrosséis (hero e experience)
CREATE TABLE IF NOT EXISTS carousels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500),
    type ENUM('hero', 'experience') DEFAULT 'hero',
    display_order INT DEFAULT 0,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type_order (type, display_order),
    INDEX idx_active (active)
);

-- Inserir alguns dados de exemplo para cronograma
INSERT IGNORE INTO fishing_schedules (title, description, location, date, time, max_participants, price) VALUES
('Pescaria no Rio Piracicaba', 'Pescaria de bagre e pintado no Rio Piracicaba. Inclui equipamentos e almoço.', 'Rio Piracicaba - SP', '2024-12-15', '06:00:00', 8, 150.00),
('Pescaria no Pesqueiro Toloni', 'Pescaria familiar no pesqueiro com estrutura completa.', 'Pesqueiro Toloni - Piracicaba/SP', '2024-12-20', '07:00:00', 12, 80.00),
('Pescaria Noturna', 'Pescaria noturna de traíra e lambari. Para pescadores experientes.', 'Represa Municipal - Piracicaba/SP', '2024-12-22', '18:00:00', 6, 120.00);

-- Inserir alguns dados de exemplo para carrossel hero
INSERT IGNORE INTO carousels (title, subtitle, image_url, type, display_order) VALUES
('Bem-vindo ao Toloni Pescarias', 'O melhor da pesca esportiva em Piracicaba e região', '/images/hero1.jpg', 'hero', 1),
('Compartilhe suas Pescarias', 'Registre seus melhores momentos e inspire outros pescadores', '/images/hero2.jpg', 'hero', 2),
('Explore Novos Locais', 'Descubra os melhores pontos de pesca da região', '/images/hero3.jpg', 'hero', 3);

-- Inserir alguns dados de exemplo para carrossel experience
INSERT IGNORE INTO carousels (title, subtitle, image_url, type, display_order) VALUES
('Pescaria em Família', 'Momentos únicos com quem você ama', '/images/exp1.jpg', 'experience', 1),
('Pesca Esportiva', 'Desafie seus limites na pesca esportiva', '/images/exp2.jpg', 'experience', 2),
('Troféus Incríveis', 'Conquiste seu lugar no ranking mensal', '/images/exp3.jpg', 'experience', 3);