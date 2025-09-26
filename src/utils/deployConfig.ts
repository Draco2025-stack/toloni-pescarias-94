// Configuração específica para deploy na Hostinger
// Este arquivo garante que a detecção de ambiente seja robusta

export const getEnvironmentConfig = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Detectar produção Hostinger
  const isProduction = (
    hostname.includes('tolonipescarias.com.br') ||
    hostname.includes('tolonipescarias.com') ||
    (protocol === 'https:' && hostname !== 'localhost' && !hostname.includes('lovable.app'))
  );
  
  // Detectar desenvolvimento local
  const isLocalDev = (
    hostname === 'localhost' || 
    hostname.startsWith('127.0.0.1') ||
    hostname.startsWith('192.168.')
  );
  
  return {
    isProduction,
    isDevelopment: isLocalDev,
    isLovablePreview: !isProduction && !isLocalDev,
    apiBaseUrl: isProduction 
      ? `https://${hostname}/api`
      : '/api',
    siteUrl: isProduction 
      ? `https://${hostname}`
      : window.location.origin
  };
};

// Hook para usar em qualquer service
export const useEnvironmentConfig = () => {
  return getEnvironmentConfig();
};

// Função para debug (remover após deploy funcionar)
export const debugEnvironment = () => {
  const config = getEnvironmentConfig();
  console.log('🔧 Debug Ambiente:', {
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    config
  });
  return config;
};