<?php
/**
 * API Pública de Cronograma - Toloni Pescarias
 * Segue padrão do prompt-mestre
 */

// Incluir configurações unificadas
require_once '../config/database_hostinger.php';
require_once '../config/cors_unified.php';

try {
    // Usar a conexão PDO global já estabelecida em database.php
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Fetch active schedules with future dates
        $sql = "SELECT 
                    id,
                    title,
                    location,
                    DATE_FORMAT(date, '%d de %M') as formatted_date,
                    date,
                    time,
                    duration,
                    participants,
                    status,
                    trajectory,
                    departure,
                    return_time,
                    boat,
                    equipment,
                    includes_items,
                    whatsapp,
                    created_at
                FROM fishing_schedules 
                WHERE status = 'active' 
                AND date >= CURDATE()
                ORDER BY date ASC, time ASC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $schedules = [];
        
        while ($row = $stmt->fetch()) {
            // Convert month names to Portuguese
            $monthNames = [
                'January' => 'Janeiro',
                'February' => 'Fevereiro', 
                'March' => 'Março',
                'April' => 'Abril',
                'May' => 'Maio',
                'June' => 'Junho',
                'July' => 'Julho',
                'August' => 'Agosto',
                'September' => 'Setembro',
                'October' => 'Outubro',
                'November' => 'Novembro',
                'December' => 'Dezembro'
            ];
            
            $englishMonth = date('F', strtotime($row['date']));
            $portugueseMonth = $monthNames[$englishMonth] ?? $englishMonth;
            $formattedDate = date('d', strtotime($row['date'])) . ' de ' . $portugueseMonth;
            
            $schedules[] = [
                'id' => (int)$row['id'],
                'title' => $row['title'],
                'location' => $row['location'],
                'date' => $formattedDate,
                'time' => substr($row['time'], 0, 5), // Format HH:MM
                'duration' => $row['duration'],
                'participants' => $row['participants'],
                'status' => $row['status'] === 'active' ? 'Vagas Disponíveis' : 'Esgotado',
                'details' => [
                    'trajectory' => $row['trajectory'],
                    'departure' => substr($row['time'], 0, 5) . ' - ' . $row['departure'],
                    'return' => $row['return_time'],
                    'boat' => $row['boat'],
                    'equipment' => $row['equipment'],
                    'includes' => $row['includes_items'],
                    'whatsapp' => $row['whatsapp']
                ]
            ];
        }
        
        sendJsonResponse(true, [
            'schedules' => $schedules,
            'total' => count($schedules)
        ]);
        
    } else {
        sendError('METHOD_NOT_ALLOWED', 'Método não permitido', 405);
    }
    
} catch (Exception $e) {
    error_log("Error in schedules API: " . $e->getMessage());
    sendError('INTERNAL_ERROR', 'Erro interno do servidor', 500);
}

// PDO connection closed automatically
?>