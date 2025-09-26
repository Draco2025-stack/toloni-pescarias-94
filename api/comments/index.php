<?php
/**
 * API de Comentários - Toloni Pescarias
 * Segue padrão do prompt-mestre
 */

// Incluir configurações unificadas
require_once '../../config/database_hostinger.php';
require_once '../../config/cors_unified.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $path = $_GET['path'] ?? '';

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
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    }

} catch (Exception $e) {
    error_log("Comments API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
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
        
        $report_id = (int)($input['report_id'] ?? 0);
        $content = trim($input['content'] ?? '');
        $parent_id = !empty($input['parent_id']) ? (int)$input['parent_id'] : null;
        
        // Validações
        if (empty($content)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Conteúdo do comentário é obrigatório']);
            return;
        }
        
        if (strlen($content) > 1000) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Comentário muito longo']);
            return;
        }
        
        // Verificar se o relatório existe
        $stmt = $pdo->prepare("SELECT id FROM reports WHERE id = ?");
        $stmt->execute([$report_id]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Relatório não encontrado']);
            return;
        }
        
        // Verificar se o comentário pai existe (se fornecido)
        if ($parent_id) {
            $stmt = $pdo->prepare("SELECT id FROM comments WHERE id = ? AND report_id = ?");
            $stmt->execute([$parent_id, $report_id]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Comentário pai não encontrado']);
                return;
            }
        }
        
        // Inserir comentário
        $stmt = $pdo->prepare("
            INSERT INTO comments (report_id, user_id, parent_id, content) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$report_id, $user['id'], $parent_id, $content]);
        
        $comment_id = $pdo->lastInsertId();
        
        // Log de segurança
        logSecurityEvent($pdo, $user['id'], 'COMMENT_CREATED', "Comment ID: $comment_id, Report ID: $report_id");
        
        echo json_encode([
            'success' => true,
            'message' => 'Comentário adicionado com sucesso',
            'comment_id' => $comment_id
        ]);
        
    } catch (Exception $e) {
        error_log("Create comment error: " . $e->getMessage());
        throw $e;
    }
}

function updateComment($pdo, $id) {
    try {
        // Validar autenticação
        $user = validateSession($pdo);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Usuário não autenticado']);
            return;
        }
        
        // Verificar se o comentário existe e pertence ao usuário
        $stmt = $pdo->prepare("SELECT user_id FROM comments WHERE id = ?");
        $stmt->execute([$id]);
        $comment = $stmt->fetch();
        
        if (!$comment) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Comentário não encontrado']);
            return;
        }
        
        if ($comment['user_id'] !== $user['id'] && !$user['is_admin']) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Sem permissão para editar este comentário']);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
            return;
        }
        
        $content = trim($input['content'] ?? '');
        
        if (empty($content)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Conteúdo do comentário é obrigatório']);
            return;
        }
        
        if (strlen($content) > 1000) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Comentário muito longo']);
            return;
        }
        
        // Atualizar comentário
        $stmt = $pdo->prepare("
            UPDATE comments 
            SET content = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        ");
        $stmt->execute([$content, $id]);
        
        // Log de segurança
        logSecurityEvent($pdo, $user['id'], 'COMMENT_UPDATED', "Comment ID: $id");
        
        echo json_encode([
            'success' => true,
            'message' => 'Comentário atualizado com sucesso'
        ]);
        
    } catch (Exception $e) {
        error_log("Update comment error: " . $e->getMessage());
        throw $e;
    }
}

function deleteComment($pdo, $id) {
    try {
        // Validar autenticação
        $user = validateSession($pdo);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Usuário não autenticado']);
            return;
        }
        
        // Verificar se o comentário existe e pertence ao usuário
        $stmt = $pdo->prepare("SELECT user_id FROM comments WHERE id = ?");
        $stmt->execute([$id]);
        $comment = $stmt->fetch();
        
        if (!$comment) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Comentário não encontrado']);
            return;
        }
        
        if ($comment['user_id'] !== $user['id'] && !$user['is_admin']) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Sem permissão para excluir este comentário']);
            return;
        }
        
        // Excluir comentário (cascade vai excluir respostas)
        $stmt = $pdo->prepare("DELETE FROM comments WHERE id = ?");
        $stmt->execute([$id]);
        
        // Log de segurança
        logSecurityEvent($pdo, $user['id'], 'COMMENT_DELETED', "Comment ID: $id");
        
        echo json_encode([
            'success' => true,
            'message' => 'Comentário excluído com sucesso'
        ]);
        
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