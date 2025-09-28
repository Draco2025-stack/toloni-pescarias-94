#!/usr/bin/env php
<?php
/**
 * Script de configuração e validação para produção
 * Execute este script após fazer upload dos arquivos para verificar se tudo está correto
 */

// Include environment configuration
require_once __DIR__ . '/../config/environment.php';

echo "=== SETUP DE PRODUÇÃO - TOLONI PESCARIAS ===\n\n";

// Verificar se está rodando via CLI ou web
$isCLI = php_sapi_name() === 'cli';
if (!$isCLI) {
    echo "<pre>";
}

// 1. Verificar configurações do PHP
echo "1. VERIFICANDO CONFIGURAÇÕES DO PHP...\n";
echo "   Versão do PHP: " . PHP_VERSION . "\n";
echo "   Upload máximo: " . ini_get('upload_max_filesize') . "\n";
echo "   Post máximo: " . ini_get('post_max_size') . "\n";
echo "   Limite de memória: " . ini_get('memory_limit') . "\n";
echo "   Limite de execução: " . ini_get('max_execution_time') . "s\n";

// 2. Verificar extensões necessárias
echo "\n2. VERIFICANDO EXTENSÕES PHP...\n";
$requiredExtensions = ['pdo', 'pdo_mysql', 'gd', 'curl', 'mbstring', 'json', 'openssl'];
$missingExtensions = [];

foreach ($requiredExtensions as $ext) {
    if (extension_loaded($ext)) {
        echo "   ✓ $ext\n";
    } else {
        echo "   ✗ $ext (FALTANDO!)\n";
        $missingExtensions[] = $ext;
    }
}

// 3. Verificar configurações de ambiente
echo "\n3. VERIFICANDO CONFIGURAÇÕES DE AMBIENTE...\n";
$config = getAppConfig();
echo "   Ambiente: " . ($config['is_production'] ? 'PRODUÇÃO' : 'DESENVOLVIMENTO') . "\n";
echo "   Debug: " . ($config['debug_mode'] ? 'ATIVADO' : 'DESATIVADO') . "\n";
echo "   Site URL: " . $config['site_url'] . "\n";
echo "   API URL: " . $config['api_url'] . "\n";

// 4. Testar conexão com banco de dados
echo "\n4. TESTANDO CONEXÃO COM BANCO DE DADOS...\n";
$dbError = null;
try {
    $dsn = "mysql:host={$config['db_host']};dbname={$config['db_name']};charset={$config['db_charset']}";
    $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
    
    echo "   ✓ Conexão estabelecida com sucesso\n";
    
    // Verificar tabelas principais
    echo "   Verificando tabelas...\n";
    $requiredTables = [
        'users', 'reports', 'comments', 'locations', 'carousels', 
        'user_settings', 'rate_limits', 'security_logs', 'trophies'
    ];
    
    $missingTables = [];
    foreach ($requiredTables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "     ✓ Tabela '$table' existe\n";
        } else {
            echo "     ✗ Tabela '$table' não encontrada\n";
            $missingTables[] = $table;
        }
    }
    
} catch (Exception $e) {
    $dbError = $e->getMessage();
    echo "   ✗ Erro na conexão: " . $dbError . "\n";
}

// 5. Criar e verificar diretórios necessários
echo "\n5. CRIANDO/VERIFICANDO DIRETÓRIOS...\n";
$directories = [
    $config['upload_path'] . '/profiles',
    $config['upload_path'] . '/carousels',
    $config['upload_path'] . '/reports', 
    $config['upload_path'] . '/general',
    $config['log_path'],
    $config['backup_path']
];

$directoryErrors = [];
foreach ($directories as $dir) {
    if (!is_dir($dir)) {
        if (@mkdir($dir, 0755, true)) {
            echo "   ✓ Criado: $dir\n";
        } else {
            echo "   ✗ Erro ao criar: $dir\n";
            $directoryErrors[] = $dir;
        }
    } else {
        if (is_writable($dir)) {
            echo "   ✓ Existe e é gravável: $dir\n";
        } else {
            echo "   ✗ Existe mas não é gravável: $dir\n";
            $directoryErrors[] = $dir;
        }
    }
}

// 6. Testar configurações de email
echo "\n6. VERIFICANDO CONFIGURAÇÕES DE EMAIL...\n";
if (!empty($config['smtp_username']) && !empty($config['smtp_password'])) {
    echo "   ✓ Credenciais SMTP configuradas\n";
    echo "   Host: " . $config['smtp_host'] . ":" . $config['smtp_port'] . "\n";
    echo "   Usuário: " . $config['smtp_username'] . "\n";
    echo "   Email remetente: " . $config['smtp_from_email'] . "\n";
    
    // Testar conexão SMTP (básica)
    try {
        $fp = @fsockopen($config['smtp_host'], $config['smtp_port'], $errno, $errstr, 10);
        if ($fp) {
            echo "   ✓ Conectividade SMTP OK\n";
            fclose($fp);
        } else {
            echo "   ✗ Não foi possível conectar ao servidor SMTP\n";
        }
    } catch (Exception $e) {
        echo "   ! Erro ao testar SMTP: " . $e->getMessage() . "\n";
    }
} else {
    echo "   ! Credenciais SMTP não configuradas\n";
}

// 7. Verificar chaves de segurança
echo "\n7. VERIFICANDO SEGURANÇA...\n";
$securityIssues = [];

if ($config['jwt_secret'] === 'change-this-in-production') {
    echo "   ✗ Chave JWT usando valor padrão! ALTERE IMEDIATAMENTE!\n";
    $securityIssues[] = 'JWT Secret';
}

if ($config['encryption_key'] === 'change-this-in-production') {
    echo "   ✗ Chave de criptografia usando valor padrão! ALTERE IMEDIATAMENTE!\n";
    $securityIssues[] = 'Encryption Key';
}

if (empty($securityIssues)) {
    echo "   ✓ Chaves de segurança configuradas\n";
}

// 8. Verificar arquivos críticos
echo "\n8. VERIFICANDO ARQUIVOS CRÍTICOS...\n";
$criticalFiles = [
    __DIR__ . '/../api/phpmailer/src/PHPMailer.php',
    __DIR__ . '/../api/phpmailer/src/SMTP.php',
    __DIR__ . '/../api/phpmailer/src/Exception.php',
    __DIR__ . '/../.htaccess'
];

$missingFiles = [];
foreach ($criticalFiles as $file) {
    if (file_exists($file)) {
        echo "   ✓ " . basename($file) . "\n";
    } else {
        echo "   ✗ FALTANDO: " . basename($file) . "\n";
        $missingFiles[] = basename($file);
    }
}

// 9. Resumo final
echo "\n" . str_repeat("=", 50) . "\n";
echo "RESUMO DA VERIFICAÇÃO\n";
echo str_repeat("=", 50) . "\n";

$hasErrors = !empty($missingExtensions) || !empty($missingTables) || 
             !empty($directoryErrors) || !empty($securityIssues) || 
             !empty($missingFiles) || $dbError !== null;

if (!$hasErrors) {
    echo "✅ TUDO OK! Sistema pronto para produção.\n\n";
} else {
    echo "❌ PROBLEMAS ENCONTRADOS:\n\n";
    
    if (!empty($missingExtensions)) {
        echo "• Extensões PHP faltando: " . implode(', ', $missingExtensions) . "\n";
    }
    
    if ($dbError) {
        echo "• Erro de banco de dados: $dbError\n";
    }
    
    if (!empty($missingTables)) {
        echo "• Tabelas faltando: " . implode(', ', $missingTables) . "\n";
        echo "  Execute os arquivos SQL em database/\n";
    }
    
    if (!empty($directoryErrors)) {
        echo "• Problemas com diretórios: " . implode(', ', $directoryErrors) . "\n";
    }
    
    if (!empty($securityIssues)) {
        echo "• Problemas de segurança: " . implode(', ', $securityIssues) . "\n";
    }
    
    if (!empty($missingFiles)) {
        echo "• Arquivos faltando: " . implode(', ', $missingFiles) . "\n";
    }
    
    echo "\n";
}

// 10. Próximos passos
echo "PRÓXIMOS PASSOS:\n";
echo "1. Corrija os problemas listados acima (se houver)\n";
echo "2. Configure o arquivo .env com suas credenciais\n";
echo "3. Execute os schemas SQL se necessário\n";
echo "4. Configure HTTPS no seu domínio\n";
echo "5. Configure os cron jobs:\n";
echo "   - Backup: */0 2 * * * php " . __DIR__ . "/../cron/backup_database.php\n";
echo "   - Limpeza: 0 */1 * * * php " . __DIR__ . "/../cron/cleanup_sessions.php\n";
echo "6. Teste: " . $config['site_url'] . "/api/health.php\n";
echo "7. Monitore: " . $config['site_url'] . "/api/admin/system-status.php\n\n";

echo "IMPORTANTE:\n";
echo "• Mantenha backups regulares\n";
echo "• Monitore os logs em " . $config['log_path'] . "\n";
echo "• Verifique o sistema regularmente\n";

if (!$isCLI) {
    echo "</pre>";
}

exit($hasErrors ? 1 : 0);
?>