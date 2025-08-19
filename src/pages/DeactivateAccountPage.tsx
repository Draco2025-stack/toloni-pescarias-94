
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle } from "lucide-react";

const DeactivateAccountPage = () => {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!password) {
      newErrors.password = "Senha é obrigatória para desativar a conta";
    }
    
    if (confirmText !== "DESATIVAR") {
      newErrors.confirmText = 'Digite exatamente "DESATIVAR" para confirmar';
    }
    
    if (!agreedToTerms) {
      newErrors.terms = "Você deve concordar com os termos para continuar";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    setTimeout(() => {
      toast.success("Conta desativada temporariamente");
      setIsSubmitting(false);
    }, 2000);
  };

  return (
    <div>
      <PageHeader title="Desativar Conta" description="Desative temporariamente sua conta" />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Atenção:</strong> Desativar sua conta ocultará seu perfil e conteúdo, 
              mas você pode reativá-la a qualquer momento fazendo login novamente.
            </AlertDescription>
          </Alert>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">O que acontece quando você desativa sua conta?</h2>
              <ul className="space-y-2 text-gray-600">
                <li>• Seu perfil ficará invisível para outros usuários</li>
                <li>• Seus relatos e comentários ficarão ocultos</li>
                <li>• Você não receberá notificações</li>
                <li>• Suas configurações e dados serão preservados</li>
                <li>• Você pode reativar a qualquer momento fazendo login</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">Confirme sua senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmText">
                  Digite "DESATIVAR" para confirmar (sem aspas)
                </Label>
                <Input
                  id="confirmText"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DESATIVAR"
                />
                {errors.confirmText && (
                  <p className="text-red-500 text-sm">{errors.confirmText}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm">
                  Entendo que posso reativar minha conta a qualquer momento e que meus dados serão preservados
                </Label>
              </div>
              {errors.terms && (
                <p className="text-red-500 text-sm">{errors.terms}</p>
              )}

              <div className="flex justify-end gap-2 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.history.back()}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="destructive"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" />
                      Desativando...
                    </>
                  ) : (
                    "Desativar Conta"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeactivateAccountPage;
