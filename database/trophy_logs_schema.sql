-- Tabela para logs das operações de troféus
-- Execute este SQL no phpMyAdmin da Hostinger

CREATE TABLE IF NOT EXISTS `trophy_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `data` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_trophy_logs_action` (`action`),
  KEY `idx_trophy_logs_user_id` (`user_id`),
  KEY `idx_trophy_logs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;