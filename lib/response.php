<?php
/**
 * Helpers para padronizar respostas JSON das APIs
 */

/**
 * Resposta de sucesso padronizada
 */
function json_ok($data = [], int $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => true] + (is_array($data) ? $data : ['data' => $data]), JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Resposta de erro padronizada
 */
function json_error(string $msg, int $code = 400, array $extra = []) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => $msg] + $extra, JSON_UNESCAPED_UNICODE);
    exit;
}
?>