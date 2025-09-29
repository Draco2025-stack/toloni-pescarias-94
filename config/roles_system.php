<?php
/**
 * Sistema de Roles e Permissões - Toloni Pescarias
 * Implementa o princípio do menor privilégio
 */

// Definição de roles do sistema
const ROLES = [
    'USER' => [
        'level' => 1,
        'name' => 'Usuário',
        'permissions' => [
            'create_report',
            'edit_own_report',
            'delete_own_report',
            'create_comment',
            'edit_own_comment',
            'delete_own_comment',
            'view_public_content',
            'suggest_location'
        ]
    ],
    'MODERATOR' => [
        'level' => 2,
        'name' => 'Moderador',
        'permissions' => [
            'moderate_comments',
            'moderate_reports',
            'approve_content',
            'view_pending_content',
            'ban_users'
        ]
    ],
    'EDITOR' => [
        'level' => 3,
        'name' => 'Editor',
        'permissions' => [
            'manage_locations',
            'manage_carousels',
            'manage_schedules',
            'edit_any_content',
            'feature_content'
        ]
    ],
    'ADMIN' => [
        'level' => 4,
        'name' => 'Administrador',
        'permissions' => [
            'manage_users',
            'manage_system',
            'view_security_logs',
            'access_dashboard',
            'all_permissions'
        ]
    ]
];

/**
 * Determina o role do usuário baseado no email e status
 */
function getUserRole($user) {
    if (!$user) return null;
    
    // Admin principal tem acesso total
    if (isAdminEmail($user['email'])) {
        return 'ADMIN';
    }
    
    // Verificar roles personalizados na base de dados
    if (isset($user['role']) && array_key_exists($user['role'], ROLES)) {
        return $user['role'];
    }
    
    // Role padrão
    return 'USER';
}

/**
 * Verifica se usuário tem role específico ou superior
 */
function hasRole($user, $requiredRole) {
    if (!$user || !$requiredRole) return false;
    
    $userRole = getUserRole($user);
    if (!$userRole) return false;
    
    $userLevel = ROLES[$userRole]['level'] ?? 0;
    $requiredLevel = ROLES[$requiredRole]['level'] ?? 999;
    
    return $userLevel >= $requiredLevel;
}

/**
 * Verifica se usuário tem permissão específica
 */
function hasPermission($user, $permission) {
    if (!$user || !$permission) return false;
    
    $userRole = getUserRole($user);
    if (!$userRole) return false;
    
    $rolePermissions = ROLES[$userRole]['permissions'] ?? [];
    
    // Admin tem todas as permissões
    if (in_array('all_permissions', $rolePermissions)) {
        return true;
    }
    
    return in_array($permission, $rolePermissions);
}

/**
 * Verifica se usuário é dono do recurso
 */
function isResourceOwner($pdo, $user, $resourceType, $resourceId) {
    if (!$user || !$resourceId) return false;
    
    $tables = [
        'report' => 'reports',
        'comment' => 'comments',
        'location' => 'locations'
    ];
    
    if (!isset($tables[$resourceType])) return false;
    
    try {
        $stmt = $pdo->prepare("SELECT user_id FROM {$tables[$resourceType]} WHERE id = ?");
        $stmt->execute([$resourceId]);
        $resource = $stmt->fetch();
        
        return $resource && $resource['user_id'] == $user['id'];
    } catch (Exception $e) {
        error_log("Resource ownership check failed: " . $e->getMessage());
        return false;
    }
}

/**
 * Log de tentativas de acesso não autorizado
 */
function logUnauthorizedAccess($pdo, $user, $requiredRole, $endpoint, $resourceId = null) {
    $details = json_encode([
        'user_id' => $user['id'] ?? null,
        'user_email' => $user['email'] ?? 'anonymous',
        'user_role' => getUserRole($user),
        'required_role' => $requiredRole,
        'endpoint' => $endpoint,
        'resource_id' => $resourceId,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ]);
    
    if (function_exists('logSecurityEvent')) {
        logSecurityEvent($pdo, $user['id'] ?? null, 'UNAUTHORIZED_ACCESS', $details);
    }
    
    error_log("SECURITY: Unauthorized access attempt - $details");
}

/**
 * Middleware de autorização unificado
 */
function requireRole($pdo, $requiredRole, $endpoint = '') {
    $user = validateSession($pdo);
    
    if (!$user) {
        logUnauthorizedAccess($pdo, null, $requiredRole, $endpoint);
        json_error('Usuário não autenticado', 401, ['redirectTo' => '/login']);
    }
    
    if (!hasRole($user, $requiredRole)) {
        logUnauthorizedAccess($pdo, $user, $requiredRole, $endpoint);
        json_error('Acesso negado - privilégios insuficientes', 403);
    }
    
    return $user;
}

/**
 * Middleware para recursos que exigem ownership ou role específico
 */
function requireOwnershipOrRole($pdo, $resourceType, $resourceId, $fallbackRole, $endpoint = '') {
    $user = validateSession($pdo);
    
    if (!$user) {
        json_error('Usuário não autenticado', 401, ['redirectTo' => '/login']);
    }
    
    $isOwner = isResourceOwner($pdo, $user, $resourceType, $resourceId);
    $hasRole = hasRole($user, $fallbackRole);
    
    if (!$isOwner && !$hasRole) {
        logUnauthorizedAccess($pdo, $user, $fallbackRole, $endpoint, $resourceId);
        json_error('Acesso negado ao recurso', 403);
    }
    
    return $user;
}

/**
 * Middleware para permissões específicas
 */
function requirePermission($pdo, $permission, $endpoint = '') {
    $user = validateSession($pdo);
    
    if (!$user) {
        json_error('Usuário não autenticado', 401, ['redirectTo' => '/login']);
    }
    
    if (!hasPermission($user, $permission)) {
        logUnauthorizedAccess($pdo, $user, "permission:$permission", $endpoint);
        json_error('Permissão insuficiente', 403);
    }
    
    return $user;
}

/**
 * Obter informações do role do usuário
 */
function getRoleInfo($user) {
    $role = getUserRole($user);
    return $role ? ROLES[$role] : null;
}
?>