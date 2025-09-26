// Serviço para gerenciar dados de usuário
// Detectar ambiente de forma robusta
const getApiBaseUrl = (): string => {
  const hostname = window.location.hostname;
  
  // Produção Hostinger
  if (hostname.includes('tolonipescarias.com.br') || 
      hostname.includes('tolonipescarias.com') ||
      (window.location.protocol === 'https:' && hostname !== 'localhost' && !hostname.includes('lovable.app'))) {
    return `https://${hostname}`;
  }
  
  // Desenvolvimento local
  if (hostname === 'localhost' || hostname.startsWith('127.0.0.1')) {
    return window.location.origin;
  }
  
  // Fallback
  return window.location.origin;
};

const API_BASE = getApiBaseUrl();

export interface PrivacySettings {
  profileVisibility: boolean;
  showEmail: boolean;
  allowMessages: boolean;
  shareLocation: boolean;
  showOnlineStatus: boolean;
  allowTagging: boolean;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  newReports: boolean;
  newComments: boolean;
  commentReplies: boolean;
  likes: boolean;
  follows: boolean;
  systemUpdates: boolean;
  newsletter: boolean;
  fishingTips: boolean;
  locationSuggestions: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  bio?: string;
  profile_image?: string;
  phone?: string;
  location?: string;
  experience_level: string;
  created_at: string;
}

export interface UserReport {
  id: number;
  title: string;
  content: string;
  location_id?: number;
  location_name?: string;
  images: string[];
  fish_species?: string;
  fish_weight?: number;
  is_public: boolean;
  approved: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

// Privacy Settings API
export const getPrivacySettings = async (): Promise<PrivacySettings> => {
  try {
    const response = await fetch(`${API_BASE}/api/user/privacy-settings.php`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Erro ao buscar configurações');
    }

    return data.settings;
  } catch (error) {
    console.error('Erro ao buscar configurações de privacidade:', error);
    throw error;
  }
};

export const updatePrivacySettings = async (settings: PrivacySettings): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/api/user/privacy-settings.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Erro ao salvar configurações');
    }
  } catch (error) {
    console.error('Erro ao atualizar configurações de privacidade:', error);
    throw error;
  }
};

// Notification Settings API
export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  try {
    const response = await fetch(`${API_BASE}/api/user/notification-settings.php`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Erro ao buscar configurações');
    }

    return data.settings;
  } catch (error) {
    console.error('Erro ao buscar configurações de notificação:', error);
    throw error;
  }
};

export const updateNotificationSettings = async (settings: NotificationSettings): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/api/user/notification-settings.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Erro ao salvar configurações');
    }
  } catch (error) {
    console.error('Erro ao atualizar configurações de notificação:', error);
    throw error;
  }
};

// Profile API
export const getUserProfile = async (): Promise<{ profile: UserProfile; reports: UserReport[] }> => {
  try {
    const response = await fetch(`${API_BASE}/api/user/profile.php`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Erro ao buscar perfil');
    }

    return {
      profile: data.profile,
      reports: data.reports
    };
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error);
    throw error;
  }
};

export const updateUserProfile = async (profileData: {
  name: string;
  bio?: string;
  phone?: string;
  location?: string;
  experience_level?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  reportVisibility?: Record<number, boolean>;
}): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/api/user/profile.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Erro ao atualizar perfil');
    }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error;
  }
};