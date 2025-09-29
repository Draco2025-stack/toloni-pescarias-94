<?php
// Configurações específicas para produção na Hostinger
// DEPRECADO: Use config/environment.php e .env em vez deste arquivo

require_once __DIR__ . '/environment.php';

// Todas as configurações agora são carregadas via variáveis de ambiente
// Veja .env.example para a lista completa de variáveis necessárias

// Configurações de segurança para produção
define('PRODUCTION_MODE', true);
define('DEBUG_MODE', false);

// Configurações de cookie para produção
define('COOKIE_DOMAIN', '.tolonipescarias.com.br');
define('COOKIE_SECURE', true);  // HTTPS obrigatório
define('COOKIE_HTTPONLY', true);
define('COOKIE_SAMESITE', 'Lax');

// Configurações de sessão para produção
define('SESSION_LIFETIME', 7 * 24 * 60 * 60); // 7 dias
define('SESSION_GC_MAXLIFETIME', 7 * 24 * 60 * 60);

// URLs para produção
define('SITE_URL', 'https://tolonipescarias.com.br');
define('API_URL', 'https://tolonipescarias.com.br/api');

// Configurações de email para produção (se necessário)
define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'noreply@tolonipescarias.com.br');
define('SMTP_PASSWORD', 'SuaSenhaEmail123');

// Chaves de segurança (gerar novas para produção)
define('JWT_SECRET', 'sua-chave-jwt-super-secreta-aqui');
define('ENCRYPTION_KEY', 'sua-chave-de-criptografia-aqui');

// Log de segurança
define('SECURITY_LOG_ENABLED', true);
define('SECURITY_LOG_FILE', '/logs/security.log');

// IMPORTANTE: 
// 1. Alterar todas as senhas e credenciais antes de usar em produção
// 2. Verificar se o banco de dados está criado na Hostinger
// 3. Importar o schema do banco (database/schema.sql)
// 4. Configurar HTTPS no domínio
// 5. Testar todas as funcionalidades após a migração
?>