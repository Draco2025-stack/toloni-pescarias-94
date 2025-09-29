/**
 * Configurações de segurança para aplicação frontend
 * Content Security Policy, Headers de Segurança, etc.
 */

import { getApiConfig } from './apiConfig';
import { safeLogger } from './logging';

export interface SecurityConfig {
  cspHeader: string;
  securityHeaders: Record<string, string>;
  allowedDomains: string[];
}

/**
 * Gera Content Security Policy baseado no ambiente
 */
const generateCSP = (): string => {
  const config = getApiConfig();
  
  // Base CSP - restritiva por padrão
  let csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // Necessário para Vite em dev
    "style-src 'self' 'unsafe-inline'", // Necessário para Tailwind
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'"
  ];
  
  // Adicionar domínios permitidos baseado no ambiente
  if (config.isProduction) {
    csp[5] += " https://tolonipescarias.com.br https://tolonipescarias.com";
  } else if (config.isDevelopment) {
    csp[5] += " http://localhost:* ws://localhost:*";
  } else {
    // Lovable preview
    csp[5] += " https://*.lovable.app wss://*.lovable.app";
  }
  
  return csp.join('; ');
};

/**
 * Obtém configuração de segurança completa
 */
export const getSecurityConfig = (): SecurityConfig => {
  const config = getApiConfig();
  
  const securityHeaders: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
  
  // Headers específicos para produção
  if (config.isProduction) {
    securityHeaders['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }
  
  const allowedDomains = config.isProduction
    ? ['tolonipescarias.com.br', 'tolonipescarias.com']
    : config.isDevelopment
      ? ['localhost', '127.0.0.1']
      : ['lovable.app'];
  
  return {
    cspHeader: generateCSP(),
    securityHeaders,
    allowedDomains
  };
};

/**
 * Aplica configurações de segurança no documento
 */
export const applySecurity = (): void => {
  const security = getSecurityConfig();
  
  // Aplicar meta tag CSP se não existir
  if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = security.cspHeader;
    document.head.appendChild(meta);
    
    safeLogger.debug('🔒 CSP aplicado:', security.cspHeader);
  }
  
  // Log de configuração de segurança aplicada
  safeLogger.debug('🛡️ Configuração de segurança ativa:', {
    environment: getApiConfig().isProduction ? 'production' : 'development',
    allowedDomains: security.allowedDomains.length
  });
};

/**
 * Valida se uma URL é de domínio permitido
 */
export const isAllowedDomain = (url: string): boolean => {
  try {
    const domain = new URL(url).hostname;
    const security = getSecurityConfig();
    
    return security.allowedDomains.some(allowed => 
      domain === allowed || domain.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
};

/**
 * Detecta possíveis ataques client-side
 */
export const detectSuspiciousActivity = (): void => {
  // Detectar tentativas de XSS via URL
  const url = window.location.href;
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(url))) {
    safeLogger.error('🚨 Atividade suspeita detectada na URL');
    
    if (getApiConfig().isProduction) {
      // Em produção, redirecionar para página segura
      window.location.href = '/';
    }
  }
  
  // Detectar tentativas de console hacking
  let devtools = false;
  const devtoolsDetector = () => {
    if (!devtools) {
      devtools = true;
      safeLogger.warn('🔧 DevTools detectado - modo desenvolvedor ativo');
    }
  };
  
  // Detectar console aberto
  setInterval(() => {
    if (window.outerHeight - window.innerHeight > 200 || 
        window.outerWidth - window.innerWidth > 200) {
      devtoolsDetector();
    }
  }, 1000);
};