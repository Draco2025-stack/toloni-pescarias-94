import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';

const EmailVerifiedPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSession, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const handleVerification = async () => {
      const isVerified = searchParams.get('verified') === '1';
      
      if (isVerified) {
        setVerified(true);
        
        // Aguardar um momento para garantir que o cookie foi definido
        setTimeout(async () => {
          try {
            // Verificar sessão para atualizar o contexto de autenticação
            await checkSession();
            setIsLoading(false);
            
            toast.success('Email verificado com sucesso! Você está logado.');
            
            // Redirecionar para home após 2 segundos
            setTimeout(() => {
              navigate('/', { replace: true });
            }, 2000);
            
          } catch (error) {
            console.error('Erro ao verificar sessão:', error);
            setIsLoading(false);
            toast.error('Erro ao fazer login automático. Faça login manualmente.');
            
            setTimeout(() => {
              navigate('/login', { replace: true });
            }, 2000);
          }
        }, 1000);
      } else {
        setIsLoading(false);
        toast.error('Link de verificação inválido.');
        navigate('/login', { replace: true });
      }
    };

    handleVerification();
  }, [searchParams, checkSession, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Verificando email...
          </h2>
          <p className="text-gray-600">
            Aguarde enquanto confirmamos sua verificação e fazemos seu login.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col items-center py-12 px-4">
      <PageHeader 
        title="Email Verificado" 
        description="Sua conta foi ativada com sucesso"
      />

      <div className="max-w-md w-full space-y-8 mt-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center space-y-6">
          {verified ? (
            <>
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  Bem-vindo(a) ao Toloni Pescarias!
                </h3>
                <p className="text-gray-600">
                  Seu email foi verificado com sucesso e você já está logado.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  🎣 <strong>Parabéns!</strong> Sua conta está ativa e pronta para uso.
                  Você será redirecionado automaticamente em alguns segundos.
                </p>
              </div>

              {user && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    👋 Olá, <strong>{user.name}</strong>! 
                    Agora você pode criar relatórios de pesca e muito mais.
                  </p>
                </div>
              )}

              <Button 
                onClick={() => navigate('/')} 
                className="w-full"
              >
                Ir para a página inicial
              </Button>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">❌</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  Erro na verificação
                </h3>
                <p className="text-gray-600">
                  Houve um problema ao verificar seu email. Tente fazer login manualmente.
                </p>
              </div>

              <Button 
                onClick={() => navigate('/login')} 
                className="w-full"
              >
                Ir para login
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerifiedPage;