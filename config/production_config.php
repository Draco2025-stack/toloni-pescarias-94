<?php
// Configurações finais para produção na Hostinger
// Este arquivo deve ser editado com as credenciais reais antes do deploy

// ========================================
// CONFIGURAÇÕES DE BANCO - HOSTINGER
// ========================================
define('PRODUCTION_DB_HOST', 'localhost');
define('PRODUCTION_DB_NAME', 'u123456789_toloni'); // Substituir pelo nome real do banco
define('PRODUCTION_DB_USER', 'u123456789_user');   // Substituir pelo usuário real
define('PRODUCTION_DB_PASS', 'SuaSenhaSegura123'); // Substituir pela senha real
define('PRODUCTION_DB_CHARSET', 'utf8mb4');

// ========================================
// CONFIGURAÇÕES DE DOMÍNIO E SEGURANÇA
// ========================================
define('PRODUCTION_SITE_URL', 'https://tolonipescarias.com.br');
define('PRODUCTION_API_URL', 'https://tolonipescarias.com.br/api');
define('PRODUCTION_DOMAIN', 'tolonipescarias.com.br');

// Forçar HTTPS em produção
define('FORCE_HTTPS', true);
define('COOKIE_SECURE', true);
define('COOKIE_DOMAIN', '.tolonipescarias.com.br');

// ========================================
// CHAVES DE SEGURANÇA - GERAR NOVAS!
// ========================================
define('JWT_SECRET_KEY', 'sua-chave-jwt-super-secreta-aqui-' . date('Y'));
define('ENCRYPTION_KEY', 'sua-chave-de-criptografia-aqui-' . date('Y'));
define('SECURITY_SALT', 'seu-salt-de-seguranca-aqui-' . date('Y'));

// ========================================
// EMAIL SMTP - HOSTINGER
// ========================================
define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'noreply@tolonipescarias.com.br');
define('SMTP_PASSWORD', 'SuaSenhaEmail123');
define('SMTP_FROM_NAME', 'Toloni Pescarias');

// ========================================
// CONFIGURAÇÕES DE PRODUÇÃO
// ========================================
define('PRODUCTION_MODE', true);
define('DEBUG_MODE', false);
define('ERROR_REPORTING', false);

// ========================================
// LOGS E MONITORAMENTO
// ========================================
define('ENABLE_SECURITY_LOGS', true);
define('LOG_FILE_PATH', '/logs/security.log');
define('LOG_MAX_SIZE', 10 * 1024 * 1024); // 10MB

// ========================================
// CONFIGURAÇÕES DE SESSÃO
// ========================================
define('SESSION_LIFETIME', 7 * 24 * 60 * 60); // 7 dias
define('SESSION_CLEANUP_PROBABILITY', 1); // 1% chance de limpeza automática

// ========================================
// CONFIGURAÇÕES DE BACKUP
// ========================================
define('ENABLE_AUTO_BACKUP', true);
define('BACKUP_PATH', '/backups/');
define('BACKUP_RETENTION_DAYS', 30);

// ========================================
// FUNÇÃO DE VALIDAÇÃO PRÉ-DEPLOY
// ========================================
function validateProductionConfig() {
    $errors = [];
    
    // Verificar extensões PHP necessárias
    if (!extension_loaded('pdo_mysql')) {
        $errors[] = 'Extensão PDO MySQL não instalada';
    }
    
    if (!extension_loaded('openssl')) {
        $errors[] = 'Extensão OpenSSL não instalada';
    }
    
    if (!extension_loaded('curl')) {
        $errors[] = 'Extensão cURL não instalada';
    }
    
    // Verificar permissões de diretório
    if (!is_writable('/logs')) {
        $errors[] = 'Diretório /logs não tem permissão de escrita';
    }
    
    if (!is_writable('/backups')) {
        $errors[] = 'Diretório /backups não tem permissão de escrita';
    }
    
    // Verificar se as chaves foram alteradas
    if (strpos(JWT_SECRET_KEY, 'sua-chave') !== false) {
        $errors[] = 'JWT_SECRET_KEY precisa ser alterada para produção';
    }
    
    if (strpos(ENCRYPTION_KEY, 'sua-chave') !== false) {
        $errors[] = 'ENCRYPTION_KEY precisa ser alterada para produção';
    }
    
    return $errors;
}

// ========================================
// CHECKLIST DE MIGRAÇÃO
// ========================================
/*
CHECKLIST FINAL PARA MIGRAÇÃO HOSTINGER:

□ 1. PREPARAÇÃO DE ARQUIVOS
   - Fazer build do React: npm run build
   - Copiar conteúdo de dist/ para public_html/
   - Enviar arquivos PHP (api/, config/, auth/, etc.)

□ 2. CONFIGURAÇÃO DO BANCO
   - Criar banco MySQL na Hostinger
   - Atualizar credenciais em PRODUCTION_DB_*
   - Importar schema.sql via phpMyAdmin
   - Importar trophies_schema.sql via phpMyAdmin

□ 3. CONFIGURAÇÃO DE DOMÍNIO
   - Verificar se SSL está ativo
   - Atualizar DNS se necessário
   - Testar HTTPS

□ 4. CONFIGURAÇÃO DE EMAIL
   - Criar conta noreply@tolonipescarias.com.br
   - Atualizar credenciais SMTP
   - Testar envio de email

□ 5. SEGURANÇA
   - Gerar novas chaves de segurança
   - Definir permissões corretas (644 para arquivos, 755 para pastas)
   - Ativar logs de segurança

□ 6. TESTES FINAIS
   - Testar login do admin: toloni.focos@gmail.com
   - Testar registro de novos usuários
   - Testar todas as funcionalidades principais
   - Verificar logs de erro

□ 7. MONITORAMENTO
   - Configurar backup automático
   - Verificar logs regularmente
   - Monitorar performance

COMANDOS IMPORTANTES:
- Build: npm run build
- Teste local: php -S localhost:8000
- Verificar logs: tail -f /logs/security.log

URLs DE TESTE APÓS DEPLOY:
- https://tolonipescarias.com.br/
- https://tolonipescarias.com.br/api/auth/check-session.php
- https://tolonipescarias.com.br/api/auth/login.php (POST)
*/
?>