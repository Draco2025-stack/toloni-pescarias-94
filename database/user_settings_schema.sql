-- Tabelas para configurações de usuário
-- Adicionar ao schema principal

-- Tabela de configurações de privacidade
CREATE TABLE user_privacy_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    profile_visibility TINYINT(1) DEFAULT 1,
    show_email TINYINT(1) DEFAULT 0,
    allow_messages TINYINT(1) DEFAULT 1,
    share_location TINYINT(1) DEFAULT 0,
    show_online_status TINYINT(1) DEFAULT 1,
    allow_tagging TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_privacy (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de configurações de notificações
CREATE TABLE user_notification_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    email_notifications TINYINT(1) DEFAULT 1,
    push_notifications TINYINT(1) DEFAULT 1,
    new_reports TINYINT(1) DEFAULT 1,
    new_comments TINYINT(1) DEFAULT 1,
    comment_replies TINYINT(1) DEFAULT 1,
    likes TINYINT(1) DEFAULT 1,
    follows TINYINT(1) DEFAULT 1,
    system_updates TINYINT(1) DEFAULT 1,
    newsletter TINYINT(1) DEFAULT 0,
    fishing_tips TINYINT(1) DEFAULT 1,
    location_suggestions TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_notifications (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir configurações padrão para usuários existentes
INSERT INTO user_privacy_settings (user_id, profile_visibility, show_email, allow_messages, share_location, show_online_status, allow_tagging)
SELECT id, 1, 0, 1, 0, 1, 1 FROM users 
WHERE NOT EXISTS (SELECT 1 FROM user_privacy_settings WHERE user_privacy_settings.user_id = users.id);

INSERT INTO user_notification_settings (user_id, email_notifications, push_notifications, new_reports, new_comments, comment_replies, likes, follows, system_updates, newsletter, fishing_tips, location_suggestions)
SELECT id, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1 FROM users 
WHERE NOT EXISTS (SELECT 1 FROM user_notification_settings WHERE user_notification_settings.user_id = users.id);