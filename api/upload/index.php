<?php
require_once '../../config/database_hostinger.php';
require_once '../../config/cors_unified.php';
require_once '../../config/session_cookies.php';

try {
    // Validar autenticação
    $user = validateSession($pdo);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Usuário não autenticado']);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método não permitido']);
        exit;
    }

    // Verificar se arquivo foi enviado
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Nenhum arquivo válido enviado']);
        exit;
    }

    $file = $_FILES['file'];
    $type = $_POST['type'] ?? 'general'; // general, profile, carousel, report

    // Validações básicas
    $maxSize = 5 * 1024 * 1024; // 5MB
    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Arquivo muito grande. Máximo 5MB permitido']);
        exit;
    }

    // Validar tipo de arquivo
    $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF']);
        exit;
    }

    // Validar dimensões da imagem
    $imageInfo = getimagesize($file['tmp_name']);
    if ($imageInfo === false) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Arquivo não é uma imagem válida']);
        exit;
    }

    $width = $imageInfo[0];
    $height = $imageInfo[1];

    // Limites por tipo
    $limits = [
        'profile' => ['max_width' => 800, 'max_height' => 800],
        'carousel' => ['max_width' => 1920, 'max_height' => 1080],
        'report' => ['max_width' => 1200, 'max_height' => 1200],
        'general' => ['max_width' => 1200, 'max_height' => 1200]
    ];

    $limit = $limits[$type] ?? $limits['general'];
    
    if ($width > $limit['max_width'] || $height > $limit['max_height']) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'message' => "Imagem muito grande para o tipo '$type'. Máximo: {$limit['max_width']}x{$limit['max_height']}px"
        ]);
        exit;
    }

    // Gerar nome único
    $extension = match($mimeType) {
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
        default => 'jpg'
    };

    $fileName = uniqid() . '_' . time() . '.' . $extension;
    
    // Definir diretório baseado no tipo
    $baseDir = '../../uploads/';
    $typeDir = match($type) {
        'profile' => 'profiles/',
        'carousel' => 'carousels/',
        'report' => 'reports/',
        default => 'general/'
    };
    
    $uploadDir = $baseDir . $typeDir;
    
    // Criar diretório se não existir
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro ao criar diretório de upload']);
            exit;
        }
    }

    $filePath = $uploadDir . $fileName;
    $webPath = '/uploads/' . $typeDir . $fileName;

    // Processar imagem (redimensionar se necessário)
    $processedImage = processImage($file['tmp_name'], $mimeType, $width, $height, $limit);
    
    if ($processedImage === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro ao processar imagem']);
        exit;
    }

    // Salvar imagem processada
    $saved = match($mimeType) {
        'image/jpeg' => imagejpeg($processedImage, $filePath, 85),
        'image/png' => imagepng($processedImage, $filePath, 8),
        'image/webp' => imagewebp($processedImage, $filePath, 85),
        'image/gif' => imagegif($processedImage, $filePath),
        default => imagejpeg($processedImage, $filePath, 85)
    };

    imagedestroy($processedImage);

    if (!$saved) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro ao salvar arquivo']);
        exit;
    }

    // Log de segurança
    logSecurityEvent($pdo, $user['id'], 'FILE_UPLOADED', json_encode([
        'type' => $type,
        'filename' => $fileName,
        'size' => $file['size'],
        'dimensions' => "{$width}x{$height}"
    ]));

    echo json_encode([
        'success' => true,
        'message' => 'Arquivo enviado com sucesso',
        'file' => [
            'url' => $webPath,
            'filename' => $fileName,
            'size' => filesize($filePath),
            'dimensions' => [
                'width' => imagesx($processedImage ?? $width),
                'height' => imagesy($processedImage ?? $height)
            ]
        ]
    ]);

} catch (Exception $e) {
    error_log("Upload error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}

function processImage($tmpName, $mimeType, $width, $height, $limits) {
    // Carregar imagem original
    $source = match($mimeType) {
        'image/jpeg' => imagecreatefromjpeg($tmpName),
        'image/png' => imagecreatefrompng($tmpName),
        'image/webp' => imagecreatefromwebp($tmpName),
        'image/gif' => imagecreatefromgif($tmpName),
        default => null
    };

    if (!$source) {
        return false;
    }

    // Calcular novas dimensões se necessário redimensionar
    $newWidth = $width;
    $newHeight = $height;

    if ($width > $limits['max_width'] || $height > $limits['max_height']) {
        $ratio = min($limits['max_width'] / $width, $limits['max_height'] / $height);
        $newWidth = (int)($width * $ratio);
        $newHeight = (int)($height * $ratio);
    }

    // Se não precisa redimensionar
    if ($newWidth === $width && $newHeight === $height) {
        return $source;
    }

    // Criar nova imagem redimensionada
    $destination = imagecreatetruecolor($newWidth, $newHeight);

    // Preservar transparência para PNG e GIF
    if ($mimeType === 'image/png' || $mimeType === 'image/gif') {
        imagealphablending($destination, false);
        imagesavealpha($destination, true);
        $transparent = imagecolorallocatealpha($destination, 255, 255, 255, 127);
        imagefilledrectangle($destination, 0, 0, $newWidth, $newHeight, $transparent);
    }

    // Redimensionar
    if (!imagecopyresampled($destination, $source, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height)) {
        imagedestroy($source);
        imagedestroy($destination);
        return false;
    }

    imagedestroy($source);
    return $destination;
}
?>