
import { useState, useEffect } from "react";
import { X, Calendar, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FishingEvent {
  id: string;
  eventName: string;
  date: string;
  time: string;
  location: string;
  whatsappNumber: string;
  isActive: boolean;
}

// Sistema limpo - eventos serão configurados pelo administrador
const mockFishingEvent: FishingEvent = {
  id: "1",
  eventName: "",
  date: "",
  time: "",
  location: "",
  whatsappNumber: "",
  isActive: false // Popup desabilitado até configuração
};

const FishingReminderPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [fishingEvent] = useState<FishingEvent>(mockFishingEvent);

  useEffect(() => {
    // Show popup after 2 seconds if event is active
    if (fishingEvent.isActive) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [fishingEvent.isActive]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Olá! Gostaria de mais informações sobre a pescaria: ${fishingEvent.eventName} no dia ${new Date(fishingEvent.date).toLocaleDateString('pt-BR')} às ${fishingEvent.time}.`
    );
    window.open(`https://wa.me/${fishingEvent.whatsappNumber}?text=${message}`, '_blank');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isVisible || !fishingEvent.isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full bg-gradient-to-br from-fishing-blue to-fishing-green text-white border-none shadow-2xl transform animate-in zoom-in-95 duration-300">
        <CardContent className="p-6 relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute top-2 right-2 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="text-center space-y-4">
            <div className="bg-white/20 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            
            <div>
              <Badge className="bg-white text-fishing-blue mb-2">
                Próxima Pescaria
              </Badge>
              <h3 className="text-xl font-bold mb-2">{fishingEvent.eventName}</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(fishingEvent.date)} às {fishingEvent.time}</span>
              </div>
              
              <div className="flex items-center justify-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{fishingEvent.location}</span>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                onClick={handleWhatsAppContact}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Contato via WhatsApp
              </Button>
              
              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full bg-white/20 border-white/40 text-white hover:bg-white/30"
              >
                Fechar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FishingReminderPopup;
