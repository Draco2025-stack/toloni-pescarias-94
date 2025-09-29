// Serviço para gerenciar comentários
import { getApiBaseUrl } from '@/utils/apiConfig';
import { safeLogger } from '@/utils/logging';

const API_BASE = getApiBaseUrl();

export interface Comment {
  id: string;
  reportId: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
  content: string;
  createdAt: string;
  parentId?: string; // For replies
  replies?: Comment[];
}

export interface CreateCommentData {
  report_id: string;
  content: string;
  parent_id?: string; // For replies
}

// Get comments for a report
export const getCommentsByReport = async (reportId: string): Promise<Comment[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/comments/index.php?report_id=${reportId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Erro ao buscar comentários');
    }

    return data.data?.comments || [];
  } catch (error) {
    safeLogger.error('Erro ao buscar comentários:', error);
    return [];
  }
};

// Create new comment
export const createComment = async (commentData: CreateCommentData): Promise<{ success: boolean; commentId?: string; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/comments/index.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentData),
    });

    const data = await response.json();
    
    return {
      success: data.success,
      commentId: data.data?.comment_id,
      message: data.error?.message || data.message
    };
  } catch (error) {
    safeLogger.error('Erro ao criar comentário:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};

// Update comment
export const updateComment = async (id: string, content: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/comments/index.php`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: parseInt(id),
        content
      }),
    });

    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message
    };
  } catch (error) {
    safeLogger.error('Erro ao atualizar comentário:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};

// Delete comment
export const deleteComment = async (id: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/comments/index.php`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: parseInt(id)
      }),
    });

    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message
    };
  } catch (error) {
    safeLogger.error('Erro ao deletar comentário:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};

// Get comment by ID
export const getComment = async (id: string): Promise<Comment | null> => {
  try {
    const response = await fetch(`${API_BASE}/api/comments/index.php?id=${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Erro ao buscar comentário');
    }

    return data.comment || null;
  } catch (error) {
    safeLogger.error('Erro ao buscar comentário:', error);
    return null;
  }
};

// Toggle comment or report like
export const toggleLike = async (targetType: 'comment' | 'report', targetId: string): Promise<{ success: boolean; liked: boolean; likes_count: number }> => {
  try {
    const response = await fetch(`${API_BASE}/api/comments/index.php?path=like`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target_type: targetType,
        target_id: parseInt(targetId)
      }),
    });

    const data = await response.json();
    
    return {
      success: data.success,
      liked: data.data?.liked || data.liked || false,
      likes_count: data.data?.likes_count || data.likes_count || 0
    };
  } catch (error) {
    safeLogger.error('Erro ao curtir/descurtir:', error);
    return {
      success: false,
      liked: false,
      likes_count: 0
    };
  }
};

// Legacy function for backward compatibility
export const toggleCommentLike = (id: string) => toggleLike('comment', id);