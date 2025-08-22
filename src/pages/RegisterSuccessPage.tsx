import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import toloniLogo from "/lovable-uploads/18ea2e85-531f-4791-a50b-4dbd83b5f5dd.png";

const RegisterSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resendVerification, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    // Get email from location state or redirect if not available
    const emailFromState = location.state?.email;
    if (!emailFromState) {
      navigate("/register");
      return;
    }
    setEmail(emailFromState);
  }, [location.state, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    
    try {
      await resendVerification(email);
      toast.success("Email de verificação reenviado com sucesso!");
      setResendCooldown(60);
    } catch (err) {
      toast.error("Erro ao reenviar email. Tente novamente.");
    }
  };

  if (!email) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="flex items-center justify-center space-x-2">
            <img src={toloniLogo} alt="Toloni Pescarias Logo" className="h-12 w-12" />
            <span className="text-2xl font-heading font-bold text-fishing-blue">
              Toloni Pescarias
            </span>
          </Link>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Conta criada com sucesso!
          </h1>
          
          <div className="space-y-4 text-gray-600">
            <div className="flex items-center justify-center space-x-2 text-sm">
              <Mail className="h-4 w-4" />
              <span>Email enviado para:</span>
            </div>
            <p className="font-medium text-gray-900">{email}</p>
            
            <div className="bg-blue-50 p-4 rounded-lg text-left">
              <h3 className="font-medium text-blue-900 mb-2">Próximos passos:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Verifique sua caixa de entrada</li>
                <li>Clique no link de verificação no email</li>
                <li>Faça login com suas credenciais</li>
              </ol>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  Não recebeu o email? Verifique sua caixa de spam ou lixo eletrônico.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <Button
              onClick={handleResendVerification}
              variant="outline"
              disabled={isLoading || resendCooldown > 0}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" />
                  Reenviando...
                </>
              ) : resendCooldown > 0 ? (
                `Aguarde ${resendCooldown}s para reenviar`
              ) : (
                "Reenviar email de verificação"
              )}
            </Button>
            
            <Link to="/login">
              <Button variant="default" className="w-full">
                Ir para o Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterSuccessPage;