const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8080' 
  : 'https://tolonipescarias.com.br';

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
      throw new Error(data.message || 'Erro ao buscar troféus');
    }

    return data.trophies || [];
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
      throw new Error(data.message || 'Erro ao buscar troféus');
    }

    return data.trophies || [];
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
      message: data.message,
      updated_entries: data.updated_entries
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