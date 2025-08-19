<?php
// Gerenciamento de consentimento de cookies no backend

// Função para verificar consentimento de cookies
function getCookieConsent() {
    return $_COOKIE['cookie_consent'] ?? null;
}

// Função para verificar se analytics podem ser habilitados
function canUseAnalytics() {
    $consent = getCookieConsent();
    return $consent === 'accepted';
}

// Função para verificar se cookies não essenciais podem ser usados
function canUseNonEssentialCookies() {
    $consent = getCookieConsent();
    return $consent === 'accepted';
}

// Função para definir headers baseados no consentimento
function setCookieConsentHeaders() {
    $consent = getCookieConsent();
    
    if ($consent === 'rejected') {
        // Adicionar headers para limitar cookies
        header('Set-Cookie: HttpOnly; Secure; SameSite=Strict');
    }
}

// Função para log de consentimento de cookies
function logCookieConsent($pdo, $user_id = null, $consent_status) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    
    try {
        $stmt = $pdo->prepare("INSERT INTO security_logs (user_id, action, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?)");
        $action = 'COOKIE_CONSENT_' . strtoupper($consent_status);
        $details = "Consentimento de cookies: $consent_status";
        $stmt->execute([$user_id, $action, $ip, $user_agent, $details]);
    } catch (Exception $e) {
        error_log("Erro ao registrar consentimento de cookies: " . $e->getMessage());
    }
}

// Middleware para verificar consentimento antes de definir cookies analytics
function checkConsentBeforeAnalytics() {
    if (!canUseAnalytics()) {
        // Não carregar scripts de analytics
        return false;
    }
    return true;
}

// Função para aplicar política de cookies baseada no consentimento
function applyCookiePolicy() {
    $consent = getCookieConsent();
    
    if ($consent === 'rejected') {
        // Configurações restritivas para cookies
        ini_set('session.cookie_httponly', 1);
        ini_set('session.cookie_secure', 1);
        ini_set('session.cookie_samesite', 'Strict');
        
        // Desabilitar cookies de terceiros se necessário
        // Aqui você pode adicionar lógica adicional
    } else if ($consent === 'accepted') {
        // Configurações padrão para cookies
        ini_set('session.cookie_httponly', 1);
        ini_set('session.cookie_secure', 1);
        ini_set('session.cookie_samesite', 'Lax');
    }
}

// Script para inserir no HTML baseado no consentimento
function getCookieConsentScript() {
    $consent = getCookieConsent();
    
    if ($consent === 'accepted') {
        return '
        <script>
            // Habilitar Google Analytics ou outros scripts de analytics
            console.log("Analytics habilitado - consentimento dado");
            
            // Exemplo para Google Analytics (descomente se usar):
            // gtag("consent", "update", {
            //     analytics_storage: "granted"
            // });
        </script>';
    } else {
        return '
        <script>
            // Desabilitar analytics
            console.log("Analytics desabilitado - consentimento negado");
            
            // Exemplo para Google Analytics (descomente se usar):
            // gtag("consent", "update", {
            //     analytics_storage: "denied"
            // });
        </script>';
    }
}
?>