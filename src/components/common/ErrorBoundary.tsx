import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log do erro para monitoramento
    this.logError(error, errorInfo);
    
    // Chamar callback personalizado se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    this.setState({ error, errorInfo });
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Enviar erro para sistema de monitoramento
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      console.error('Error Details:', errorData);
      
      // Aqui você pode integrar com serviços de monitoramento como Sentry
      // Sentry.captureException(error, { contexts: { react: errorInfo } });
      
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // Renderizar fallback personalizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Renderizar UI de erro padrão
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Oops! Algo deu errado</CardTitle>
              <CardDescription>
                Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver o problema.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-muted p-4 rounded-lg text-sm">
                  <summary className="cursor-pointer font-medium mb-2">
                    Detalhes do erro (desenvolvimento)
                  </summary>
                  <div className="space-y-2 text-muted-foreground">
                    <div>
                      <strong>Erro:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack trace:</strong>
                        <pre className="text-xs mt-1 overflow-auto">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <div className="flex gap-2 w-full">
                <Button 
                  onClick={this.handleRetry} 
                  variant="default" 
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button 
                  onClick={this.handleGoHome} 
                  variant="outline" 
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ir para Início
                </Button>
              </div>
              
              <Button 
                onClick={this.handleReload} 
                variant="ghost" 
                size="sm" 
                className="w-full"
              >
                Recarregar Página
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para usar ErrorBoundary de forma programática
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Handled error:', error, errorInfo);
    
    // Log error para monitoramento
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...(errorInfo && { componentStack: errorInfo.componentStack })
    };
    
    console.error('Error Details:', errorData);
  };
};

// Componente de erro específico para chunks de código
export const ChunkErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar componente</h3>
          <p className="text-muted-foreground mb-4">
            Falha ao carregar parte da aplicação. Tente recarregar a página.
          </p>
          <Button onClick={() => window.location.reload()}>
            Recarregar Página
          </Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};