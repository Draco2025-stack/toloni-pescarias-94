-- Schema simplificado para Hostinger (sem triggers, procedures ou events)
-- Execução: Copie e cole este SQL no phpMyAdmin da Hostinger

-- Tabela de troféus do mês atual
CREATE TABLE IF NOT EXISTS `trophies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fisherman_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fish_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `weight` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `position` int(11) NOT NULL DEFAULT '0',
  `report_id` int(11) NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_trophies_date` (`date`),
  KEY `idx_trophies_position` (`position`),
  KEY `idx_trophies_active` (`active`),
  KEY `idx_trophies_report_id` (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de arquivo de troféus históricos
CREATE TABLE IF NOT EXISTS `trophies_archive` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `month_year` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Format: YYYY-MM',
  `fisherman_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fish_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `weight` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` timestamp NULL DEFAULT NULL,
  `position` int(11) NOT NULL DEFAULT '0',
  `report_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_trophies_archive_month` (`month_year`),
  KEY `idx_trophies_archive_position` (`position`),
  KEY `idx_trophies_archive_report_id` (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configurações do sistema (se não existir)
INSERT IGNORE INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
('trophy_ranking_enabled', '1', 'Enable automatic trophy ranking system'),
('trophy_max_entries', '10', 'Maximum number of entries in trophy ranking');