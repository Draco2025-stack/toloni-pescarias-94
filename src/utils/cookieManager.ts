// Gerenciador de cookies para diferentes tipos de consentimento

export interface CookieCategories {
  essential: boolean;    // Sempre true - cookies necessários para funcionamento
  analytics: boolean;    // Google Analytics, etc.
  marketing: boolean;    // Cookies de marketing/publicidade
  preferences: boolean;  // Preferências do usuário
}

export class CookieManager {
  private static instance: CookieManager;
  private categories: CookieCategories = {
    essential: true,
    analytics: false,
    marketing: false,
    preferences: false
  };

  static getInstance(): CookieManager {
    if (!CookieManager.instance) {
      CookieManager.instance = new CookieManager();
    }
    return CookieManager.instance;
  }

  // Aceitar todos os cookies
  acceptAll(): void {
    this.categories = {
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    this.enableCookies();
  }

  // Rejeitar cookies não essenciais
  rejectAll(): void {
    this.categories = {
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
    this.disableNonEssentialCookies();
  }

  // Configurar categorias específicas
  setCategories(categories: Partial<CookieCategories>): void {
    this.categories = { ...this.categories, ...categories };
    this.applyCookieSettings();
  }

  // Verificar se uma categoria está habilitada
  isEnabled(category: keyof CookieCategories): boolean {
    return this.categories[category];
  }

  // Aplicar configurações de cookies
  private applyCookieSettings(): void {
    if (this.categories.analytics) {
      this.enableAnalytics();
    } else {
      this.disableAnalytics();
    }

    if (this.categories.marketing) {
      this.enableMarketing();
    } else {
      this.disableMarketing();
    }

    if (this.categories.preferences) {
      this.enablePreferences();
    } else {
      this.disablePreferences();
    }
  }

  private enableCookies(): void {
    console.log('Habilitando todos os cookies');
    this.enableAnalytics();
    this.enableMarketing();
    this.enablePreferences();
  }

  private disableNonEssentialCookies(): void {
    console.log('Desabilitando cookies não essenciais');
    this.disableAnalytics();
    this.disableMarketing();
    this.disablePreferences();
  }

  private enableAnalytics(): void {
    // Aqui você habilitaria Google Analytics, etc.
    console.log('Analytics cookies habilitados');
    
    // Exemplo para Google Analytics (descomente se usar)
    // if (typeof gtag !== 'undefined') {
    //   gtag('consent', 'update', {
    //     'analytics_storage': 'granted'
    //   });
    // }
  }

  private disableAnalytics(): void {
    console.log('Analytics cookies desabilitados');
    
    // Exemplo para Google Analytics (descomente se usar)
    // if (typeof gtag !== 'undefined') {
    //   gtag('consent', 'update', {
    //     'analytics_storage': 'denied'
    //   });
    // }
  }

  private enableMarketing(): void {
    console.log('Marketing cookies habilitados');
    
    // Exemplo para Google Analytics (descomente se usar)
    // if (typeof gtag !== 'undefined') {
    //   gtag('consent', 'update', {
    //     'ad_storage': 'granted'
    //   });
    // }
  }

  private disableMarketing(): void {
    console.log('Marketing cookies desabilitados');
    
    // Exemplo para Google Analytics (descomente se usar)
    // if (typeof gtag !== 'undefined') {
    //   gtag('consent', 'update', {
    //     'ad_storage': 'denied'
    //   });
    // }
  }

  private enablePreferences(): void {
    console.log('Preferences cookies habilitados');
  }

  private disablePreferences(): void {
    console.log('Preferences cookies desabilitados');
  }

  // Obter status atual das categorias
  getCategories(): CookieCategories {
    return { ...this.categories };
  }
}

export const cookieManager = CookieManager.getInstance();