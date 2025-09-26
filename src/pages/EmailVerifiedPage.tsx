import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const EmailVerifiedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkSession } = useAuth();
  const [status, setStatus] = useState<'success' | 'error'>('error');

  const verified = searchParams.get('verified');
  const error = searchParams.get('error');

  useEffect(() => {
    if (verified === '1') {
      setStatus('success');
      toast({
        title: "Email verificado com sucesso!",
        description: "Sua conta foi ativada. Você já está logado.",
      });
      checkSession();
      setTimeout(() => navigate('/', { replace: true }), 3000);
    } else {
      setStatus('error');
    }
  }, [verified, error, checkSession, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'success' ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-2xl text-green-800">Email Verificado!</CardTitle>
            </>
          ) : (
            <>
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <CardTitle className="text-2xl text-red-800">Erro na Verificação</CardTitle>
            </>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'success' ? (
            <Button onClick={() => navigate('/')} className="w-full">
              Ir para a Página Inicial
            </Button>
          ) : (
            <div className="space-y-3">
              <Button onClick={() => navigate('/login')} className="w-full">
                Fazer Login
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                Voltar ao Início
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerifiedPage;