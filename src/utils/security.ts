// Utilitários de segurança para o frontend

// Sanitização básica de strings para prevenção de XSS
export const sanitizeString = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove tags HTML básicas
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Validação de URLs para prevenção de redirecionamento malicioso
export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    // Permitir apenas HTTP(S) e domínios conhecidos
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

// Validação de redirecionamento seguro
export const isSafeRedirect = (url: string): boolean => {
  if (!url) return true;
  
  // URLs relativas são seguras
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true;
  }
  
  // Verificar se é do mesmo domínio
  try {
    const urlObj = new URL(url);
    const currentDomain = window.location.hostname;
    return urlObj.hostname === currentDomain || 
           urlObj.hostname.endsWith(`.${currentDomain}`);
  } catch {
    return false;
  }
};

// Gerar token CSRF para requisições
export const getCSRFToken = (): string | null => {
  // Procurar por meta tag CSRF
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    return metaTag.getAttribute('content');
  }
  
  // Procurar em cookie se disponível
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
};

// Adicionar token CSRF automaticamente às requisições
export const addCSRFToken = (headers: Record<string, string> = {}): Record<string, string> => {
  const token = getCSRFToken();
  if (token) {
    headers['X-CSRF-Token'] = token;
  }
  return headers;
};

// Rate limiting no cliente
class ClientRateLimit {
  private limits: Map<string, { count: number; resetTime: number }> = new Map();

  check(key: string, maxRequests: number = 60, windowMs: number = 60000): boolean {
    const now = Date.now();
    const limit = this.limits.get(key);

    if (!limit || now > limit.resetTime) {
      this.limits.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (limit.count >= maxRequests) {
      return false;
    }

    limit.count++;
    return true;
  }

  reset(key: string): void {
    this.limits.delete(key);
  }
}

export const clientRateLimit = new ClientRateLimit();

// Wrapper seguro para fetch com proteções automáticas
export const secureFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Aplicar rate limiting
  const rateLimitKey = `fetch:${url}`;
  if (!clientRateLimit.check(rateLimitKey, 100, 60000)) {
    throw new Error('Rate limit exceeded. Please wait before making more requests.');
  }

  // Adicionar headers de segurança
  const headers = addCSRFToken({
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>
  });

  // Configurações seguras padrão
  const secureOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'same-origin', // Incluir cookies apenas para mesmo domínio
    referrerPolicy: 'strict-origin-when-cross-origin'
  };

  try {
    const response = await fetch(url, secureOptions);
    
    // Reset rate limit em caso de sucesso
    if (response.ok) {
      clientRateLimit.reset(rateLimitKey);
    }
    
    return response;
  } catch (error) {
    console.error('Secure fetch error:', error);
    throw error;
  }
};

// Logging seguro de erros (sem dados sensíveis)
export const logSecureError = (error: Error, context?: Record<string, any>): void => {
  const safeContext = context ? {
    ...context,
    // Remover dados potencialmente sensíveis
    password: undefined,
    token: undefined,
    session: undefined,
    cookie: undefined
  } : {};
  
  console.error('Application Error:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    ...safeContext
  });
};

// Validação de arquivos para upload
export const validateFileUpload = (file: File, allowedTypes: string[] = ['image/jpeg', 'image/png'], maxSize: number = 5 * 1024 * 1024): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo selecionado' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}` };
  }

  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return { valid: false, error: `Arquivo muito grande. Máximo permitido: ${maxSizeMB}MB` };
  }

  return { valid: true };
};

// Detectar possíveis ataques XSS em strings
export const detectXSS = (input: string): boolean => {
  const xssPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /expression\s*\(/gi,
    /vbscript:/gi
  ];

  return xssPatterns.some(pattern => pattern.test(input));
};

// Máscara para dados sensíveis em logs
export const maskSensitiveData = (data: string, visibleChars: number = 4): string => {
  if (!data || data.length <= visibleChars) {
    return data;
  }
  
  const masked = '*'.repeat(data.length - visibleChars);
  return data.slice(0, visibleChars) + masked;
};