
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService, type AuthUser } from '@/services/authService';

// Define types for User and Auth Context
export type User = AuthUser;

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  resendVerification: (email: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  checkSession: () => Promise<void>;
};

// Email do administrador - único administrador do sistema
const ADMIN_EMAIL = "toloni.focos@gmail.com";

// Domínios permitidos para cadastro
const ALLOWED_DOMAINS = [
  "tolonipescarias.com",
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com"
];

// Função para determinar se é o administrador
const isAdminEmail = (email: string): boolean => {
  return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();
};

// Função para validar domínio do email
const isDomainAllowed = (email: string): boolean => {
  const domain = email.toLowerCase().split('@')[1];
  return ALLOWED_DOMAINS.includes(domain);
};

// API base URL - configurado para ambiente Lovable e produção
const isHostingerProduction = window.location.hostname.includes('tolonipescarias.com.br');
const isDevelopmentEnv = window.location.hostname === 'localhost' || 
                        window.location.hostname.includes('lovable.dev') ||
                        window.location.hostname.includes('lovable');

const API_BASE = isDevelopmentEnv 
  ? '/api'  // Usar API local no ambiente Lovable
  : 'https://tolonipescarias.com.br/api';  // URL real da Hostinger em produção

// Create the auth context
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for session cookie on component mount
  useEffect(() => {
    checkSession();
  }, []);

  // Verificar sessão atual
  const checkSession = async () => {
    setIsLoading(true);
    try {
      const data = await AuthService.checkSession();

      if (data.success && data.authenticated) {
        setUser(data.user!);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to check session:", err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await AuthService.login(email, password);

      if (!data.success) {
        throw new Error(data.message || 'Falha ao realizar login');
      }

      // Verificar email apenas em produção e para não-admins
      const userIsAdmin = isAdminEmail(email);
      
      if (data.user && !data.user.emailVerified && !isDevelopmentEnv && !userIsAdmin) {
        throw new Error('Email não verificado. Verifique sua caixa de entrada.');
      }

      setUser(data.user!);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao realizar login");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validar domínio antes de enviar para backend (exceto para admin)
      if (!isDomainAllowed(email) && !isAdminEmail(email)) {
        throw new Error('Domínio de email não permitido');
      }

      const data = await AuthService.register(name, email, password);

      if (!data.success) {
        throw new Error(data.message || 'Falha ao criar conta');
      }

      // Não fazer login automático - usuário precisa verificar email primeiro
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar conta");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification email
  const resendVerification = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await AuthService.resendVerification(email);

      if (!data.success) {
        throw new Error(data.message || 'Falha ao reenviar verificação');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao reenviar verificação");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await AuthService.forgotPassword(email);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar e-mail de recuperação");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (token: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await AuthService.resetPassword(token, newPassword);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao redefinir senha");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (err) {
      console.error("Error during logout:", err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      forgotPassword, 
      resetPassword,
      resendVerification,
      checkSession,
      isLoading, 
      error 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
