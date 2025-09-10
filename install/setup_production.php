#!/usr/bin/env php
<?php
// Script de configuração para produção na Hostinger
// Executar uma única vez após fazer upload dos arquivos

echo "=== CONFIGURAÇÃO DE PRODUÇÃO - TOLONI PESCARIAS ===\n\n";

// Verificar se está rodando via CLI
if (php_sapi_name() !== 'cli') {
    die("Este script deve ser executado via linha de comando.\n");
}

// Verificar configurações do PHP
echo "1. Verificando configurações do PHP...\n";
echo "Versão do PHP: " . PHP_VERSION . "\n";
echo "Upload máximo: " . ini_get('upload_max_filesize') . "\n";
echo "Post máximo: " . ini_get('post_max_size') . "\n";
echo "Limite de memória: " . ini_get('memory_limit') . "\n";

// Verificar extensões necessárias
$requiredExtensions = ['pdo', 'pdo_mysql', 'gd', 'curl', 'mbstring', 'json'];
echo "\n2. Verificando extensões...\n";
foreach ($requiredExtensions as $ext) {
    if (extension_loaded($ext)) {
        echo "✓ $ext\n";
    } else {
        echo "✗ $ext (FALTANDO!)\n";
    }
}

// Criar diretórios necessários
echo "\n3. Criando diretórios...\n";
$directories = [
    'uploads/profiles',
    'uploads/carousels', 
    'uploads/reports',
    'uploads/general',
    'logs',
    'backups'
];

foreach ($directories as $dir) {
    if (!is_dir($dir)) {
        if (mkdir($dir, 0755, true)) {
            echo "✓ Criado: $dir\n";
        } else {
            echo "✗ Erro ao criar: $dir\n";
        }
    } else {
        echo "- Já existe: $dir\n";
    }
}

// Configurar permissões
echo "\n4. Configurando permissões...\n";
$writableDirs = ['uploads', 'logs', 'backups'];
foreach ($writableDirs as $dir) {
    if (is_dir($dir)) {
        chmod($dir, 0755);
        echo "✓ Permissões configuradas para: $dir\n";
    }
}

// Testar conexão com banco de dados
echo "\n5. Testando conexão com banco de dados...\n";
try {
    require_once '../config/database.php';
    echo "✓ Conexão com banco de dados estabelecida\n";
    
    // Verificar se tabelas principais existem
    $tables = ['users', 'reports', 'comments', 'locations'];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "✓ Tabela '$table' existe\n";
        } else {
            echo "✗ Tabela '$table' não encontrada\n";
        }
    }
    
} catch (Exception $e) {
    echo "✗ Erro na conexão: " . $e->getMessage() . "\n";
}

// Verificar configurações de email
echo "\n6. Verificando configurações de email...\n";
if (defined('SMTP_HOST') && defined('SMTP_USERNAME')) {
    echo "✓ Configurações SMTP definidas\n";
} else {
    echo "! Configure as constantes SMTP em hostinger_production.php\n";
}

// Criar arquivo .htaccess se não existir
echo "\n7. Configurando .htaccess...\n";
$htaccessContent = <<<'EOD'
# Proteção de arquivos PHP
<Files "*.php">
    <RequireAll>
        Require all denied
        Require local
    </RequireAll>
</Files>

# Bloquear acesso aos diretórios sensíveis
RedirectMatch 403 ^/config/
RedirectMatch 403 ^/database/
RedirectMatch 403 ^/logs/
RedirectMatch 403 ^/backups/
RedirectMatch 403 ^/install/

# Configurações de cache
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
</IfModule>

# Compressão
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Segurança adicional
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set X-XSS-Protection "1; mode=block"
EOD;

if (!file_exists('../.htaccess')) {
    file_put_contents('../.htaccess', $htaccessContent);
    echo "✓ Arquivo .htaccess criado\n";
} else {
    echo "- Arquivo .htaccess já existe\n";
}

// Instruções finais
echo "\n=== CONFIGURAÇÃO CONCLUÍDA ===\n\n";
echo "PRÓXIMOS PASSOS:\n";
echo "1. Configure as credenciais do banco no config/database.php\n";
echo "2. Configure as credenciais SMTP no config/hostinger_production.php\n";
echo "3. Execute o schema SQL no seu banco de dados:\n";
echo "   - database/main_schema.sql\n";
echo "   - database/user_settings_schema.sql\n";
echo "   - database/rate_limits_schema.sql\n";
echo "4. Configure os cron jobs no cPanel:\n";
echo "   - Backup diário: php /path/to/cron/backup_database.php\n";
echo "   - Limpeza de hora em hora: php /path/to/cron/cleanup_sessions.php\n";
echo "5. Teste todas as funcionalidades antes de colocar em produção\n\n";

echo "IMPORTANTE:\n";
echo "- Mantenha as credenciais seguras\n";
echo "- Configure SSL/HTTPS\n";
echo "- Configure backup automático\n";
echo "- Monitore os logs regularmente\n";
?>