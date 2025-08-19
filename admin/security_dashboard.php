<?php
require_once '../config/database.php';
require_once '../config/session.php';
require_once '../config/advanced_security.php';
require_once '../config/security_advanced.php';
require_once '../includes/middleware.php';

startSecureSession();
adminMiddleware();

// Verificar whitelist IP
if (!$ipWhitelist->isAdminIPAllowed()) {
    logSecurityEvent($pdo, $_SESSION['user_id'] ?? null, 'admin_access_denied_ip', "IP não autorizado: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    die('Acesso negado. IP não autorizado para área administrativa.');
}

$pageTitle = "Dashboard de Segurança";

// Processar ações do dashboard
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action'])) {
        switch ($_POST['action']) {
            case 'run_backup':
                $result = $autoBackup->createDatabaseBackup();
                $message = $result['success'] ? 'Backup criado com sucesso!' : 'Erro ao criar backup.';
                break;
                
            case 'check_integrity':
                $alerts = $fileIntegrity->checkFileIntegrity();
                $message = empty($alerts) ? 'Integridade verificada - tudo OK!' : 'Alertas encontrados: ' . implode(', ', $alerts);
                break;
                
            case 'generate_report':
                $report = $auditCompliance->generateComplianceReport($_POST['report_type'] ?? 'monthly');
                $message = 'Relatório de compliance gerado com sucesso!';
                break;
        }
    }
}

// Obter estatísticas de segurança
$securityStats = [
    'failed_logins_24h' => $pdo->query("SELECT COUNT(*) FROM failed_logins WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)")->fetchColumn(),
    'waf_blocks_24h' => $pdo->query("SELECT COUNT(*) FROM waf_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) AND action_taken = 'blocked'")->fetchColumn(),
    'honeypot_triggers_24h' => $pdo->query("SELECT COUNT(*) FROM honeypot_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)")->fetchColumn(),
    'integrity_alerts' => $pdo->query("SELECT COUNT(*) FROM integrity_alerts WHERE acknowledged = 0")->fetchColumn(),
    'active_2fa_users' => $pdo->query("SELECT COUNT(*) FROM user_2fa WHERE is_enabled = 1")->fetchColumn(),
    'total_backups' => $pdo->query("SELECT COUNT(*) FROM backup_logs WHERE status = 'completed'")->fetchColumn()
];

// Últimos eventos de segurança
$recentEvents = $pdo->query("
    SELECT action, ip_address, created_at, severity, details 
    FROM security_logs 
    ORDER BY created_at DESC 
    LIMIT 10
")->fetchAll();

// Alertas de integridade não reconhecidos
$integrityAlerts = $pdo->query("
    SELECT ia.*, fi.file_path 
    FROM integrity_alerts ia 
    JOIN file_integrity fi ON ia.file_integrity_id = fi.id 
    WHERE ia.acknowledged = 0 
    ORDER BY ia.created_at DESC
")->fetchAll();

include '../includes/header.php';
?>

<div class="container-fluid mt-4">
    <div class="row">
        <!-- Sidebar -->
        <div class="col-md-3">
            <div class="card">
                <div class="card-header bg-dark text-white">
                    <h5><i class="fas fa-shield-alt"></i> Segurança</h5>
                </div>
                <div class="list-group list-group-flush">
                    <a href="#overview" class="list-group-item list-group-item-action active">Dashboard</a>
                    <a href="#2fa" class="list-group-item list-group-item-action">2FA</a>
                    <a href="#waf" class="list-group-item list-group-item-action">WAF</a>
                    <a href="#integrity" class="list-group-item list-group-item-action">Integridade</a>
                    <a href="#backups" class="list-group-item list-group-item-action">Backups</a>
                    <a href="#audit" class="list-group-item list-group-item-action">Auditoria</a>
                </div>
            </div>
        </div>

        <!-- Conteúdo Principal -->
        <div class="col-md-9">
            <?php if (isset($message)): ?>
                <div class="alert alert-info alert-dismissible fade show">
                    <?= htmlspecialchars($message) ?>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            <?php endif; ?>

            <!-- Estatísticas Gerais -->
            <div class="row mb-4">
                <div class="col-md-2">
                    <div class="card text-center border-danger">
                        <div class="card-body">
                            <h3 class="text-danger"><?= $securityStats['failed_logins_24h'] ?></h3>
                            <small>Logins Falhados</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center border-warning">
                        <div class="card-body">
                            <h3 class="text-warning"><?= $securityStats['waf_blocks_24h'] ?></h3>
                            <small>Bloqueios WAF</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center border-info">
                        <div class="card-body">
                            <h3 class="text-info"><?= $securityStats['honeypot_triggers_24h'] ?></h3>
                            <small>Honeypot</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center border-secondary">
                        <div class="card-body">
                            <h3 class="text-secondary"><?= $securityStats['integrity_alerts'] ?></h3>
                            <small>Alertas</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center border-success">
                        <div class="card-body">
                            <h3 class="text-success"><?= $securityStats['active_2fa_users'] ?></h3>
                            <small>2FA Ativo</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center border-primary">
                        <div class="card-body">
                            <h3 class="text-primary"><?= $securityStats['total_backups'] ?></h3>
                            <small>Backups</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Ações Rápidas -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5>Ações de Segurança</h5>
                </div>
                <div class="card-body">
                    <form method="POST" class="d-inline">
                        <input type="hidden" name="action" value="run_backup">
                        <button type="submit" class="btn btn-primary me-2">
                            <i class="fas fa-database"></i> Executar Backup
                        </button>
                    </form>
                    
                    <form method="POST" class="d-inline">
                        <input type="hidden" name="action" value="check_integrity">
                        <button type="submit" class="btn btn-warning me-2">
                            <i class="fas fa-check-circle"></i> Verificar Integridade
                        </button>
                    </form>
                    
                    <form method="POST" class="d-inline">
                        <input type="hidden" name="action" value="generate_report">
                        <input type="hidden" name="report_type" value="daily">
                        <button type="submit" class="btn btn-info">
                            <i class="fas fa-file-alt"></i> Gerar Relatório
                        </button>
                    </form>
                </div>
            </div>

            <!-- Alertas de Integridade -->
            <?php if (!empty($integrityAlerts)): ?>
            <div class="card mb-4">
                <div class="card-header bg-danger text-white">
                    <h5><i class="fas fa-exclamation-triangle"></i> Alertas de Integridade</h5>
                </div>
                <div class="card-body">
                    <?php foreach ($integrityAlerts as $alert): ?>
                        <div class="alert alert-<?= $alert['severity'] === 'critical' ? 'danger' : 'warning' ?>">
                            <strong><?= ucfirst($alert['alert_type']) ?>:</strong>
                            <?= htmlspecialchars($alert['file_path']) ?> - 
                            <?= htmlspecialchars($alert['details']) ?>
                            <small class="text-muted">(<?= $alert['created_at'] ?>)</small>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php endif; ?>

            <!-- Eventos Recentes -->
            <div class="card">
                <div class="card-header">
                    <h5>Eventos de Segurança Recentes</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Ação</th>
                                    <th>IP</th>
                                    <th>Severidade</th>
                                    <th>Detalhes</th>
                                    <th>Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($recentEvents as $event): ?>
                                <tr>
                                    <td><?= htmlspecialchars($event['action']) ?></td>
                                    <td><?= htmlspecialchars($event['ip_address']) ?></td>
                                    <td>
                                        <span class="badge bg-<?= $event['severity'] === 'critical' ? 'danger' : ($event['severity'] === 'high' ? 'warning' : 'info') ?>">
                                            <?= ucfirst($event['severity']) ?>
                                        </span>
                                    </td>
                                    <td><?= htmlspecialchars(substr($event['details'], 0, 50)) ?>...</td>
                                    <td><?= date('d/m H:i', strtotime($event['created_at'])) ?></td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.card { margin-bottom: 1rem; }
.table th { border-top: none; }
.badge { font-size: 0.75em; }
</style>

<?php include '../includes/footer.php'; ?>