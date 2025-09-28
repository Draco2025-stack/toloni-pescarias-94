<?php
require_once '../../config/database_hostinger.php';
require_once '../../config/cors_unified.php';
require_once '../../config/session_cookies.php';
require_once '../middleware/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Verificar se é admin
$user = validateSession($pdo);
if (!$user || !$user['is_admin']) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acesso negado']);
    exit;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            getCarousels($pdo);
            break;
        case 'POST':
            createCarousel($pdo);
            break;
        case 'PUT':
            updateCarousel($pdo);
            break;
        case 'DELETE':
            deleteCarousel($pdo);
            break;
        default:
            throw new Exception('Método não permitido');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro: ' . $e->getMessage()
    ]);
}

function getCarousels($pdo) {
    
    $type = $_GET['type'] ?? 'hero'; // hero, experience
    
    $sql = "
        SELECT 
            id, title, subtitle, image_url, link_url, 
            display_order, active, type, created_at, updated_at
        FROM carousels 
        WHERE type = ?
        ORDER BY display_order ASC, created_at DESC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$type]);
    $carousels = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'carousels' => $carousels
    ]);
}

function createCarousel($pdo) {
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $title = $input['title'] ?? '';
    $subtitle = $input['subtitle'] ?? '';
    $imageUrl = $input['image_url'] ?? '';
    $linkUrl = $input['link_url'] ?? '';
    $type = $input['type'] ?? 'hero';
    $displayOrder = $input['display_order'] ?? 0;
    
    if (empty($title) || empty($imageUrl)) {
        throw new Exception('Título e imagem são obrigatórios');
    }
    
    $sql = "
        INSERT INTO carousels (
            title, subtitle, image_url, link_url, type,
            display_order, active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $title, $subtitle, $imageUrl, $linkUrl, $type, $displayOrder
    ]);
    
    $carouselId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Carrossel criado com sucesso',
        'carousel_id' => $carouselId
    ]);
}

function updateCarousel($pdo) {
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $id = $input['id'] ?? '';
    $title = $input['title'] ?? '';
    $subtitle = $input['subtitle'] ?? '';
    $imageUrl = $input['image_url'] ?? '';
    $linkUrl = $input['link_url'] ?? '';
    $displayOrder = $input['display_order'] ?? 0;
    $active = $input['active'] ?? true;
    
    if (empty($id) || empty($title) || empty($imageUrl)) {
        throw new Exception('ID, título e imagem são obrigatórios');
    }
    
    $sql = "
        UPDATE carousels SET
            title = ?, subtitle = ?, image_url = ?, link_url = ?,
            display_order = ?, active = ?, updated_at = NOW()
        WHERE id = ?
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $title, $subtitle, $imageUrl, $linkUrl, $displayOrder, $active ? 1 : 0, $id
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Carrossel atualizado com sucesso'
    ]);
}

function deleteCarousel($pdo) {
    
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? '';
    
    if (empty($id)) {
        throw new Exception('ID não fornecido');
    }
    
    $sql = "DELETE FROM carousels WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Carrossel removido com sucesso'
    ]);
?>