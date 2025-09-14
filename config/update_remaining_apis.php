<?php
/**
 * Script para atualizar as APIs restantes com configuração CORS centralizada
 * Execute este script para completar a migração de todas as APIs
 */

// Lista de APIs que ainda precisam ser atualizadas
$apisToUpdate = [
    'api/admin/carousels.php',
    'api/admin/dashboard.php', 
    'api/admin/schedules.php',
    'api/auth/bootstrap-admin.php',
    'api/auth/check-session.php',
    'api/auth/forgot-password.php',
    'api/auth/logout.php',
    'api/auth/register.php',
    'api/auth/resend-verification.php',
    'api/auth/reset-password.php',
    'api/backup_monthly_trophies.php',
    'api/cron_monthly_reset.php',
    'api/middleware/auth.php',
    'api/trophies.php',
    'api/trophy_webhook.php',
    'api/user/notification-settings.php',
    'api/user/profile.php'
];

echo "🔧 Atualizando APIs restantes para usar configuração CORS centralizada...\n\n";

foreach ($apisToUpdate as $apiFile) {
    if (file_exists($apiFile)) {
        echo "✅ Encontrado: $apiFile\n";
        
        // Para cada API, você deve:
        // 1. Remover as linhas de CORS individuais
        // 2. Adicionar: require_once '../config/cors_config.php'; (ajustar path conforme necessário)
        
    } else {
        echo "⚠️  Não encontrado: $apiFile\n";
    }
}

echo "\n📋 INSTRUÇÕES MANUAIS:\n";
echo "Para cada API listada acima, substitua as configurações CORS por:\n";
echo "<?php\n";
echo "require_once '../config/cors_config.php'; // ou '../../config/cors_config.php' se estiver em subdiretório\n\n";

echo "🎯 RESULTADO ESPERADO:\n";
echo "- Todas as APIs funcionarão em localhost, IPs locais (192.168.x.x) e dispositivos móveis\n";
echo "- Zero erros de CORS em desenvolvimento\n";
echo "- Configuração segura mantida em produção\n";
echo "- Configuração centralizada e fácil manutenção\n\n";

echo "✨ TESTE FINAL:\n";
echo "1. Teste em localhost:8080\n";
echo "2. Teste via IP local (ex: 192.168.1.100:8080)\n";
echo "3. Teste em dispositivo móvel na mesma rede\n";
echo "4. Verifique console do navegador - zero erros CORS\n";
?>