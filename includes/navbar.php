
<?php
require_once __DIR__ . '/../config/session.php';
startSecureSession();
?>

<nav class="navbar navbar-expand-lg navbar-dark bg-primary sticky-top">
    <div class="container">
        <a class="navbar-brand fw-bold" href="/">
            <i class="bi bi-fish"></i> Toloni Pescarias
        </a>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto">
                <li class="nav-item">
                    <a class="nav-link" href="/">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/pages/locations.php">Localidades</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/pages/reports.php">Relatos</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/pages/about.php">Sobre</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/pages/contact.php">Contato</a>
                </li>
            </ul>
            
            <ul class="navbar-nav">
                <?php if (isLoggedIn()): ?>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown">
                            <i class="bi bi-person-circle"></i> <?php echo htmlspecialchars($_SESSION['user_name']); ?>
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="/pages/profile.php">Meu Perfil</a></li>
                            <li><a class="dropdown-item" href="/pages/my_reports.php">Meus Relatos</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <?php if (isAdmin()): ?>
                                <li><a class="dropdown-item" href="/admin/index.php">
                                    <i class="bi bi-gear"></i> Administração
                                </a></li>
                                <li><hr class="dropdown-divider"></li>
                            <?php endif; ?>
                            <li><a class="dropdown-item" href="/auth/logout.php">
                                <i class="bi bi-box-arrow-right"></i> Sair
                            </a></li>
                        </ul>
                    </li>
                <?php else: ?>
                    <li class="nav-item">
                        <a class="nav-link" href="/auth/login.php">
                            <i class="bi bi-box-arrow-in-right"></i> Entrar
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link btn btn-outline-light ms-2" href="/auth/register.php">
                            Cadastrar
                        </a>
                    </li>
                <?php endif; ?>
            </ul>
        </div>
    </div>
</nav>
