
<?php
// Toloni Pescarias - Instalador Automático
// Execute este arquivo apenas uma vez após fazer upload dos arquivos

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Verificar se já foi instalado
if (file_exists('config/installed.lock')) {
    die('O sistema já foi instalado. Remova o arquivo config/installed.lock para reinstalar.');
}

$step = $_GET['step'] ?? 1;
$errors = [];
$success = [];

// Configurações padrão
$config = [
    'db_host' => 'localhost',
    'db_name' => 'toloni_pescarias',
    'db_user' => '',
    'db_pass' => '',
    'admin_name' => 'Otto Toloni',
    'admin_email' => 'otto@tolonipescarias.com',
    'admin_password' => '',
    'site_url' => 'https://' . $_SERVER['HTTP_HOST']
];

// Salvar configurações na sessão
session_start();
if ($_POST) {
    foreach ($config as $key => $default) {
        if (isset($_POST[$key])) {
            $_SESSION['install_config'][$key] = $_POST[$key];
        }
    }
}

// Carregar configurações da sessão
if (isset($_SESSION['install_config'])) {
    $config = array_merge($config, $_SESSION['install_config']);
}

function checkRequirements() {
    $requirements = [
        'PHP Version >= 7.4' => version_compare(PHP_VERSION, '7.4.0', '>='),
        'PDO Extension' => extension_loaded('pdo'),
        'PDO MySQL Extension' => extension_loaded('pdo_mysql'),
        'GD Extension' => extension_loaded('gd'),
        'FileInfo Extension' => extension_loaded('fileinfo'),
        'JSON Extension' => extension_loaded('json'),
        'Session Support' => function_exists('session_start'),
        'config/ directory writable' => is_writable('config'),
        'assets/uploads/ directory writable' => is_writable('assets/uploads'),
    ];
    
    return $requirements;
}

function testDatabaseConnection($host, $user, $pass, $dbname = null) {
    try {
        $dsn = "mysql:host=$host" . ($dbname ? ";dbname=$dbname" : "");
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        return $pdo;
    } catch (PDOException $e) {
        return false;
    }
}

function createDatabase($host, $user, $pass, $dbname) {
    try {
        $pdo = new PDO("mysql:host=$host", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        return true;
    } catch (PDOException $e) {
        return $e->getMessage();
    }
}

function runSQLFile($pdo, $filename) {
    $sql = file_get_contents($filename);
    
    // Remover comentários e dividir em statements
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) { 
            return !empty($stmt) && !preg_match('/^--/', $stmt); 
        }
    );
    
    foreach ($statements as $statement) {
        if (!empty(trim($statement))) {
            try {
                $pdo->exec($statement);
            } catch (PDOException $e) {
                // Ignorar erros de tabelas que já existem
                if (strpos($e->getMessage(), 'already exists') === false) {
                    throw $e;
                }
            }
        }
    }
    
    return true;
}

function createConfigFile($config) {
    $configContent = "<?php
// Toloni Pescarias - Configuração de Banco de Dados
// Gerado automaticamente pelo instalador

define('DB_HOST', '{$config['db_host']}');
define('DB_NAME', '{$config['db_name']}');
define('DB_USER', '{$config['db_user']}');
define('DB_PASS', '{$config['db_pass']}');
define('DB_CHARSET', 'utf8mb4');

define('SITE_URL', '{$config['site_url']}');
define('ADMIN_EMAIL', '{$config['admin_email']}');

try {
    \$dsn = \"mysql:host=\" . DB_HOST . \";dbname=\" . DB_NAME . \";charset=\" . DB_CHARSET;
    \$options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_PERSISTENT => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => \"SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci\"
    ];
    
    \$pdo = new PDO(\$dsn, DB_USER, DB_PASS, \$options);
} catch (PDOException \$e) {
    error_log(\"Database connection failed: \" . \$e->getMessage());
    die(\"Erro de conexão com o banco de dados. Tente novamente mais tarde.\");
}

// Função para executar queries de forma segura
function executeQuery(\$pdo, \$sql, \$params = []) {
    try {
        \$stmt = \$pdo->prepare(\$sql);
        \$stmt->execute(\$params);
        return \$stmt;
    } catch (PDOException \$e) {
        error_log(\"Query error: \" . \$e->getMessage() . \" | SQL: \" . \$sql);
        throw \$e;
    }
}

// Função para log de segurança
function logSecurityEvent(\$pdo, \$user_id, \$action, \$details = '') {
    \$ip = \$_SERVER['REMOTE_ADDR'] ?? 'unknown';
    \$user_agent = \$_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    
    \$sql = \"INSERT INTO security_logs (user_id, action, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?)\";
    executeQuery(\$pdo, \$sql, [\$user_id, \$action, \$ip, \$user_agent, \$details]);
}
?>";

    return file_put_contents('config/database.php', $configContent);
}

// Processar formulários
if ($_POST && $step == 2) {
    // Testar conexão com banco
    $pdo = testDatabaseConnection($config['db_host'], $config['db_user'], $config['db_pass']);
    if (!$pdo) {
        $errors[] = 'Não foi possível conectar ao banco de dados. Verifique as credenciais.';
    }
}

if ($_POST && $step == 3) {
    try {
        // Criar banco de dados
        $result = createDatabase($config['db_host'], $config['db_user'], $config['db_pass'], $config['db_name']);
        if ($result !== true) {
            $errors[] = 'Erro ao criar banco de dados: ' . $result;
        } else {
            // Conectar ao banco criado
            $pdo = testDatabaseConnection($config['db_host'], $config['db_user'], $config['db_pass'], $config['db_name']);
            if (!$pdo) {
                $errors[] = 'Banco criado mas não foi possível conectar.';
            } else {
                // Executar schema SQL
                if (file_exists('database/schema.sql')) {
                    runSQLFile($pdo, 'database/schema.sql');
                    
                    // Criar usuário administrador Otto
                    require_once 'config/admin_config.php';
                    
                    $password_hash = password_hash($config['admin_password'], PASSWORD_BCRYPT, ['cost' => 12]);
                    $is_admin = determineAdminStatus($config['admin_email']);
                    
                    $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, is_admin) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$config['admin_name'], $config['admin_email'], $password_hash, $is_admin]);
                    
                    $success[] = 'Banco de dados configurado com sucesso!';
                } else {
                    $errors[] = 'Arquivo database/schema.sql não encontrado.';
                }
            }
        }
    } catch (Exception $e) {
        $errors[] = 'Erro durante instalação: ' . $e->getMessage();
    }
}

if ($_POST && $step == 4) {
    // Criar arquivo de configuração
    if (createConfigFile($config)) {
        // Criar diretórios necessários
        $dirs = ['assets/uploads', 'config', 'temp', 'logs'];
        foreach ($dirs as $dir) {
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
        }
        
        // Criar arquivo de bloqueio
        file_put_contents('config/installed.lock', date('Y-m-d H:i:s'));
        
        $success[] = 'Instalação concluída com sucesso!';
        $step = 5;
    } else {
        $errors[] = 'Erro ao criar arquivo de configuração.';
    }
}

?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Instalação - Toloni Pescarias</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .install-container { max-width: 800px; margin: 0 auto; padding: 2rem 1rem; }
        .install-card { background: white; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .step-indicator { background: #f8f9fa; padding: 1rem; border-radius: 15px 15px 0 0; }
        .step { display: inline-block; width: 40px; height: 40px; line-height: 40px; text-align: center; border-radius: 50%; margin-right: 10px; }
        .step.active { background: #0d6efd; color: white; }
        .step.completed { background: #198754; color: white; }
        .step.pending { background: #e9ecef; color: #6c757d; }
    </style>
</head>
<body>
    <div class="install-container">
        <div class="install-card">
            <!-- Indicador de passos -->
            <div class="step-indicator">
                <div class="d-flex justify-content-between align-items-center">
                    <h2 class="h4 mb-0"><i class="bi bi-fish"></i> Toloni Pescarias - Instalação</h2>
                    <div class="steps">
                        <span class="step <?php echo $step >= 1 ? ($step > 1 ? 'completed' : 'active') : 'pending'; ?>">1</span>
                        <span class="step <?php echo $step >= 2 ? ($step > 2 ? 'completed' : 'active') : 'pending'; ?>">2</span>
                        <span class="step <?php echo $step >= 3 ? ($step > 3 ? 'completed' : 'active') : 'pending'; ?>">3</span>
                        <span class="step <?php echo $step >= 4 ? ($step > 4 ? 'completed' : 'active') : 'pending'; ?>">4</span>
                        <span class="step <?php echo $step >= 5 ? 'active' : 'pending'; ?>">5</span>
                    </div>
                </div>
            </div>
            
            <div class="card-body p-4">
                <!-- Exibir erros -->
                <?php if (!empty($errors)): ?>
                    <div class="alert alert-danger">
                        <h6><i class="bi bi-exclamation-triangle"></i> Erros encontrados:</h6>
                        <ul class="mb-0">
                            <?php foreach ($errors as $error): ?>
                                <li><?php echo htmlspecialchars($error); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>
                
                <!-- Exibir sucessos -->
                <?php if (!empty($success)): ?>
                    <div class="alert alert-success">
                        <h6><i class="bi bi-check-circle"></i> Sucesso:</h6>
                        <ul class="mb-0">
                            <?php foreach ($success as $msg): ?>
                                <li><?php echo htmlspecialchars($msg); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>
                
                <?php if ($step == 1): ?>
                    <!-- Passo 1: Verificar requisitos -->
                    <h3>Passo 1: Verificação de Requisitos</h3>
                    <p class="text-muted">Verificando se o servidor atende aos requisitos mínimos...</p>
                    
                    <?php
                    $requirements = checkRequirements();
                    $allGood = true;
                    ?>
                    
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Requisito</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($requirements as $req => $status): ?>
                                    <tr>
                                        <td><?php echo $req; ?></td>
                                        <td>
                                            <?php if ($status): ?>
                                                <span class="badge bg-success"><i class="bi bi-check"></i> OK</span>
                                            <?php else: ?>
                                                <span class="badge bg-danger"><i class="bi bi-x"></i> Falhou</span>
                                                <?php $allGood = false; ?>
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                    
                    <?php if ($allGood): ?>
                        <div class="alert alert-success">
                            <i class="bi bi-check-circle"></i> Todos os requisitos foram atendidos!
                        </div>
                        <div class="d-grid">
                            <a href="?step=2" class="btn btn-primary btn-lg">
                                Próximo: Configuração do Banco <i class="bi bi-arrow-right"></i>
                            </a>
                        </div>
                    <?php else: ?>
                        <div class="alert alert-danger">
                            <i class="bi bi-exclamation-triangle"></i> 
                            Alguns requisitos não foram atendidos. Corrija-os antes de continuar.
                        </div>
                    <?php endif; ?>
                    
                <?php elseif ($step == 2): ?>
                    <!-- Passo 2: Configuração do banco -->
                    <h3>Passo 2: Configuração do Banco de Dados</h3>
                    <p class="text-muted">Configure as credenciais do banco de dados MySQL...</p>
                    
                    <form method="POST">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Host do Banco</label>
                                <input type="text" class="form-control" name="db_host" 
                                       value="<?php echo htmlspecialchars($config['db_host']); ?>" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Nome do Banco</label>
                                <input type="text" class="form-control" name="db_name" 
                                       value="<?php echo htmlspecialchars($config['db_name']); ?>" required>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Usuário do Banco</label>
                                <input type="text" class="form-control" name="db_user" 
                                       value="<?php echo htmlspecialchars($config['db_user']); ?>" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Senha do Banco</label>
                                <input type="password" class="form-control" name="db_pass" 
                                       value="<?php echo htmlspecialchars($config['db_pass']); ?>">
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">URL do Site</label>
                            <input type="url" class="form-control" name="site_url" 
                                   value="<?php echo htmlspecialchars($config['site_url']); ?>" required>
                        </div>
                        
                        <div class="d-grid">
                            <button type="submit" class="btn btn-primary btn-lg">
                                Testar Conexão <i class="bi bi-arrow-right"></i>
                            </button>
                        </div>
                    </form>
                    
                <?php elseif ($step == 3 && empty($errors)): ?>
                    <!-- Passo 3: Criar usuário admin -->
                    <h3>Passo 3: Criar Administrador</h3>
                    <p class="text-muted">Configure a conta do administrador do sistema...</p>
                    
                    <form method="POST">
                        <div class="mb-3">
                            <label class="form-label">Nome do Administrador</label>
                            <input type="text" class="form-control" name="admin_name" 
                                   value="<?php echo htmlspecialchars($config['admin_name']); ?>" required>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Email do Administrador</label>
                            <input type="email" class="form-control" name="admin_email" 
                                   value="<?php echo htmlspecialchars($config['admin_email']); ?>" required>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Senha do Administrador</label>
                            <input type="password" class="form-control" name="admin_password" 
                                   value="<?php echo htmlspecialchars($config['admin_password']); ?>" 
                                   required minlength="8">
                            <div class="form-text">Mínimo 8 caracteres, incluindo maiúscula, minúscula e número</div>
                        </div>
                        
                        <div class="d-grid">
                            <button type="submit" class="btn btn-primary btn-lg">
                                Configurar Banco de Dados <i class="bi bi-arrow-right"></i>
                            </button>
                        </div>
                    </form>
                    
                <?php elseif ($step == 4 && empty($errors)): ?>
                    <!-- Passo 4: Finalizar instalação -->
                    <h3>Passo 4: Finalizar Instalação</h3>
                    <p class="text-muted">Tudo pronto! Clique para finalizar a instalação.</p>
                    
                    <div class="alert alert-info">
                        <h6><i class="bi bi-info-circle"></i> Resumo da Configuração:</h6>
                        <ul class="mb-0">
                            <li><strong>Banco:</strong> <?php echo htmlspecialchars($config['db_name']); ?> em <?php echo htmlspecialchars($config['db_host']); ?></li>
                            <li><strong>Admin:</strong> <?php echo htmlspecialchars($config['admin_email']); ?></li>
                            <li><strong>Site:</strong> <?php echo htmlspecialchars($config['site_url']); ?></li>
                        </ul>
                    </div>
                    
                    <form method="POST">
                        <div class="d-grid">
                            <button type="submit" class="btn btn-success btn-lg">
                                <i class="bi bi-check-circle"></i> Finalizar Instalação
                            </button>
                        </div>
                    </form>
                    
                <?php elseif ($step == 5): ?>
                    <!-- Passo 5: Conclusão -->
                    <div class="text-center">
                        <div class="mb-4">
                            <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
                        </div>
                        <h3 class="text-success">Instalação Concluída!</h3>
                        <p class="text-muted mb-4">
                            O Toloni Pescarias foi instalado com sucesso e está pronto para uso.
                        </p>
                        
                        <div class="alert alert-warning">
                            <h6><i class="bi bi-exclamation-triangle"></i> Importante:</h6>
                            <p class="mb-0">Por segurança, remova ou renomeie o arquivo <code>install.php</code> do servidor.</p>
                        </div>
                        
                        <div class="d-grid gap-2 d-md-flex justify-content-md-center">
                            <a href="/" class="btn btn-primary btn-lg">
                                <i class="bi bi-house"></i> Ir para o Site
                            </a>
                            <a href="/admin" class="btn btn-outline-primary btn-lg">
                                <i class="bi bi-gear"></i> Painel Admin
                            </a>
                        </div>
                        
                        <hr class="my-4">
                        
                        <div class="row text-start">
                            <div class="col-md-6">
                                <h6>Credenciais de Acesso:</h6>
                                <ul class="small">
                                    <li><strong>Email:</strong> <?php echo htmlspecialchars($config['admin_email']); ?></li>
                                    <li><strong>Senha:</strong> (a que você definiu)</li>
                                </ul>
                            </div>
                            <div class="col-md-6">
                                <h6>Próximos Passos:</h6>
                                <ul class="small">
                                    <li>Faça login no painel administrativo</li>
                                    <li>Configure o carrossel da homepage</li>
                                    <li>Adicione localidades de pesca</li>
                                    <li>Personalize as configurações</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                <?php else: ?>
                    <!-- Voltar ao passo anterior se houver erros -->
                    <div class="d-grid">
                        <a href="?step=<?php echo max(1, $step - 1); ?>" class="btn btn-secondary btn-lg">
                            <i class="bi bi-arrow-left"></i> Voltar
                        </a>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        
        <div class="text-center mt-3">
            <small class="text-white">
                Toloni Pescarias v1.0 - Sistema de Gestão de Experiências de Pesca
            </small>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
