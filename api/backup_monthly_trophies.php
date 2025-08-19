<?php
/**
 * Script para backup mensal dos dados de troféus
 * Deve ser executado mensalmente via Cron Job na Hostinger
 * 
 * Exemplo de Cron Job (dia 2 de cada mês às 03:00):
 * 0 3 2 * * /usr/bin/php /home/usuario/public_html/api/backup_monthly_trophies.php
 */

// Configuração de ambiente
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/backup_errors.log');

// Headers para execução via web (caso necessário para testes)
if (isset($_SERVER['HTTP_HOST'])) {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }
}

try {
    // Incluir configuração do banco
    require_once __DIR__ . '/../config/database.php';
    
    // Definir diretório de backup
    $backupDir = __DIR__ . '/../backups';
    if (!is_dir($backupDir)) {
        mkdir($backupDir, 0755, true);
    }
    
    // Nome do arquivo de backup com timestamp
    $timestamp = date('Y-m-d_H-i-s');
    $backupFile = $backupDir . "/trophies_backup_$timestamp.sql";
    
    // Log de início
    error_log('[' . date('Y-m-d H:i:s') . '] Iniciando backup mensal dos troféus...');
    
    // Consultar dados para backup
    $tables = ['trophies', 'trophies_archive', 'system_settings'];
    $backupContent = "-- Backup dos troféus gerado em " . date('Y-m-d H:i:s') . "\n\n";
    
    foreach ($tables as $table) {
        $backupContent .= "-- Dados da tabela $table\n";
        
        // Obter estrutura da tabela
        $stmt = $pdo->prepare("SHOW CREATE TABLE $table");
        $stmt->execute();
        $createTable = $stmt->fetch(PDO::FETCH_ASSOC);
        $backupContent .= $createTable['Create Table'] . ";\n\n";
        
        // Obter dados da tabela
        $stmt = $pdo->prepare("SELECT * FROM $table");
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (!empty($rows)) {
            $columns = array_keys($rows[0]);
            $backupContent .= "INSERT INTO $table (" . implode(', ', $columns) . ") VALUES\n";
            
            $valuesList = [];
            foreach ($rows as $row) {
                $values = array_map(function($value) use ($pdo) {
                    return $value === null ? 'NULL' : $pdo->quote($value);
                }, array_values($row));
                $valuesList[] = '(' . implode(', ', $values) . ')';
            }
            
            $backupContent .= implode(",\n", $valuesList) . ";\n\n";
        }
        
        $backupContent .= "\n";
    }
    
    // Salvar arquivo de backup
    if (file_put_contents($backupFile, $backupContent)) {
        $fileSize = filesize($backupFile);
        $message = "Backup criado com sucesso: $backupFile (Tamanho: " . number_format($fileSize / 1024, 2) . " KB)";
        
        error_log('[' . date('Y-m-d H:i:s') . '] ' . $message);
        
        // Limpar backups antigos (manter apenas últimos 12 meses)
        $files = glob($backupDir . '/trophies_backup_*.sql');
        if (count($files) > 12) {
            sort($files);
            $filesToDelete = array_slice($files, 0, count($files) - 12);
            foreach ($filesToDelete as $oldFile) {
                unlink($oldFile);
                error_log('[' . date('Y-m-d H:i:s') . '] Backup antigo removido: ' . basename($oldFile));
            }
        }
        
        if (isset($_SERVER['HTTP_HOST'])) {
            echo json_encode([
                'success' => true,
                'message' => $message,
                'file' => basename($backupFile),
                'size' => $fileSize
            ]);
        }
    } else {
        throw new Exception('Falha ao salvar arquivo de backup');
    }
    
} catch (Exception $e) {
    $error = 'Erro no backup: ' . $e->getMessage();
    error_log('[' . date('Y-m-d H:i:s') . '] ' . $error);
    
    if (isset($_SERVER['HTTP_HOST'])) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => $error
        ]);
    }
    
    exit(1);
}

exit(0);
?>