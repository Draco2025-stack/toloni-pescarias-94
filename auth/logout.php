
<?php
require_once '../config/database.php';
require_once '../config/session.php';
require_once '../config/security.php';

startSecureSession();

if (isLoggedIn()) {
    logSecurityEvent($pdo, $_SESSION['user_id'], 'LOGOUT', 'Usuário fez logout');
    logoutUser();
}

header('Location: /?message=logout_success');
exit;
?>
