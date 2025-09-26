// Serviço para gerenciar localidades de pesca - APIs Reais

// Detectar ambiente e configurar API base  
const getApiBaseUrl = (): string => {
  const hostname = window.location.hostname;
  
  // Produção
  if (hostname.includes('tolonipescarias.com.br')) {
    return 'https://tolonipescarias.com.br/api';
  }
  
  // Desenvolvimento Lovable (usar API real)
  return '/api';
};

const API_BASE = getApiBaseUrl();

export interface Location {
  id: string;
  name: string;
  description: string;
  image: string;
  whatsapp: string;
  featured?: boolean;
  latitude?: number;
  longitude?: number;
  address?: string;
  contact_email?: string;
  website?: string;
  facilities?: string[];
  fish_species?: string[];
  price_range?: string;
  operating_hours?: string;
  created_at?: string;
  approved?: boolean;
}

export interface CreateLocationData {
  name: string;
  description: string;
  address?: string;
  whatsapp?: string;
  contact_email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  facilities?: string[];
  fish_species?: string[];
  price_range?: string;
  operating_hours?: string;
  image?: File;
}

// Get all locations
export const getLocations = async (): Promise<Location[]> => {
  try {
    const response = await fetch(`${API_BASE}/locations/index.php`, {
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
    console.error('Erro ao buscar localidades:', error);
    return [];
  }
};

// Get single location
export const getLocation = async (id: string): Promise<Location | null> => {
  try {
    const response = await fetch(`${API_BASE}/locations/index.php?id=${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Erro ao buscar localidade');
    }

    return data.location || null;
  } catch (error) {
    console.error('Erro ao buscar localidade:', error);
    return null;
  }
};

// Get featured locations
export const getFeaturedLocations = async (): Promise<Location[]> => {
  try {
    const response = await fetch(`${API_BASE}/locations/index.php?featured=true`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Erro ao buscar localidades em destaque');
    }

    return data.locations || [];
  } catch (error) {
    console.error('Erro ao buscar localidades em destaque:', error);
    return [];
  }
};

// Create new location (suggest)
export const createLocation = async (locationData: CreateLocationData): Promise<{ success: boolean; locationId?: string; message?: string }> => {
  try {
    const formData = new FormData();
    
    // Add text fields
    formData.append('name', locationData.name);
    formData.append('description', locationData.description);
    if (locationData.address) formData.append('address', locationData.address);
    if (locationData.whatsapp) formData.append('whatsapp', locationData.whatsapp);
    if (locationData.contact_email) formData.append('contact_email', locationData.contact_email);
    if (locationData.website) formData.append('website', locationData.website);
    if (locationData.latitude) formData.append('latitude', locationData.latitude.toString());
    if (locationData.longitude) formData.append('longitude', locationData.longitude.toString());
    if (locationData.price_range) formData.append('price_range', locationData.price_range);
    if (locationData.operating_hours) formData.append('operating_hours', locationData.operating_hours);
    
    // Add arrays as JSON
    if (locationData.facilities) formData.append('facilities', JSON.stringify(locationData.facilities));
    if (locationData.fish_species) formData.append('fish_species', JSON.stringify(locationData.fish_species));
    
    // Add image if exists
    if (locationData.image) {
      formData.append('image', locationData.image);
    }

    const response = await fetch(`${API_BASE}/locations/index.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();
    
    return {
      success: data.success,
      locationId: data.location_id,
      message: data.message
    };
  } catch (error) {
    console.error('Erro ao criar localidade:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};

// Update location (admin only)
export const updateLocation = async (id: string, locationData: Partial<CreateLocationData>): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/locations/index.php`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: parseInt(id),
        ...locationData
      }),
    });

    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message
    };
  } catch (error) {
    console.error('Erro ao atualizar localidade:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};

// Delete location (admin only)
export const deleteLocation = async (id: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/locations/index.php`, {
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
    console.error('Erro ao deletar localidade:', error);
    return {
      success: false,
      message: 'Erro interno do servidor'
    };
  }
};

// Search locations
export const searchLocations = async (query: string): Promise<Location[]> => {
  try {
    const response = await fetch(`${API_BASE}/locations/index.php?search=${encodeURIComponent(query)}`, {
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
    console.error('Erro ao buscar localidades:', error);
    return [];
  }
};