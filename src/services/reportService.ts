// Serviço para gerenciar relatórios de pesca - APIs Reais

// Detectar ambiente e configurar API base
const getApiBaseUrl = (): string => {
  const hostname = window.location.hostname;
  
  // Produção Hostinger - Detecção robusta
  if (hostname.includes('tolonipescarias.com.br') || 
      hostname.includes('tolonipescarias.com') ||
      (window.location.protocol === 'https:' && hostname !== 'localhost' && !hostname.includes('lovable.app'))) {
    return `https://${hostname}/api`;
  }
  
  // Desenvolvimento local
  if (hostname === 'localhost' || hostname.startsWith('127.0.0.1')) {
    return '/api';
  }
  
  // Fallback para outros ambientes
  return '/api';
};

const API_BASE = getApiBaseUrl();

export interface Report {
  id: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
  locationId: string;
  locationName: string;
  title: string;
  content: string;
  images: string[];
  video?: string;
  createdAt: string;
  featured?: boolean;
  isPublic?: boolean;
  fishType?: string;
  weight?: string;
  location?: string;
  approved?: boolean;
  likes_count?: number;
  comments_count?: number;
}

export interface CreateReportData {
  title: string;
  content: string;
  location: string;
  fish_species: string;
  fish_weight?: string;
  is_public: boolean;
  approved?: boolean;
  images: File[];
  video?: File;
}

export interface UpdateReportData {
  title?: string;
  content?: string;
  location?: string;
  fish_species?: string;
  fish_weight?: string;
  is_public?: boolean;
  approved?: boolean;
  report_visibility?: Record<number, boolean>;
}

// Get all reports
export const getAllReports = async (): Promise<Report[]> => {
  try {
    const response = await fetch(`${API_BASE}/reports/index.php`, {
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
    console.error('Erro ao buscar relatórios:', error);
    return [];
  }
};

// Get reports by location
export const getReportsByLocation = async (locationId: string): Promise<Report[]> => {
  try {
    const response = await fetch(`${API_BASE}/reports/index.php?location_id=${locationId}`, {
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
    console.error('Erro ao buscar relatórios por localização:', error);
    return [];
  }
};

// Get reports by user
export const getReportsByUser = async (userId?: string): Promise<Report[]> => {
  try {
    const url = userId 
      ? `${API_BASE}/reports/index.php?user_id=${userId}`
      : `${API_BASE}/reports/index.php?my_reports=true`;
      
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Erro ao buscar relatórios do usuário');
    }

    return data.reports || [];
  } catch (error) {
    console.error('Erro ao buscar relatórios do usuário:', error);
    return [];
  }
};

// Get single report
export const getReport = async (id: string): Promise<Report | null> => {
  try {
    const response = await fetch(`${API_BASE}/reports/index.php?id=${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Erro ao buscar relatório');
    }

    return data.report || null;
  } catch (error) {
    console.error('Erro ao buscar relatório:', error);
    return null;
  }
};

// Create new report
export const createReport = async (reportData: CreateReportData): Promise<{ success: boolean; reportId?: string; message?: string }> => {
  try {
    const formData = new FormData();
    
    // Add text fields
    formData.append('title', reportData.title);
    formData.append('content', reportData.content);
    formData.append('location', reportData.location);
    formData.append('fish_species', reportData.fish_species);
    if (reportData.fish_weight) formData.append('fish_weight', reportData.fish_weight);
    formData.append('is_public', reportData.is_public ? '1' : '0');
    if (reportData.approved !== undefined) formData.append('approved', reportData.approved ? '1' : '0');
    
    // Add images
    reportData.images.forEach((file, index) => {
      formData.append(`images[${index}]`, file);
    });
    
    // Add video if exists
    if (reportData.video) {
      formData.append('video', reportData.video);
    }

    const response = await fetch(`${API_BASE}/reports/index.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();
    
    return {
      success: data.success,
      reportId: data.report_id,
      message: data.message
    };
  } catch (error) {
    console.error('Erro ao criar relatório:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};

// Update report
export const updateReport = async (id: string, reportData: UpdateReportData): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/reports/index.php`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: parseInt(id),
        ...reportData
      }),
    });

    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message
    };
  } catch (error) {
    console.error('Erro ao atualizar relatório:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};

// Delete report
export const deleteReport = async (id: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/reports/index.php`, {
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
    console.error('Erro ao deletar relatório:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};

// Toggle report like
export const toggleReportLike = async (id: string): Promise<{ success: boolean; liked: boolean; likes_count: number }> => {
  try {
    const response = await fetch(`${API_BASE}/reports/index.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'toggle_like',
        report_id: parseInt(id)
      }),
    });

    const data = await response.json();
    
    return {
      success: data.success,
      liked: data.liked || false,
      likes_count: data.likes_count || 0
    };
  } catch (error) {
    console.error('Erro ao curtir/descurtir relatório:', error);
    return {
      success: false,
      liked: false,
      likes_count: 0
    };
  }
};