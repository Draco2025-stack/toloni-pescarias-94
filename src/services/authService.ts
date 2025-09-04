// Serviço de autenticação com mock para Lovable e API real para produção

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  profileImage?: string;  // Adicionar propriedade opcional
  isAdmin: boolean;
  emailVerified: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  authenticated?: boolean;
}

// Mock data para ambiente de desenvolvimento
const MOCK_ADMIN_USER: AuthUser = {
  id: '1',
  name: 'Administrador',
  email: 'toloni.focos@gmail.com',
  isAdmin: true,
  emailVerified: true
};

// Detectar ambiente
const isProduction = window.location.hostname.includes('tolonipescarias.com.br');
const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname.includes('lovable.dev') ||
                      window.location.hostname.includes('lovable');

// Mock storage para simular sessão
class MockAuthStorage {
  private static readonly SESSION_KEY = 'mock_auth_session';
  
  static setUser(user: AuthUser | null) {
    if (user) {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.SESSION_KEY);
    }
  }
  
  static getUser(): AuthUser | null {
    const stored = localStorage.getItem(this.SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  }
  
  static clear() {
    localStorage.removeItem(this.SESSION_KEY);
  }
}

// Serviço de autenticação
export class AuthService {
  private static readonly API_BASE = isProduction 
    ? 'https://tolonipescarias.com.br/api'
    : '/api';

  // Mock para ambiente de desenvolvimento
  private static async mockLogin(email: string, password: string): Promise<AuthResponse> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verificar credenciais mock
    if (email === 'toloni.focos@gmail.com' && password === 'admin123') {
      MockAuthStorage.setUser(MOCK_ADMIN_USER);
      return {
        success: true,
        message: 'Login realizado com sucesso',
        user: MOCK_ADMIN_USER
      };
    }
    
    // Aceitar outros emails válidos como usuários comuns
    if (email.includes('@') && password.length >= 6) {
      const mockUser: AuthUser = {
        id: '2',
        name: email.split('@')[0],
        email: email,
        isAdmin: false,
        emailVerified: true
      };
      MockAuthStorage.setUser(mockUser);
      return {
        success: true,
        message: 'Login realizado com sucesso',
        user: mockUser
      };
    }
    
    return {
      success: false,
      message: 'Email ou senha incorretos'
    };
  }

  private static async mockCheckSession(): Promise<AuthResponse> {
    const user = MockAuthStorage.getUser();
    return {
      success: true,
      message: user ? 'Sessão válida' : 'Não autenticado',
      authenticated: !!user,
      user: user || undefined
    };
  }

  private static async mockRegister(name: string, email: string, password: string): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simular registro bem-sucedido
    return {
      success: true,
      message: 'Conta criada com sucesso! Verifique seu e-mail.'
    };
  }

  private static async mockLogout(): Promise<AuthResponse> {
    MockAuthStorage.clear();
    return {
      success: true,
      message: 'Logout realizado com sucesso'
    };
  }

  // APIs reais para produção
  private static async realApiCall(endpoint: string, options: RequestInit = {}): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_BASE}${endpoint}`, {
        ...options,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw new Error('Erro de conexão com o servidor');
    }
  }

  // Métodos públicos
  static async login(email: string, password: string): Promise<AuthResponse> {
    if (isDevelopment) {
      console.log('🚀 Usando mock login para desenvolvimento');
      return this.mockLogin(email, password);
    }
    
    return this.realApiCall('/auth/login.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });
  }

  static async checkSession(): Promise<AuthResponse> {
    if (isDevelopment) {
      console.log('🚀 Usando mock session para desenvolvimento');
      return this.mockCheckSession();
    }
    
    return this.realApiCall('/auth/check-session.php', {
      method: 'GET'
    });
  }

  static async register(name: string, email: string, password: string): Promise<AuthResponse> {
    if (isDevelopment) {
      console.log('🚀 Usando mock register para desenvolvimento');
      return this.mockRegister(name, email, password);
    }
    
    return this.realApiCall('/auth/register.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password })
    });
  }

  static async logout(): Promise<AuthResponse> {
    if (isDevelopment) {
      console.log('🚀 Usando mock logout para desenvolvimento');
      return this.mockLogout();
    }
    
    return this.realApiCall('/auth/logout.php', {
      method: 'POST'
    });
  }

  static async resendVerification(email: string): Promise<AuthResponse> {
    if (isDevelopment) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        message: 'E-mail de verificação reenviado (mock)'
      };
    }
    
    return this.realApiCall('/auth/resend-verification.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });
  }

  // Forgot password
  static async forgotPassword(email: string): Promise<AuthResponse> {
    if (isDevelopment) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        message: 'Se o email existir em nossa base de dados, você receberá instruções para redefinir sua senha.'
      };
    }
    
    return this.realApiCall('/auth/forgot-password.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  }

  // Reset password
  static async resetPassword(token: string, password: string): Promise<AuthResponse> {
    if (isDevelopment) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        message: 'Senha redefinida com sucesso! Faça login com sua nova senha.'
      };
    }
    
    return this.realApiCall('/auth/reset-password.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
  }
}