<?php
// Toloni Pescarias - Configuração de Administradores
// Define quem tem acesso administrativo ao sistema

// Email do administrador - único administrador do sistema
define('ADMIN_EMAIL', 'toloni.focos@gmail.com');

/**
 * Verifica se um email corresponde ao administrador
 * @param string $email Email a ser verificado
 * @return bool True se for o email do administrador
 */
function isAdminEmail($email) {
    return strtolower(trim($email)) === strtolower(ADMIN_EMAIL);
}

/**
 * Função de compatibilidade (manter para código legado)
 */
function isOttoAdmin($email) {
    return isAdminEmail($email);
}

/**
 * Determina automaticamente se um usuário deve ser admin baseado no email
 * @param string $email Email do usuário
 * @return int 1 se for admin, 0 se for usuário comum
 */
function determineAdminStatus($email) {
    return isAdminEmail($email) ? 1 : 0;
}

/**
 * Log específico para tentativas de acesso administrativo
 * @param PDO $pdo Conexão com banco
 * @param string $email Email da tentativa
 * @param string $action Ação tentada
 */
function logAdminAccess($pdo, $email, $action) {
    $isAdmin = isAdminEmail($email);
    $details = "Email: $email, Admin: " . ($isAdmin ? 'YES' : 'NO');
    
    if (function_exists('logSecurityEvent')) {
        logSecurityEvent($pdo, null, $action, $details);
    }
}

/**
 * Cria automaticamente o usuário administrador se não existir (bootstrap)
 * @param PDO $pdo Conexão com banco
 * @return bool True se criado com sucesso
 */
function bootstrapAdminUser($pdo) {
    try {
        // Verificar se admin já existe
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([ADMIN_EMAIL]);
        
        if ($stmt->fetch()) {
            return true; // Admin já existe
        }
        
        // Criar admin automaticamente
        $password_hash = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("
            INSERT INTO users (name, email, password_hash, is_admin, email_verified, created_at) 
            VALUES (?, ?, ?, 1, 1, NOW())
        ");
        
        return $stmt->execute(['Administrador', ADMIN_EMAIL, $password_hash]);
    } catch (Exception $e) {
        error_log("Erro ao criar admin bootstrap: " . $e->getMessage());
        return false;
    }
}
?>