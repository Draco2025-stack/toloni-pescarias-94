import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Cookie, ExternalLink } from "lucide-react";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { Link } from "react-router-dom";

const CookieBanner = () => {
  const { showBanner, acceptCookies, rejectCookies } = useCookieConsent();

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" />
      
      {/* Banner */}
      <Card className="relative w-full max-w-2xl mx-auto pointer-events-auto animate-in slide-in-from-bottom-5 duration-300">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Cookie Icon */}
            <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
              <Cookie className="h-6 w-6 text-primary" />
            </div>
            
            {/* Content */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Consentimento de Cookies
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Utilizamos cookies e tecnologias similares para melhorar sua experiência, 
                  personalizar conteúdo e analisar o tráfego do site. Seus dados pessoais 
                  são processados de acordo com nossa política de privacidade e a LGPD.
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  onClick={acceptCookies}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Aceitar Todos
                </Button>
                
                <Button 
                  onClick={rejectCookies}
                  variant="outline"
                  className="flex-1"
                >
                  Recusar
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  asChild
                  className="flex items-center gap-1 text-xs"
                >
                  <Link to="/privacy" target="_blank" rel="noopener noreferrer">
                    Política de Privacidade
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CookieBanner;