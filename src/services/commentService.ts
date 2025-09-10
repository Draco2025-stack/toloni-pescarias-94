// Serviço para gerenciar comentários
const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8080' 
  : 'https://tolonipescarias.com.br';

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
      throw new Error(data.message || 'Erro ao buscar comentários');
    }

    return data.comments || [];
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
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
      commentId: data.comment_id,
      message: data.message
    };
  } catch (error) {
    console.error('Erro ao criar comentário:', error);
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
    console.error('Erro ao atualizar comentário:', error);
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
    console.error('Erro ao deletar comentário:', error);
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
    console.error('Erro ao buscar comentário:', error);
    return null;
  }
};

// Toggle comment like
export const toggleCommentLike = async (id: string): Promise<{ success: boolean; liked: boolean; likes_count: number }> => {
  try {
    const response = await fetch(`${API_BASE}/api/comments/index.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'toggle_like',
        comment_id: parseInt(id)
      }),
    });

    const data = await response.json();
    
    return {
      success: data.success,
      liked: data.liked || false,
      likes_count: data.likes_count || 0
    };
  } catch (error) {
    console.error('Erro ao curtir/descurtir comentário:', error);
    return {
      success: false,
      liked: false,
      likes_count: 0
    };
  }
};