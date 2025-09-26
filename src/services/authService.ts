// Serviço de autenticação conectado às APIs reais

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  isAdmin: boolean;
  emailVerified: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
  user?: AuthUser;
  authenticated?: boolean;
}

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
  
  // Fallback para outros ambientes (Lovable preview, etc)
  return '/api';
};

// Serviço de autenticação
export class AuthService {
  private static readonly API_BASE = getApiBaseUrl();

  private static async apiCall(endpoint: string, options: RequestInit = {}): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_BASE}${endpoint}`, {
        ...options,
        credentials: 'include', // Importante para cookies de sessão
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || { code: 'HTTP_ERROR', message: `HTTP ${response.status}` }
        };
      }

      return data;
    } catch (error) {
      console.error('API call failed:', error);
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'Erro de conexão com o servidor' }
      };
    }
  }

  // Métodos públicos - sempre usam APIs reais
  static async login(email: string, password: string): Promise<AuthResponse> {
    return this.apiCall('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  static async checkSession(): Promise<AuthResponse> {
    return this.apiCall('/auth/check-session.php', {
      method: 'GET'
    });
  }

  static async register(name: string, email: string, password: string): Promise<AuthResponse> {
    return this.apiCall('/auth/register.php', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  }

  static async logout(): Promise<AuthResponse> {
    return this.apiCall('/auth/logout.php', {
      method: 'POST'
    });
  }

  static async resendVerification(email: string): Promise<AuthResponse> {
    return this.apiCall('/auth/resend-verification.php', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  static async forgotPassword(email: string): Promise<AuthResponse> {
    return this.apiCall('/auth/forgot-password.php', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  static async resetPassword(token: string, password: string): Promise<AuthResponse> {
    return this.apiCall('/auth/reset-password.php', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    });
  }
}