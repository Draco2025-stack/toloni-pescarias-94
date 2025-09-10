// Serviço para funcionalidades administrativas
const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8080' 
  : 'https://tolonipescarias.com.br';

export interface AdminStats {
  total_users: number;
  total_reports: number;
  total_locations: number;
  total_comments: number;
  pending_reports: number;
  pending_locations: number;
  recent_activity: ActivityItem[];
  growth_stats: { month: string; users: number; reports: number; }[];
}

export interface ActivityItem {
  id: string;
  type: 'user_registered' | 'report_created' | 'location_suggested' | 'comment_added';
  user_name: string;
  description: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
  last_login?: string;
  is_admin: boolean;
  email_verified: boolean;
  status: 'active' | 'suspended' | 'pending';
  reports_count: number;
  comments_count: number;
}

export interface AdminReport {
  id: string;
  title: string;
  user_name: string;
  location_name: string;
  created_at: string;
  is_public: boolean;
  approved: boolean;
  featured: boolean;
  likes_count: number;
  comments_count: number;
}

export interface AdminLocation {
  id: string;
  name: string;
  description: string;
  suggested_by: string;
  created_at: string;
  approved: boolean;
  featured: boolean;
}

export interface AdminComment {
  id: string;
  content: string;
  user_name: string;
  report_title: string;
  created_at: string;
  is_reported: boolean;
}

// Get dashboard statistics
export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/dashboard.php?action=stats`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Erro ao buscar estatísticas');
    }

    return data.stats;
  } catch (error) {
    console.error('Erro ao buscar estatísticas admin:', error);
    throw error;
  }
};

// Get recent activity
export const getRecentActivity = async (): Promise<ActivityItem[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/dashboard.php?action=activity`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Erro ao buscar atividades');
    }

    return data.activities || [];
  } catch (error) {
    console.error('Erro ao buscar atividades:', error);
    return [];
  }
};

// Get all users (admin)
export const getAdminUsers = async (): Promise<AdminUser[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/index.php?action=users`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Erro ao buscar usuários');
    }

    return data.users || [];
  } catch (error) {
    console.error('Erro ao buscar usuários admin:', error);
    return [];
  }
};

// Get all reports (admin)
export const getAdminReports = async (): Promise<AdminReport[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/index.php?action=reports`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Erro ao buscar relatórios');
    }

    return data.reports || [];
  } catch (error) {
    console.error('Erro ao buscar relatórios admin:', error);
    return [];
  }
};

// Get all locations (admin)
export const getAdminLocations = async (): Promise<AdminLocation[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/index.php?action=locations`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Erro ao buscar localidades');
    }

    return data.locations || [];
  } catch (error) {
    console.error('Erro ao buscar localidades admin:', error);
    return [];
  }
};

// Get all comments (admin)
export const getAdminComments = async (): Promise<AdminComment[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/index.php?action=comments`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Erro ao buscar comentários');
    }

    return data.comments || [];
  } catch (error) {
    console.error('Erro ao buscar comentários admin:', error);
    return [];
  }
};

// Update user status
export const updateUserStatus = async (userId: string, status: 'active' | 'suspended', isAdmin: boolean = false): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/index.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update_user_status',
        user_id: parseInt(userId),
        status,
        is_admin: isAdmin
      }),
    });

    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message
    };
  } catch (error) {
    console.error('Erro ao atualizar status do usuário:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};

// Approve/reject report
export const updateReportStatus = async (reportId: string, approved: boolean, featured: boolean = false): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/index.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update_report_status',
        report_id: parseInt(reportId),
        approved,
        featured
      }),
    });

    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message
    };
  } catch (error) {
    console.error('Erro ao atualizar status do relatório:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};

// Approve/reject location
export const updateLocationStatus = async (locationId: string, approved: boolean, featured: boolean = false): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/index.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update_location_status',
        location_id: parseInt(locationId),
        approved,
        featured
      }),
    });

    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message
    };
  } catch (error) {
    console.error('Erro ao atualizar status da localidade:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};

// Delete user (admin)
export const deleteUser = async (userId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/index.php`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'delete_user',
        user_id: parseInt(userId)
      }),
    });

    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message
    };
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};

// Delete comment (admin)
export const deleteCommentAdmin = async (commentId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/index.php`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'delete_comment',
        comment_id: parseInt(commentId)
      }),
    });

    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message
    };
  } catch (error) {
    console.error('Erro ao deletar comentário:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};