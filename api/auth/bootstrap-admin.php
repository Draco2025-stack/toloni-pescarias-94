<?php
/**
 * Bootstrap Admin - Criar administrador automaticamente
 * Usado apenas no ambiente de desenvolvimento Lovable
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../config/database.php';
require_once '../../config/admin_config.php';
require_once '../../config/security.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

try {
    // Verificar se é ambiente de desenvolvimento
    $isDev = strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || 
             strpos($_SERVER['HTTP_HOST'], 'lovable') !== false;
    
    if (!$isDev) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Operação não permitida em produção']);
        exit;
    }

    // Tentar criar admin automaticamente
    if (bootstrapAdminUser($pdo)) {
        // Verificar se admin foi criado/já existe
        $stmt = $pdo->prepare("
            SELECT id, name, email, is_admin, email_verified 
            FROM users 
            WHERE email = ?
        ");
        $stmt->execute([ADMIN_EMAIL]);
        $admin = $stmt->fetch();

        if ($admin) {
            // Garantir que está marcado como admin e verificado
            $stmt = $pdo->prepare("
                UPDATE users 
                SET is_admin = 1, email_verified = 1, updated_at = NOW() 
                WHERE email = ?
            ");
            $stmt->execute([ADMIN_EMAIL]);

            echo json_encode([
                'success' => true,
                'message' => 'Administrador criado/atualizado com sucesso',
                'admin' => [
                    'id' => $admin['id'],
                    'name' => $admin['name'],
                    'email' => $admin['email'],
                    'isAdmin' => true,
                    'emailVerified' => true
                ]
            ]);
        } else {
            throw new Exception('Falha ao criar administrador');
        }
    } else {
        throw new Exception('Falha ao executar bootstrap do admin');
    }

} catch (Exception $e) {
    error_log("Bootstrap admin error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno: ' . $e->getMessage()]);
}
?>