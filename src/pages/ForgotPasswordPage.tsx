import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import toloniLogo from "@/assets/toloni-logo-official-circle.png";
import PageHeader from "@/components/common/PageHeader";
import { useAuth } from "@/contexts/AuthContext";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { forgotPassword } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await forgotPassword(email);
      
      if (result.success) {
        setSubmitted(true);
        toast.success("Link de redefinição enviado! Verifique seu e-mail e pasta de spam.");
      } else {
        setError(result.message || "Erro ao enviar o link de recuperação. Tente novamente.");
      }
    } catch (err) {
      setError("Erro ao enviar o link de recuperação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col items-center py-12 px-4">
      <PageHeader 
        title="Redefinir Senha" 
        description="Digite seu e-mail para receber um link de redefinição de senha"
      />

      <div className="max-w-md w-full space-y-8 mt-8">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          {!submitted ? (
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

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" />
                    Enviando...
                  </>
                ) : (
                  "Enviar link de redefinição"
                )}
              </Button>
              
              <div className="mt-4 text-center text-sm">
                <Link to="/login" className="text-fishing-blue hover:underline">
                  Voltar para o login
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="inline-flex justify-center items-center w-16 h-16 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900">E-mail enviado!</h3>
              <p className="text-gray-600">
                Enviamos um link de redefinição de senha para <strong>{email}</strong>. 
                Verifique sua caixa de entrada e também a pasta de spam.
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Dica:</strong> Se não encontrar o e-mail, verifique sua pasta de spam ou lixo eletrônico.
                </p>
              </div>
              <div className="mt-6">
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Voltar para o login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>
            Ainda não tem uma conta?{" "}
            <Link to="/register" className="text-fishing-blue hover:underline">
              Registre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;