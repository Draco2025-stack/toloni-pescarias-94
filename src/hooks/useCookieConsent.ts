import { useState, useEffect } from 'react';
import { cookieManager } from '@/utils/cookieManager';

type ConsentStatus = 'pending' | 'accepted' | 'rejected';

interface CookieConsentState {
  status: ConsentStatus;
  showBanner: boolean;
  acceptCookies: () => void;
  rejectCookies: () => void;
}

const COOKIE_NAME = 'cookie_consent';
const COOKIE_EXPIRY_DAYS = 30;

// Função para definir cookie
const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

// Função para ler cookie
const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const useCookieConsent = (): CookieConsentState => {
  const [status, setStatus] = useState<ConsentStatus>('pending');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Verificar se já existe consentimento salvo
    const existingConsent = getCookie(COOKIE_NAME);
    
    if (existingConsent === 'accepted') {
      setStatus('accepted');
      setShowBanner(false);
    } else if (existingConsent === 'rejected') {
      setStatus('rejected');
      setShowBanner(false);
    } else {
      // Primeira visita - mostrar banner
      setStatus('pending');
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    setCookie(COOKIE_NAME, 'accepted', COOKIE_EXPIRY_DAYS);
    setStatus('accepted');
    setShowBanner(false);
    
    // Habilitar todos os cookies através do gerenciador
    cookieManager.acceptAll();
  };

  const rejectCookies = () => {
    setCookie(COOKIE_NAME, 'rejected', COOKIE_EXPIRY_DAYS);
    setStatus('rejected');
    setShowBanner(false);
    
    // Desabilitar cookies não essenciais através do gerenciador
    cookieManager.rejectAll();
  };

  return {
    status,
    showBanner,
    acceptCookies,
    rejectCookies
  };
};