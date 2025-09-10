<?php
require_once '../../config/database.php';
require_once '../../config/security.php';
require_once '../middleware/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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
    $action = $_GET['action'] ?? 'stats';
    
    switch ($action) {
        case 'stats':
            getDashboardStats();
            break;
        case 'activity':
            getRecentActivity();
            break;
        default:
            throw new Exception('Ação não encontrada');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro: ' . $e->getMessage()
    ]);
}

function getDashboardStats() {
    global $pdo;
    
    // Contar totais
    $totalUsers = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $totalReports = $pdo->query("SELECT COUNT(*) FROM reports")->fetchColumn();
    $totalLocations = $pdo->query("SELECT COUNT(*) FROM locations")->fetchColumn();
    $totalComments = $pdo->query("SELECT COUNT(*) FROM comments")->fetchColumn();
    
    // Contar pendentes
    $pendingReports = $pdo->query("SELECT COUNT(*) FROM reports WHERE approved = 0")->fetchColumn();
    $pendingLocations = $pdo->query("SELECT COUNT(*) FROM locations WHERE approved = 0")->fetchColumn();
    
    // Estatísticas de crescimento (últimos 6 meses)
    $growthStats = [];
    for ($i = 5; $i >= 0; $i--) {
        $month = date('Y-m', strtotime("-$i month"));
        $monthName = date('M', strtotime("-$i month"));
        
        $userCount = $pdo->prepare("SELECT COUNT(*) FROM users WHERE DATE_FORMAT(created_at, '%Y-%m') = ?");
        $userCount->execute([$month]);
        
        $reportCount = $pdo->prepare("SELECT COUNT(*) FROM reports WHERE DATE_FORMAT(created_at, '%Y-%m') = ?");
        $reportCount->execute([$month]);
        
        $growthStats[] = [
            'month' => $monthName,
            'users' => (int)$userCount->fetchColumn(),
            'reports' => (int)$reportCount->fetchColumn()
        ];
    }
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'total_users' => (int)$totalUsers,
            'total_reports' => (int)$totalReports,
            'total_locations' => (int)$totalLocations,
            'total_comments' => (int)$totalComments,
            'pending_reports' => (int)$pendingReports,
            'pending_locations' => (int)$pendingLocations,
            'growth_stats' => $growthStats
        ]
    ]);
}

function getRecentActivity() {
    global $pdo;
    
    $sql = "
        (SELECT 'user_registered' as type, u.name as user_name, 
         CONCAT('Novo usuário registrado: ', u.name) as description,
         u.created_at, u.id as item_id
         FROM users u ORDER BY u.created_at DESC LIMIT 5)
        UNION ALL
        (SELECT 'report_created' as type, u.name as user_name,
         CONCAT('Novo relato criado por ', u.name) as description,
         r.created_at, r.id as item_id
         FROM reports r JOIN users u ON r.user_id = u.id 
         ORDER BY r.created_at DESC LIMIT 5)
        UNION ALL
        (SELECT 'location_suggested' as type, u.name as user_name,
         CONCAT('Nova localidade sugerida: ', l.name) as description,
         l.created_at, l.id as item_id
         FROM locations l JOIN users u ON l.suggested_by = u.id 
         ORDER BY l.created_at DESC LIMIT 5)
        UNION ALL
        (SELECT 'comment_added' as type, u.name as user_name,
         CONCAT('Novo comentário de ', u.name) as description,
         c.created_at, c.id as item_id
         FROM comments c JOIN users u ON c.user_id = u.id 
         ORDER BY c.created_at DESC LIMIT 5)
        ORDER BY created_at DESC LIMIT 20
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'activities' => $activities
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