/**
 * Configuração centralizada de API - Segurança e Performance
 * Detecta ambiente de forma robusta e consistente
 */

import { safeLogger } from './logging';

// Cache da configuração para performance
let cachedConfig: ApiConfig | null = null;

export interface ApiConfig {
  apiBaseUrl: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isLovablePreview: boolean;
  hostname: string;
  protocol: string;
}

/**
 * Detecta o ambiente de forma robusta e segura
 */
export const getApiConfig = (): ApiConfig => {
  // Retorna cache se já foi calculado
  if (cachedConfig) {
    return cachedConfig;
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Detectar produção Hostinger - múltiplas validações para segurança
  const isProduction = (
    hostname.includes('tolonipescarias.com.br') ||
    hostname.includes('tolonipescarias.com') ||
    (protocol === 'https:' && hostname !== 'localhost' && !hostname.includes('lovable.app'))
  );
  
  // Detectar desenvolvimento local
  const isDevelopment = (
    hostname === 'localhost' || 
    hostname.startsWith('127.0.0.1') ||
    hostname.startsWith('192.168.')
  );
  
  // Lovable preview é qualquer ambiente que não é produção nem desenvolvimento
  const isLovablePreview = !isProduction && !isDevelopment;
  
  // Determinar URL base da API de forma segura
  let apiBaseUrl: string;
  
  if (isProduction) {
    apiBaseUrl = `https://${hostname}/api`;
  } else {
    // Para desenvolvimento e preview, usar caminho relativo
    apiBaseUrl = '/api';
  }
  
  cachedConfig = {
    apiBaseUrl,
    isProduction,
    isDevelopment,
    isLovablePreview,
    hostname,
    protocol
  };
  
  // Log apenas em desenvolvimento (sem dados sensíveis)
  safeLogger.debug('🔧 API Config:', {
    hostname,
    protocol,
    environment: isProduction ? 'production' : isDevelopment ? 'development' : 'preview'
  });
  
  return cachedConfig;
};

/**
 * Função legacy compatível com código existente
 */
export const getApiBaseUrl = (): string => {
  return getApiConfig().apiBaseUrl;
};

/**
 * Limpa cache da configuração (útil para testes)
 */
export const clearApiConfigCache = (): void => {
  cachedConfig = null;
};

/**
 * Hook para usar configuração em componentes React
 */
export const useApiConfig = () => {
  return getApiConfig();
};