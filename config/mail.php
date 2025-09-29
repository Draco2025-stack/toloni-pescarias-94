<?php
/**
 * Configuração de Email com PHPMailer - Toloni Pescarias
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../api/phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/../api/phpmailer/src/SMTP.php';
require_once __DIR__ . '/../api/phpmailer/src/Exception.php';
require_once __DIR__ . '/database_hostinger.php';

/**
 * Get environment variable with fallback
 */
function getEnvOrDefault(string $key, string $default = ''): string {
    return $_ENV[$key] ?? getenv($key) ?: $default;
}

/**
 * Create configured PHPMailer instance
 */
function mailer(): PHPMailer {
    $m = new PHPMailer(true);
    $m->isSMTP();
    $m->Host = getEnvOrDefault('SMTP_HOST', 'smtp.hostinger.com');
    $m->Port = (int) getEnvOrDefault('SMTP_PORT', '465');
    $m->SMTPAuth = true;
    $m->SMTPSecure = getEnvOrDefault('SMTP_SECURE', 'ssl'); // 'ssl' (465) ou 'tls' (587)
    $m->Username = getEnvOrDefault('SMTP_USERNAME', 'noreply@tolonipescarias.com.br');
    $m->Password = getEnvOrDefault('SMTP_PASSWORD', '');
    $m->CharSet  = 'UTF-8';
    $m->setFrom(
        getEnvOrDefault('SMTP_FROM_EMAIL', 'noreply@tolonipescarias.com.br'),
        getEnvOrDefault('SMTP_FROM_NAME', 'Toloni Pescarias')
    );
    return $m;
}

/**
 * Send email using PHPMailer
 */
function sendEmail(string $to, string $subject, string $html, ?string $toName = null): bool {
    try {
        $m = mailer();
        $m->addAddress($to, $toName ?: $to);
        $m->isHTML(true);
        $m->Subject = $subject;
        $m->Body    = $html;
        $m->AltBody = strip_tags($html);
        return $m->send();
    } catch (Exception $e) {
        error_log('[SMTP] ' . $e->getMessage());
        return false;
    }
}
?>