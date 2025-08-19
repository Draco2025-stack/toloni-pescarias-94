<?php
/**
 * CONFIGURAÇÃO FINAL PARA MIGRAÇÃO HOSTINGER
 * Sistema 100% pronto para produção
 */

// ====================================
// CONFIGURAÇÕES DE BANCO DE DADOS
// ====================================
// ATUALIZAR COM CREDENCIAIS REAIS DA HOSTINGER
define('HOSTINGER_DB_HOST', 'localhost');
define('HOSTINGER_DB_NAME', 'u123456789_toloni');    // Alterar para nome real
define('HOSTINGER_DB_USER', 'u123456789_user');      // Alterar para usuário real  
define('HOSTINGER_DB_PASS', 'SuaSenhaSegura123!');   // Alterar para senha real
define('HOSTINGER_DB_CHARSET', 'utf8mb4');

// ====================================
// CONFIGURAÇÕES DE DOMÍNIO E HTTPS
// ====================================
define('SITE_URL', 'https://tolonipescarias.com.br');
define('API_URL', 'https://tolonipescarias.com.br/api');
define('FORCE_HTTPS', true);

// ====================================
// CONFIGURAÇÕES DE COOKIES SEGUROS
// ====================================
define('COOKIE_DOMAIN', '.tolonipescarias.com.br');
define('COOKIE_SECURE', true);    // HTTPS obrigatório
define('COOKIE_HTTPONLY', true);
define('COOKIE_SAMESITE', 'Lax');
define('SESSION_LIFETIME', 7 * 24 * 60 * 60); // 7 dias

// ====================================
// CONFIGURAÇÕES DE EMAIL SMTP
// ====================================
define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'noreply@tolonipescarias.com.br');
define('SMTP_PASSWORD', 'SuaSenhaEmail123!');      // Alterar para senha real
define('SMTP_FROM_NAME', 'Toloni Pescarias');

// ====================================
// CHAVES DE SEGURANÇA
// ====================================
// GERAR NOVAS CHAVES PARA PRODUÇÃO
define('JWT_SECRET', 'SuaChaveJWTSuperSecretaAqui123!@#');
define('ENCRYPTION_KEY', 'SuaChaveDeCriptografiaAqui456$%^');
define('SECURITY_SALT', 'SeuSaltDeSegurancaAqui789&*()');

// ====================================
// CONFIGURAÇÕES DE PRODUÇÃO
// ====================================
define('PRODUCTION_MODE', true);
define('DEBUG_MODE', false);
define('ERROR_REPORTING', false);

// ====================================
// LOGS DE SEGURANÇA
// ====================================
define('SECURITY_LOG_ENABLED', true);
define('SECURITY_LOG_FILE', '/home/u123456789/domains/tolonipescarias.com.br/logs/security.log');

// ====================================
// SISTEMA DE BACKUP
// ====================================
define('BACKUP_ENABLED', true);
define('BACKUP_PATH', '/home/u123456789/domains/tolonipescarias.com.br/backups/');
define('BACKUP_RETENTION_DAYS', 30);

// ====================================
// CONFIGURAÇÕES DE PERFORMANCE
// ====================================
define('ENABLE_CACHE', true);
define('CACHE_LIFETIME', 3600); // 1 hora
define('ENABLE_GZIP', true);

// ====================================
// VALIDAÇÃO DE SISTEMA
// ====================================
function validateHostingerConfig() {
    $errors = [];
    
    // Verificar extensões PHP necessárias
    if (!extension_loaded('pdo_mysql')) {
        $errors[] = 'Extensão PDO MySQL não disponível';
    }
    
    if (!extension_loaded('openssl')) {
        $errors[] = 'Extensão OpenSSL não disponível';
    }
    
    if (!extension_loaded('curl')) {
        $errors[] = 'Extensão cURL não disponível';
    }
    
    // Verificar permissões de diretório
    if (!is_writable(dirname(SECURITY_LOG_FILE))) {
        $errors[] = 'Diretório de logs não é gravável';
    }
    
    if (!is_writable(BACKUP_PATH)) {
        $errors[] = 'Diretório de backup não é gravável';
    }
    
    return $errors;
}

// ====================================
// INSTRUÇÕES DE MIGRAÇÃO
// ====================================
/*
CHECKLIST DE MIGRAÇÃO PARA HOSTINGER:

1. PREPARAÇÃO DOS ARQUIVOS:
   ✓ Build do React: npm run build
   ✓ Upload da pasta dist/ para public_html/
   ✓ Upload dos arquivos PHP (api/, config/, includes/, admin/)
   ✓ Configurar permissões (644 para arquivos, 755 para diretórios)

2. CONFIGURAÇÃO DO BANCO:
   ✓ Criar banco de dados na Hostinger
   ✓ Atualizar credenciais neste arquivo
   ✓ Importar database/schema.sql
   ✓ Importar database/trophies_schema.sql

3. CONFIGURAÇÃO DO DOMÍNIO:
   ✓ Configurar HTTPS/SSL
   ✓ Testar .htaccess (force HTTPS)
   ✓ Verificar roteamento SPA

4. CONFIGURAÇÃO DE EMAIL:
   ✓ Configurar conta SMTP na Hostinger
   ✓ Atualizar credenciais SMTP neste arquivo
   ✓ Testar envio de emails

5. SEGURANÇA:
   ✓ Gerar novas chaves de segurança
   ✓ Configurar logs de segurança
   ✓ Testar proteção de diretórios

6. TESTES FINAIS:
   ✓ Testar login/logout
   ✓ Testar registro de usuários
   ✓ Verificar sessões com cookies
   ✓ Testar sistema de troféus
   ✓ Configurar cron jobs

7. MONITORAMENTO:
   ✓ Verificar logs de erro PHP
   ✓ Monitorar logs de segurança
   ✓ Configurar backup automático
   ✓ Testar todas as funcionalidades

COMANDOS IMPORTANTES:
- Cron job mensal: 0 0 1 * * /usr/bin/php /path/to/api/cron_monthly_reset.php
- Verificar logs: tail -f logs/security.log
- Backup manual: php scripts/backup.php

URLS DE TESTE:
- https://tolonipescarias.com.br/api/auth/check-session.php
- https://tolonipescarias.com.br/admin/
- https://tolonipescarias.com.br/api/schedules.php
*/
?>