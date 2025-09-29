<?php
/**
 * API de Comentários - Toloni Pescarias
 * Segue padrão do prompt-mestre com segurança avançada
 */

// Incluir configurações unificadas
require_once '../../config/database_hostinger.php';
require_once '../../config/cors_unified.php';
require_once '../../config/session_cookies.php';
require_once '../../config/roles_system.php';
require_once '../../lib/security.php';
require_once '../../lib/security_audit.php';
require_once '../../lib/response.php';

// Iniciar monitoramento de performance
PerformanceMonitor::start();

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $path = $_GET['path'] ?? '';
    
    // Aplicar middleware de segurança
    securityMiddleware('comments', [
        'rate_limit' => 30, // 30 req/min para comentários
        'rate_window' => 1
    ]);

    switch ($method) {
        case 'GET':
            getComments($pdo);
            break;
            
        case 'POST':
            if (empty($path)) {
                createComment($pdo);
            } elseif ($path === 'like') {
                toggleLike($pdo);
            }
            break;
            
        case 'PUT':
            updateComment($pdo, $path);
            break;
            
        case 'DELETE':
            deleteComment($pdo, $path);
            break;
            
        default:
            json_error('Método não permitido', 405);
    }

} catch (Exception $e) {
    error_log("Comments API error: " . $e->getMessage());
    json_error('Erro interno do servidor', 500);
} finally {
    // Finalizar monitoramento
    finishSecurityMonitoring('comments_api');
}

function getComments($pdo) {
    try {
        $report_id = $_GET['report_id'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = max((int)($_GET['offset'] ?? 0), 0);
        
        if (!$report_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID do relatório é obrigatório']);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                c.id, c.content, c.parent_id, c.likes_count, c.created_at, c.updated_at,
                u.name as user_name, u.profile_image as user_avatar,
                (SELECT COUNT(*) FROM comments replies WHERE replies.parent_id = c.id AND replies.is_approved = 1) as replies_count
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.report_id = ? AND c.is_approved = 1
            ORDER BY c.parent_id IS NULL DESC, c.created_at ASC
            LIMIT ? OFFSET ?
        ");
        
        $stmt->execute([$report_id, $limit, $offset]);
        $comments = $stmt->fetchAll();
        
        // Organizar comentários em árvore
        $tree = [];
        $index = [];
        
        foreach ($comments as $comment) {
            $comment['replies'] = [];
            $index[$comment['id']] = &$comment;
            
            if ($comment['parent_id'] === null) {
                $tree[] = &$comment;
            } else {
                if (isset($index[$comment['parent_id']])) {
                    $index[$comment['parent_id']]['replies'][] = &$comment;
                }
            }
        }
        
        sendJsonResponse(true, [
            'comments' => $tree
        ]);
        
    } catch (Exception $e) {
        error_log("Get comments error: " . $e->getMessage());
        throw $e;
    }
}

function createComment($pdo) {
    try {
        // Validar autenticação com novo sistema de roles
        $user = requireRole($pdo, 'USER', 'create_comment');
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            json_error('Dados inválidos', 400);
        }
        
        // Validação robusta com InputValidator
        $report_id = InputValidator::validateInt($input['report_id'] ?? null);
        $content = InputValidator::validateString($input['content'] ?? '', 1000, true);
        $parent_id = !empty($input['parent_id']) ? InputValidator::validateInt($input['parent_id']) : null;
        
        if (!$report_id || !$content) {
            json_error('Dados de entrada inválidos', 400);
        }
        
        // Verificar se o relatório existe usando prepared statement seguro
        $stmt = prepareSafeQuery($pdo, "SELECT id FROM reports WHERE id = ?");
        $stmt->execute([$report_id]);
        if (!$stmt->fetch()) {
            json_error('Relatório não encontrado', 404);
        }
        
        // Verificar se o comentário pai existe (se fornecido)
        if ($parent_id) {
            $stmt = prepareSafeQuery($pdo, "SELECT id FROM comments WHERE id = ? AND report_id = ?");
            $stmt->execute([$parent_id, $report_id]);
            if (!$stmt->fetch()) {
                json_error('Comentário pai não encontrado', 404);
            }
        }
        
        // Inserir comentário
        $stmt = prepareSafeQuery($pdo, "
            INSERT INTO comments (report_id, user_id, parent_id, content) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$report_id, $user['id'], $parent_id, $content]);
        
        $comment_id = $pdo->lastInsertId();
        
        // Log de segurança com novo sistema
        logSecurityAction($pdo, $user, 'COMMENT_CREATED', 
            ['type' => 'comment', 'id' => $comment_id], 
            ['report_id' => $report_id, 'parent_id' => $parent_id]
        );
        
        json_ok([
            'message' => 'Comentário adicionado com sucesso',
            'comment_id' => $comment_id
        ], 201);
        
    } catch (Exception $e) {
        error_log("Create comment error: " . $e->getMessage());
        throw $e;
    }
}

function updateComment($pdo, $id) {
    try {
        // Verificar ownership ou role de moderador
        $user = requireOwnershipOrRole($pdo, 'comment', $id, 'MODERATOR', 'update_comment');
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            json_error('Dados inválidos', 400);
        }
        
        $content = InputValidator::validateString($input['content'] ?? '', 1000, true);
        
        if (!$content) {
            json_error('Conteúdo do comentário é obrigatório', 400);
        }
        
        // Atualizar comentário
        $stmt = $pdo->prepare("
            UPDATE comments 
            SET content = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        ");
        $stmt->execute([$content, $id]);
        
        // Log de segurança
        logSecurityAction($pdo, $user, 'COMMENT_UPDATED', 
            ['type' => 'comment', 'id' => $id], 
            ['new_content_length' => strlen($content)]
        );
        
        json_ok(['message' => 'Comentário atualizado com sucesso']);
        
    } catch (Exception $e) {
        error_log("Update comment error: " . $e->getMessage());
        throw $e;
    }
}

function deleteComment($pdo, $id) {
    try {
        // Verificar ownership ou role de moderador
        $user = requireOwnershipOrRole($pdo, 'comment', $id, 'MODERATOR', 'delete_comment');
        
        // Excluir comentário (cascade vai excluir respostas)
        $stmt = $pdo->prepare("DELETE FROM comments WHERE id = ?");
        $stmt->execute([$id]);
        
        // Log de segurança
        logSecurityAction($pdo, $user, 'COMMENT_DELETED', 
            ['type' => 'comment', 'id' => $id], 
            ['deleted_cascaded' => true]
        );
        
        json_ok(['message' => 'Comentário excluído com sucesso']);
        
    } catch (Exception $e) {
        error_log("Delete comment error: " . $e->getMessage());
        throw $e;
    }
}

function toggleLike($pdo) {
    try {
        // Validar autenticação
        $user = validateSession($pdo);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Usuário não autenticado']);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
            return;
        }
        
        $target_type = $input['target_type'] ?? '';
        $target_id = (int)($input['target_id'] ?? 0);
        
        if (!in_array($target_type, ['report', 'comment']) || !$target_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
            return;
        }
        
        // Verificar se já curtiu
        $stmt = $pdo->prepare("
            SELECT id FROM likes 
            WHERE user_id = ? AND target_type = ? AND target_id = ?
        ");
        $stmt->execute([$user['id'], $target_type, $target_id]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            // Remover curtida
            $stmt = $pdo->prepare("
                DELETE FROM likes 
                WHERE user_id = ? AND target_type = ? AND target_id = ?
            ");
            $stmt->execute([$user['id'], $target_type, $target_id]);
            $liked = false;
        } else {
            // Adicionar curtida
            $stmt = $pdo->prepare("
                INSERT INTO likes (user_id, target_type, target_id) 
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$user['id'], $target_type, $target_id]);
            $liked = true;
        }
        
        // Buscar novo contador
        $table = $target_type === 'report' ? 'reports' : 'comments';
        $stmt = $pdo->prepare("SELECT likes_count FROM $table WHERE id = ?");
        $stmt->execute([$target_id]);
        $likes_count = $stmt->fetchColumn();
        
        echo json_encode([
            'success' => true,
            'liked' => $liked,
            'likes_count' => (int)$likes_count
        ]);
        
    } catch (Exception $e) {
        error_log("Toggle like error: " . $e->getMessage());
        throw $e;
    }
}
?>