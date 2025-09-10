<?php
require_once '../../config/database.php';
require_once '../../config/security.php';
require_once '../middleware/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Verificar se é admin
if (!checkAdminAuth()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Acesso negado']);
    exit;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            getSchedules();
            break;
        case 'POST':
            createSchedule();
            break;
        case 'PUT':
            updateSchedule();
            break;
        case 'DELETE':
            deleteSchedule();
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

function getSchedules() {
    global $pdo;
    
    $sql = "
        SELECT 
            id, title, description, location, date, time,
            max_participants, price, image_url, active,
            created_at, updated_at
        FROM fishing_schedules 
        ORDER BY date ASC, time ASC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'schedules' => $schedules
    ]);
}

function createSchedule() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $title = $input['title'] ?? '';
    $description = $input['description'] ?? '';
    $location = $input['location'] ?? '';
    $date = $input['date'] ?? '';
    $time = $input['time'] ?? '';
    $maxParticipants = $input['max_participants'] ?? null;
    $price = $input['price'] ?? null;
    $imageUrl = $input['image_url'] ?? '';
    
    if (empty($title) || empty($location) || empty($date)) {
        throw new Exception('Campos obrigatórios não preenchidos');
    }
    
    $sql = "
        INSERT INTO fishing_schedules (
            title, description, location, date, time,
            max_participants, price, image_url, active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $title, $description, $location, $date, $time,
        $maxParticipants, $price, $imageUrl
    ]);
    
    $scheduleId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Cronograma criado com sucesso',
        'schedule_id' => $scheduleId
    ]);
}

function updateSchedule() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $id = $input['id'] ?? '';
    $title = $input['title'] ?? '';
    $description = $input['description'] ?? '';
    $location = $input['location'] ?? '';
    $date = $input['date'] ?? '';
    $time = $input['time'] ?? '';
    $maxParticipants = $input['max_participants'] ?? null;
    $price = $input['price'] ?? null;
    $imageUrl = $input['image_url'] ?? '';
    $active = $input['active'] ?? true;
    
    if (empty($id) || empty($title) || empty($location) || empty($date)) {
        throw new Exception('Campos obrigatórios não preenchidos');
    }
    
    $sql = "
        UPDATE fishing_schedules SET
            title = ?, description = ?, location = ?, date = ?, time = ?,
            max_participants = ?, price = ?, image_url = ?, active = ?, updated_at = NOW()
        WHERE id = ?
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $title, $description, $location, $date, $time,
        $maxParticipants, $price, $imageUrl, $active ? 1 : 0, $id
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Cronograma atualizado com sucesso'
    ]);
}

function deleteSchedule() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? '';
    
    if (empty($id)) {
        throw new Exception('ID não fornecido');
    }
    
    $sql = "DELETE FROM fishing_schedules WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Cronograma removido com sucesso'
    ]);
}

function checkAdminAuth() {
    global $pdo;
    
    if (!isset($_COOKIE['user_session'])) {
        return false;
    }
    
    $sessionToken = $_COOKIE['user_session'];
    
    $stmt = $pdo->prepare("
        SELECT u.is_admin 
        FROM users u 
        JOIN user_sessions s ON u.id = s.user_id 
        WHERE s.session_token = ? AND s.expires_at > NOW() AND s.is_active = 1
    ");
    $stmt->execute([$sessionToken]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    return $user && $user['is_admin'] == 1;
}
?>