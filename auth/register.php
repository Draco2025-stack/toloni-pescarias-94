
<?php
$page_title = 'Cadastro';
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
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = sanitizeString($_POST['name']);
    $email = sanitizeEmail($_POST['email']);
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];
    $csrf_token = $_POST['csrf_token'];
    
    // Verificar CSRF
    if (!verifyCSRFToken($csrf_token)) {
        $error = 'Token de segurança inválido';
    } else {
        // Validações
        if (empty($name) || empty($email) || empty($password)) {
            $error = 'Todos os campos são obrigatórios';
        } elseif (!validateEmail($email)) {
            $error = 'Email inválido';
        } elseif ($password !== $confirm_password) {
            $error = 'As senhas não coincidem';
        } elseif (!validatePasswordStrength($password)) {
            $error = 'A senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número';
        } else {
            try {
                // Verificar se email já existe
                $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
                $stmt->execute([$email]);
                
                if ($stmt->fetch()) {
                    $error = 'Este email já está cadastrado';
                } else {
                    // Incluir configuração de admin
                    require_once '../config/admin_config.php';
                    
                    // Criar usuário
                    $password_hash = hashPassword($password);
                    $is_admin = determineAdminStatus($email);
                    
                    $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, is_admin) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$name, $email, $password_hash, $is_admin]);
                    
                    $user_id = $pdo->lastInsertId();
                    
                    // Log diferenciado para registro de admin
                    $action = $is_admin ? 'ADMIN_REGISTERED' : 'USER_REGISTERED';
                    logSecurityEvent($pdo, $user_id, $action, "Email: $email, Admin: " . ($is_admin ? 'YES' : 'NO'));
                    
                    $success = 'Conta criada com sucesso! Você pode fazer login agora.';
                }
            } catch (PDOException $e) {
                error_log("Registration error: " . $e->getMessage());
                $error = 'Erro interno. Tente novamente.';
            }
        }
    }
}

require_once '../includes/header.php';
?>

<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
            <div class="card shadow">
                <div class="card-body p-4">
                    <div class="text-center mb-4">
                        <h2 class="h4 text-primary">
                            <i class="bi bi-person-plus"></i> Criar Conta
                        </h2>
                        <p class="text-muted">Junte-se à nossa comunidade</p>
                    </div>
                    
                    <?php if ($error): ?>
                        <div class="alert alert-danger" role="alert">
                            <i class="bi bi-exclamation-triangle"></i> <?php echo htmlspecialchars($error); ?>
                        </div>
                    <?php endif; ?>
                    
                    <?php if ($success): ?>
                        <div class="alert alert-success" role="alert">
                            <i class="bi bi-check-circle"></i> <?php echo htmlspecialchars($success); ?>
                            <br><a href="login.php" class="alert-link">Clique aqui para fazer login</a>
                        </div>
                    <?php endif; ?>
                    
                    <form method="POST" id="registerForm">
                        <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                        
                        <div class="mb-3">
                            <label for="name" class="form-label">Nome Completo</label>
                            <input type="text" class="form-control" id="name" name="name" 
                                   value="<?php echo htmlspecialchars($name ?? ''); ?>" required>
                        </div>
                        
                        <div class="mb-3">
                            <label for="email" class="form-label">E-mail</label>
                            <input type="email" class="form-control" id="email" name="email" 
                                   value="<?php echo htmlspecialchars($email ?? ''); ?>" required>
                        </div>
                        
                        <div class="mb-3">
                            <label for="password" class="form-label">Senha</label>
                            <input type="password" class="form-control" id="password" name="password" required>
                            <div class="form-text">
                                Mínimo 8 caracteres, incluindo maiúscula, minúscula e número
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="confirm_password" class="form-label">Confirmar Senha</label>
                            <input type="password" class="form-control" id="confirm_password" name="confirm_password" required>
                        </div>
                        
                        <div class="mb-3 form-check">
                            <input type="checkbox" class="form-check-input" id="terms" required>
                            <label class="form-check-label" for="terms">
                                Concordo com os <a href="/pages/terms.php" target="_blank">Termos de Uso</a>
                                e <a href="/pages/privacy.php" target="_blank">Política de Privacidade</a>
                            </label>
                        </div>
                        
                        <button type="submit" class="btn btn-primary w-100">
                            <i class="bi bi-person-plus"></i> Criar Conta
                        </button>
                    </form>
                    
                    <hr class="my-4">
                    
                    <div class="text-center">
                        <p class="mb-0">
                            Já tem conta? 
                            <a href="login.php" class="text-decoration-none fw-bold">
                                Faça login
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.getElementById('registerForm').addEventListener('submit', function(e) {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    
    if (password !== confirmPassword) {
        e.preventDefault();
        showNotification('As senhas não coincidem.', 'warning');
        return;
    }
    
    // Validar força da senha
    if (password.length < 8 || 
        !/[A-Z]/.test(password) || 
        !/[a-z]/.test(password) || 
        !/[0-9]/.test(password)) {
        e.preventDefault();
        showNotification('A senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número.', 'warning');
        return;
    }
});
</script>

<?php require_once '../includes/footer.php'; ?>
