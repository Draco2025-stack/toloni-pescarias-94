import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Hook para validação automática de sessão
export const useSessionValidation = () => {
  const { checkSession, user } = useAuth();

  useEffect(() => {
    // Verificar sessão a cada 5 minutos se o usuário estiver logado
    let interval: NodeJS.Timeout;
    
    if (user) {
      interval = setInterval(() => {
        checkSession();
      }, 5 * 60 * 1000); // 5 minutos
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user, checkSession]);

  // Verificar sessão ao focar na aba
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        checkSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, checkSession]);

  return { user };
};