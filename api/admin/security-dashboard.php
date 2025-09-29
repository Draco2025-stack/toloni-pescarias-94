<?php
/**
 * API de Dashboard de Segurança - Toloni Pescarias
 * Endpoint administrativo para monitoramento de segurança
 */

require_once '../config/database_hostinger.php';
require_once '../config/cors_unified.php';
require_once '../middleware/auth.php';
require_once '../lib/security_audit.php';

// Validar método e autenticação
requireMethod('GET');
$user = requireRole($pdo, 'ADMIN', 'security_dashboard');

try {
    $action = $_GET['action'] ?? 'stats';
    $days = intval($_GET['days'] ?? 7);
    
    switch ($action) {
        case 'stats':
            $stats = getSecurityStats($pdo, $days);
            json_ok($stats);
            break;
            
        case 'suspicious':
            $patterns = detectSuspiciousPatterns($pdo);
            json_ok($patterns);
            break;
            
        case 'alerts':
            $stmt = $pdo->prepare("
                SELECT * FROM security_alerts 
                WHERE created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
                ORDER BY created_at DESC, severity DESC
                LIMIT 50
            ");
            $stmt->execute([$days]);
            $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            json_ok(['alerts' => $alerts]);
            break;
            
        case 'audit_log':
            $limit = intval($_GET['limit'] ?? 100);
            $offset = intval($_GET['offset'] ?? 0);
            
            $stmt = $pdo->prepare("
                SELECT * FROM security_audit_log 
                WHERE created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$days, $limit, $offset]);
            $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Contar total para paginação
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as total FROM security_audit_log 
                WHERE created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
            ");
            $stmt->execute([$days]);
            $total = $stmt->fetch()['total'];
            
            json_ok([
                'logs' => $logs,
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset
            ]);
            break;
            
        case 'resolve_alert':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                json_error('Método POST necessário', 405);
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $alertId = $input['alert_id'] ?? null;
            
            if (!$alertId) {
                json_error('ID do alerta é obrigatório', 400);
            }
            
            $stmt = $pdo->prepare("
                UPDATE security_alerts 
                SET resolved = TRUE, resolved_by = ?, resolved_at = NOW() 
                WHERE id = ?
            ");
            
            if ($stmt->execute([$user['id'], $alertId])) {
                // Log da ação
                logSecurityAction($pdo, $user, 'RESOLVE_ALERT', 
                    ['type' => 'alert', 'id' => $alertId], 
                    ['alert_id' => $alertId]
                );
                
                json_ok(['message' => 'Alerta resolvido com sucesso']);
            } else {
                json_error('Erro ao resolver alerta', 500);
            }
            break;
            
        default:
            json_error('Ação não reconhecida', 400);
    }
    
} catch (Exception $e) {
    error_log("Security dashboard error: " . $e->getMessage());
    json_error('Erro interno do servidor', 500);
}
?>