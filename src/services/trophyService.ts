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

export interface Trophy {
  id: string;
  fisherman_name: string;
  fish_type: string;
  location: string;
  image_url: string;
  weight: string;
  date: string;
  position: number;
  report_id: string;
}

// Get current month trophies
export const getCurrentMonthTrophies = async (): Promise<Trophy[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/trophies.php?action=getCurrentMonth`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Erro ao buscar troféus');
    }

    return data.data?.trophies || data.trophies || [];
  } catch (error) {
    console.error('Erro ao buscar troféus:', error);
    return [];
  }
};

// Get trophies by month
export const getTrophiesByMonth = async (month: string): Promise<Trophy[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/trophies.php?action=getByMonth&month=${month}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Erro ao buscar troféus');
    }

    return data.data?.trophies || data.trophies || [];
  } catch (error) {
    console.error('Erro ao buscar troféus:', error);
    return [];
  }
};

// Update trophy ranking (admin only)
export const updateTrophyRanking = async (): Promise<{ success: boolean; message?: string; updated_entries?: number }> => {
  try {
    const response = await fetch(`${API_BASE}/api/trophies.php?action=updateRanking`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    return {
      success: data.success,
      message: data.error?.message || data.message,
      updated_entries: data.data?.updated_entries || data.updated_entries
    };
  } catch (error) {
    console.error('Erro ao atualizar ranking:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};

// Auto update from reports (webhook)
export const autoUpdateFromReports = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/trophies.php?action=autoUpdate`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message
    };
  } catch (error) {
    console.error('Erro ao atualizar automaticamente:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};