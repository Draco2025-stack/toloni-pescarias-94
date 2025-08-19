
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import toloniLogo from "/lovable-uploads/18ea2e85-531f-4791-a50b-4dbd83b5f5dd.png";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(email, password);
      
      // Get the redirect path from location state or default to home
      const from = location.state?.from?.pathname || "/";
      navigate(from);
      
      toast.success("Login realizado com sucesso!");
    } catch (err) {
      // Check if error is about unverified email
      if (err instanceof Error && err.message.includes('Email não verificado')) {
        setShowResendVerification(true);
      }
    }
  };

  const [showResendVerification, setShowResendVerification] = useState(false);
  const { resendVerification } = useAuth();

  const handleResendVerification = async () => {
    try {
      await resendVerification(email);
      toast.success("Email de verificação reenviado!");
      setShowResendVerification(false);
    } catch (err) {
      // Error is handled by the auth context
    }
  };

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
          <h1 className="mt-6 text-3xl font-bold">Login</h1>
          <p className="mt-2 text-gray-600">
            Entre para compartilhar suas experiências de pesca
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-fishing-blue hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {showResendVerification && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800 mb-2">
                  Email não verificado. Verifique sua caixa de entrada ou reenvie a verificação.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={isLoading}
                >
                  Reenviar verificação
                </Button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full ripple-effect"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>

            <div className="mt-6 text-center text-sm">
              <p>
                Não tem uma conta?{" "}
                <Link to="/register" className="text-fishing-blue hover:underline">
                  Registre-se
                </Link>
              </p>
            </div>

            <div className="mt-8 border-t pt-6">
              <div className="text-center text-sm text-gray-500">
                <p className="mb-2">
                  <strong>Toloni Pescarias</strong> - Sua plataforma de pesca
                </p>
                <p className="text-xs">
                  Registre-se com qualquer email para começar a compartilhar suas pescarias
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
