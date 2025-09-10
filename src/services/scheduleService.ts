const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8080' 
  : 'https://tolonipescarias.com.br';

export interface FishingSchedule {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  max_participants: number;
  price: number;
  image_url: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleData {
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  max_participants?: number;
  price?: number;
  image_url?: string;
}

// Get all schedules
export const getSchedules = async (): Promise<FishingSchedule[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/schedules.php`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Erro ao buscar cronogramas');
    }

    return data.schedules || [];
  } catch (error) {
    console.error('Erro ao buscar cronogramas:', error);
    return [];
  }
};

// Create schedule
export const createSchedule = async (scheduleData: CreateScheduleData): Promise<{ success: boolean; message?: string; schedule_id?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/schedules.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });

    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message,
      schedule_id: data.schedule_id
    };
  } catch (error) {
    console.error('Erro ao criar cronograma:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};

// Update schedule
export const updateSchedule = async (id: string, scheduleData: CreateScheduleData & { active?: boolean }): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/schedules.php`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...scheduleData }),
    });

    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message
    };
  } catch (error) {
    console.error('Erro ao atualizar cronograma:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};

// Delete schedule
export const deleteSchedule = async (id: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/schedules.php`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message
    };
  } catch (error) {
    console.error('Erro ao deletar cronograma:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};