const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8080' 
  : 'https://tolonipescarias.com.br';

export interface CarouselItem {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  type: 'hero' | 'experience';
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCarouselData {
  title: string;
  subtitle: string;
  image_url: string;
  link_url?: string;
  type: 'hero' | 'experience';
  display_order?: number;
}

// Get carousels by type
export const getCarousels = async (type: 'hero' | 'experience' = 'hero'): Promise<CarouselItem[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/carousels.php?type=${type}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Erro ao buscar carrosséis');
    }

    return data.data?.carousels || [];
  } catch (error) {
    console.error('Erro ao buscar carrosséis:', error);
    return [];
  }
};

// Create carousel
export const createCarousel = async (carouselData: CreateCarouselData): Promise<{ success: boolean; message?: string; carousel_id?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/carousels.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(carouselData),
    });

    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message,
      carousel_id: data.carousel_id
    };
  } catch (error) {
    console.error('Erro ao criar carrossel:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};

// Update carousel
export const updateCarousel = async (id: string, carouselData: CreateCarouselData & { active?: boolean }): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/carousels.php`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...carouselData }),
    });

    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message
    };
  } catch (error) {
    console.error('Erro ao atualizar carrossel:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};

// Delete carousel
export const deleteCarousel = async (id: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/carousels.php`, {
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
    console.error('Erro ao deletar carrossel:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};