/**
 * Logging utilities seguro para produção
 * Remove automaticamente logs sensíveis em ambiente de produção
 */

// Detectar se estamos em produção
const isProduction = import.meta.env.PROD || 
                    window.location.hostname.includes('tolonipescarias.com');

// Lista de palavras que indicam informações sensíveis
const SENSITIVE_KEYWORDS = [
  'password', 'senha', 'token', 'key', 'secret', 'api_key',
  'auth', 'login', 'credential', 'smtp', 'database', 'db_pass'
];

/**
 * Verifica se um valor contém informações sensíveis
 */
function containsSensitiveData(value: any): boolean {
  if (typeof value === 'string') {
    return SENSITIVE_KEYWORDS.some(keyword => 
      value.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  
  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).some(key => 
      SENSITIVE_KEYWORDS.some(keyword => 
        key.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }
  
  return false;
}

/**
 * Sanitiza dados removendo informações sensíveis
 */
function sanitizeData(data: any): any {
  if (typeof data === 'string' && containsSensitiveData(data)) {
    return '[REDACTED]';
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = Array.isArray(data) ? [] : {};
    
    for (const [key, value] of Object.entries(data)) {
      if (containsSensitiveData(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeData(value);
      }
    }
    
    return sanitized;
  }
  
  return data;
}

/**
 * Logger seguro que remove informações sensíveis em produção
 */
export const safeLogger = {
  log: (...args: any[]) => {
    if (!isProduction) {
      console.log(...args.map(sanitizeData));
    }
  },
  
  error: (...args: any[]) => {
    // Sempre loggar erros, mas sanitizados
    console.error(...args.map(sanitizeData));
  },
  
  warn: (...args: any[]) => {
    if (!isProduction) {
      console.warn(...args.map(sanitizeData));
    }
  },
  
  debug: (...args: any[]) => {
    if (!isProduction) {
      console.debug(...args.map(sanitizeData));
    }
  },
  
  info: (...args: any[]) => {
    if (!isProduction) {
      console.info(...args.map(sanitizeData));
    }
  }
};

/**
 * Log apenas para desenvolvimento
 */
export const devLogger = {
  log: (...args: any[]) => {
    if (!isProduction) {
      console.log('[DEV]', ...args);
    }
  }
};

/**
 * Remove todos os console.log em produção
 * Use este wrapper para substituir console.log direto
 */
export const logger = isProduction ? {
  log: () => {},
  error: console.error,
  warn: () => {},
  debug: () => {},
  info: () => {}
} : console;