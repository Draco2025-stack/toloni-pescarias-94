<?php
/**
 * Configuração CORS Centralizada
 * Detecta automaticamente o ambiente e aplica configurações apropriadas
 */

function setupCORS() {
    // Detectar ambiente
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $isProduction = !in_array($host, ['localhost', '127.0.0.1']) && 
                   !preg_match('/^192\.168\./', $host) && 
                   !preg_match('/^10\./', $host) && 
                   !preg_match('/^172\.(1[6-9]|2[0-9]|3[0-1])\./', $host) &&
                   strpos($host, 'lovable') === false;

    // Headers básicos
    header('Content-Type: application/json; charset=utf-8');
    
    if ($isProduction) {
        // Configuração para produção - mais restritiva
        $allowedOrigins = [
            'https://tolonipescarias.com.br',
            'https://www.tolonipescarias.com.br'
        ];
        
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if (in_array($origin, $allowedOrigins)) {
            header("Access-Control-Allow-Origin: $origin");
        } else {
            header('Access-Control-Allow-Origin: https://tolonipescarias.com.br');
        }
    } else {
        // Configuração para desenvolvimento - mais permissiva
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if ($origin) {
            // Permitir qualquer origem em desenvolvimento
            header("Access-Control-Allow-Origin: $origin");
        } else {
            header('Access-Control-Allow-Origin: *');
        }
    }
    
    // Headers CORS padrão
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400'); // Cache preflight por 24 horas
    
    // Tratar requisições OPTIONS (preflight)
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// Configuração de buffer para evitar problemas de output
function setupOutputBuffer() {
    if (!ob_get_level()) {
        ob_start();
    }
    
    // Capturar erros fatais
    register_shutdown_function(function() {
        $error = error_get_last();
        if ($error !== NULL && $error['type'] === E_ERROR) {
            if (ob_get_level()) {
                ob_clean();
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
        }
    });
}

// Função para limpar e retornar resposta JSON
function sendJSONResponse($data) {
    if (ob_get_level()) {
        ob_clean();
    }
    echo json_encode($data);
    if (ob_get_level()) {
        ob_end_flush();
    }
    exit;
}

// Executar automaticamente quando incluído
setupCORS();
setupOutputBuffer();
?>