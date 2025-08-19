// Utility para bootstrap do administrador no ambiente de desenvolvimento

export const bootstrapAdmin = async (): Promise<boolean> => {
  try {
    // Verificar se é ambiente de desenvolvimento
    const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('lovable');
    
    if (!isDev) {
      console.log('Bootstrap admin não é executado em produção');
      return false;
    }

    // No ambiente Lovable, o mock já configura o admin automaticamente
    console.log('✅ Admin configurado automaticamente no ambiente de desenvolvimento');
    console.log('📧 Email: toloni.focos@gmail.com');
    console.log('🔑 Senha: admin123');
    
    return true;
  } catch (error) {
    console.error('Erro no bootstrap do admin:', error);
    return false;
  }
};

// Executar bootstrap automaticamente no ambiente de desenvolvimento
export const autoBootstrapAdmin = () => {
  const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('lovable');
  
  if (isDev) {
    // Executar após um pequeno delay para garantir que a aplicação está carregada
    setTimeout(() => {
      bootstrapAdmin().then(success => {
        if (success) {
          console.log('✅ Admin bootstrap executado com sucesso');
        }
      });
    }, 1000);
  }
};