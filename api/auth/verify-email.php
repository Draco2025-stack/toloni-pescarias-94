<?php
require_once '../../config/database.php';
require_once '../../config/session.php';
require_once '../../config/security.php';

$page_title = 'Verificação de Email';

if (!isset($_GET['token'])) {
    $error = 'Token de verificação não fornecido';
} else {
    $token = $_GET['token'];
    
    try {
        // Buscar usuário pelo token
        $stmt = $pdo->prepare("SELECT id, name, email, email_verification_expires FROM users WHERE email_verification_token = ? AND email_verified = 0");
        $stmt->execute([$token]);
        $user = $stmt->fetch();
        
        if (!$user) {
            $error = 'Token de verificação inválido ou email já verificado';
        } elseif (strtotime($user['email_verification_expires']) < time()) {
            $error = 'Token de verificação expirado. Solicite um novo link de verificação.';
        } else {
            // Verificar email
            $stmt = $pdo->prepare("UPDATE users SET email_verified = 1, email_verification_token = NULL, email_verification_expires = NULL WHERE id = ?");
            $stmt->execute([$user['id']]);
            
            // Log de segurança
            logSecurityEvent($pdo, $user['id'], 'EMAIL_VERIFIED', "Email: " . $user['email']);
            
            $success = 'Email verificado com sucesso! Você já pode fazer login.';
        }
    } catch (Exception $e) {
        error_log("Email verification error: " . $e->getMessage());
        $error = 'Erro interno do servidor';
    }
}
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $page_title; ?> - Toloni Pescarias</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css">
</head>
<body class="bg-light">
    <div class="container py-5">
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-4">
                <div class="card shadow">
                    <div class="card-body p-4 text-center">
                        <div class="mb-4">
                            <h2 class="h4 text-primary">
                                <i class="bi bi-envelope-check"></i> Verificação de Email
                            </h2>
                        </div>
                        
                        <?php if (isset($error)): ?>
                            <div class="alert alert-danger" role="alert">
                                <i class="bi bi-exclamation-triangle"></i> <?php echo htmlspecialchars($error); ?>
                            </div>
                            
                            <div class="mt-4">
                                <a href="/login" class="btn btn-primary">
                                    <i class="bi bi-arrow-left"></i> Voltar ao Login
                                </a>
                            </div>
                        <?php endif; ?>
                        
                        <?php if (isset($success)): ?>
                            <div class="alert alert-success" role="alert">
                                <i class="bi bi-check-circle"></i> <?php echo htmlspecialchars($success); ?>
                            </div>
                            
                            <div class="mt-4">
                                <a href="/login" class="btn btn-primary">
                                    <i class="bi bi-box-arrow-in-right"></i> Fazer Login
                                </a>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>