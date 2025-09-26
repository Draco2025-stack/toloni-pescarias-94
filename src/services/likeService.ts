const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8080' 
  : 'https://tolonipescarias.com.br';

export interface LikeResponse {
  success: boolean;
  liked: boolean;
  likes_count: number;
  message?: string;
}

// Toggle like for reports or comments
export const toggleLike = async (targetType: 'report' | 'comment', targetId: string): Promise<LikeResponse> => {
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
      likes_count: data.data?.likes_count || data.likes_count || 0,
      message: data.error?.message || data.message
    };
  } catch (error) {
    console.error('Erro ao curtir/descurtir:', error);
    return {
      success: false,
      liked: false,
      likes_count: 0,
      message: 'Erro interno do servidor'
    };
  }
};

// Specific functions for different targets
export const toggleReportLike = (reportId: string) => toggleLike('report', reportId);
export const toggleCommentLike = (commentId: string) => toggleLike('comment', commentId);