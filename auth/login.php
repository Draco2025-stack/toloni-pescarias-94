
<?php
$page_title = 'Login';
require_once '../config/database.php';
require_once '../config/session.php';
require_once '../config/security.php';

startSecureSession();

// Se já estiver logado, redirecionar
if (isLoggedIn()) {
    header('Location: /');
    exit;
}

$error = '';
$redirect = $_GET['redirect'] ?? '/';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = sanitizeEmail($_POST['email']);
    $password = $_POST['password'];
    $csrf_token = $_POST['csrf_token'];
    
    // Verificar CSRF
    if (!verifyCSRFToken($csrf_token)) {
        $error = 'Token de segurança inválido';
    } else {
        $ip = $_SERVER['REMOTE_ADDR'];
        
        // Verificar tentativas de login
        if (!checkLoginAttempts($pdo, $ip)) {
            $error = 'Muitas tentativas de login. Tente novamente em 15 minutos.';
            logSecurityEvent($pdo, null, 'LOGIN_BLOCKED', "IP bloqueado: $ip, Email: $email");
        } else {
            // Incluir configuração de admin
            require_once '../config/admin_config.php';
            
            try {
                $stmt = $pdo->prepare("SELECT id, name, email, password_hash, is_admin FROM users WHERE email = ?");
                $stmt->execute([$email]);
                $user = $stmt->fetch();
                
                if ($user && password_verify($password, $user['password_hash'])) {
                    // Login bem-sucedido
                    clearFailedLogins($pdo, $ip);
                    
                    // Atualizar último login
                    $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
                    $stmt->execute([$user['id']]);
                    
                    // Fazer login
                    loginUser($user);
                    
                    // Log diferenciado para login de admin
                    $action = $user['is_admin'] ? 'ADMIN_LOGIN_SUCCESS' : 'LOGIN_SUCCESS';
                    logSecurityEvent($pdo, $user['id'], $action, "Email: $email");
                    logAdminAccess($pdo, $email, $action);
                    
                    header('Location: ' . $redirect);
                    exit;
                } else {
                    // Login falhado
                    recordFailedLogin($pdo, $ip, $email);
                    $error = 'Email ou senha incorretos';
                    logSecurityEvent($pdo, null, 'LOGIN_FAILED', "Email: $email, IP: $ip");
                }
            } catch (PDOException $e) {
                error_log("Login error: " . $e->getMessage());
                $error = 'Erro interno. Tente novamente.';
            }
        }
    }
}

require_once '../includes/header.php';
?>

<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-md-6 col-lg-4">
            <div class="card shadow">
                <div class="card-body p-4">
                    <div class="text-center mb-4">
                        <h2 class="h4 text-primary">
                            <i class="bi bi-fish"></i> Entrar
                        </h2>
                        <p class="text-muted">Acesse sua conta</p>
                    </div>
                    
                    <?php if ($error): ?>
                        <div class="alert alert-danger" role="alert">
                            <i class="bi bi-exclamation-triangle"></i> <?php echo htmlspecialchars($error); ?>
                        </div>
                    <?php endif; ?>
                    
                    <?php if (isset($_GET['error'])): ?>
                        <div class="alert alert-warning" role="alert">
                            <?php
                            switch ($_GET['error']) {
                                case 'login_required':
                                    echo 'Você precisa fazer login para acessar esta página.';
                                    break;
                                case 'admin_required':
                                    echo 'Acesso restrito a administradores.';
                                    break;
                                case 'session_expired':
                                    echo 'Sua sessão expirou. Faça login novamente.';
                                    break;
                                default:
                                    echo 'Erro desconhecido.';
                            }
                            ?>
                        </div>
                    <?php endif; ?>
                    
                    <form method="POST" id="loginForm">
                        <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                        
                        <div class="mb-3">
                            <label for="email" class="form-label">E-mail</label>
                            <input type="email" class="form-control" id="email" name="email" 
                                   value="<?php echo htmlspecialchars($email ?? ''); ?>" required>
                        </div>
                        
                        <div class="mb-3">
                            <label for="password" class="form-label">Senha</label>
                            <input type="password" class="form-control" id="password" name="password" required>
                        </div>
                        
                        <div class="mb-3 form-check">
                            <input type="checkbox" class="form-check-input" id="remember">
                            <label class="form-check-label" for="remember">
                                Lembrar de mim
                            </label>
                        </div>
                        
                        <button type="submit" class="btn btn-primary w-100">
                            <i class="bi bi-box-arrow-in-right"></i> Entrar
                        </button>
                    </form>
                    
                    <hr class="my-4">
                    
                    <div class="text-center">
                        <p class="mb-2">
                            <a href="forgot_password.php" class="text-decoration-none">
                                Esqueceu sua senha?
                            </a>
                        </p>
                        <p class="mb-0">
                            Não tem conta? 
                            <a href="register.php" class="text-decoration-none fw-bold">
                                Cadastre-se
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.getElementById('loginForm').addEventListener('submit', function(e) {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        e.preventDefault();
        showNotification('Por favor, preencha todos os campos.', 'warning');
    }
});
</script>

<?php require_once '../includes/footer.php'; ?>
