
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Save, Eye, EyeOff, MapPin, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FishingReminderPopup from "@/components/common/FishingReminderPopup";

interface FishingReminderData {
  eventName: string;
  date: string;
  time: string;
  location: string;
  whatsappNumber: string;
  isActive: boolean;
  showOnAllPages: boolean;
}

const AdminFishingReminder = () => {
  const { toast } = useToast();
  const [reminderData, setReminderData] = useState<FishingReminderData>({
    eventName: "Pescaria no Rio Paraguaçu",
    date: "2024-02-15",
    time: "05:30",
    location: "Rio Paraguaçu - Cachoeira/BA",
    whatsappNumber: "5575999999999",
    isActive: true,
    showOnAllPages: true
  });
  const [showPreview, setShowPreview] = useState(false);

  const validateWhatsApp = (number: string): boolean => {
    // Validates format: DDI + DDD + Number (e.g., 5575999999999)
    const whatsappRegex = /^55\d{2}\d{8,9}$/;
    return whatsappRegex.test(number.replace(/\D/g, ''));
  };

  const validateTime = (time: string): boolean => {
    // Validates HH:MM format and valid time ranges
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const validateDate = (date: string): boolean => {
    // Validates date format and that it's not in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  };

  const validateForm = (): boolean => {
    const errors = [];

    if (!reminderData.eventName.trim()) {
      errors.push("Nome do Evento é obrigatório");
    }

    if (!reminderData.whatsappNumber.trim()) {
      errors.push("WhatsApp é obrigatório");
    } else if (!validateWhatsApp(reminderData.whatsappNumber)) {
      errors.push("WhatsApp deve ter formato válido (ex: 5575999999999)");
    }

    if (!reminderData.date) {
      errors.push("Data é obrigatória");
    } else if (!validateDate(reminderData.date)) {
      errors.push("Data deve ser hoje ou uma data futura");
    }

    if (!reminderData.time) {
      errors.push("Horário é obrigatório");
    } else if (!validateTime(reminderData.time)) {
      errors.push("Horário deve ter formato válido (HH:MM)");
    }

    if (!reminderData.location.trim()) {
      errors.push("Local da Pescaria é obrigatório");
    }

    if (errors.length > 0) {
      toast({
        title: "Erro ao salvar configurações!",
        description: "Verifique os campos: " + errors.join(", "),
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // In a real app, this would save to the backend
      console.log("Saving fishing reminder data:", reminderData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Lembrete atualizado",
        description: "As configurações do pop-up foram salvas com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar configurações!",
        description: "Verifique os campos.",
        variant: "destructive"
      });
    }
  };

  const togglePreview = () => {
    setShowPreview(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gerenciar Pop-up de Pescarias</h2>
        <p className="text-gray-600">Configure o pop-up que aparece para visitantes do site</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Configurações do Pop-up
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Activation Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="popup-active"
              checked={reminderData.isActive}
              onCheckedChange={(checked) =>
                setReminderData(prev => ({ ...prev, isActive: checked }))
              }
            />
            <Label htmlFor="popup-active">Pop-up ativo</Label>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-name">Nome do Evento</Label>
              <Input
                id="event-name"
                value={reminderData.eventName}
                onChange={(e) =>
                  setReminderData(prev => ({ ...prev, eventName: e.target.value }))
                }
                placeholder="Ex: Pescaria no Rio Paraguaçu"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp (com código do país)</Label>
              <Input
                id="whatsapp"
                value={reminderData.whatsappNumber}
                onChange={(e) =>
                  setReminderData(prev => ({ ...prev, whatsappNumber: e.target.value }))
                }
                placeholder="Ex: 5575999999999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-date">Data</Label>
              <Input
                id="event-date"
                type="date"
                value={reminderData.date}
                onChange={(e) =>
                  setReminderData(prev => ({ ...prev, date: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-time">Horário</Label>
              <Input
                id="event-time"
                type="time"
                value={reminderData.time}
                onChange={(e) =>
                  setReminderData(prev => ({ ...prev, time: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Local da Pescaria</Label>
            <Textarea
              id="location"
              value={reminderData.location}
              onChange={(e) =>
                setReminderData(prev => ({ ...prev, location: e.target.value }))
              }
              placeholder="Ex: Rio Paraguaçu - Cachoeira/BA"
              rows={2}
            />
          </div>

          {/* Display Options */}
          <div className="flex items-center space-x-2">
            <Switch
              id="show-all-pages"
              checked={reminderData.showOnAllPages}
              onCheckedChange={(checked) =>
                setReminderData(prev => ({ ...prev, showOnAllPages: checked }))
              }
            />
            <Label htmlFor="show-all-pages">Exibir em todas as páginas</Label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Salvar Configurações
            </Button>
            
            <Button variant="outline" onClick={togglePreview} className="flex items-center gap-2">
              {reminderData.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Visualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md p-0 bg-transparent border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Preview do Pop-up</DialogTitle>
          </DialogHeader>
          <PreviewFishingPopup 
            eventData={reminderData}
            onClose={() => setShowPreview(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Preview component that mimics the real popup
const PreviewFishingPopup = ({ eventData, onClose }: { eventData: FishingReminderData, onClose: () => void }) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Olá! Gostaria de mais informações sobre a pescaria: ${eventData.eventName} no dia ${new Date(eventData.date).toLocaleDateString('pt-BR')} às ${eventData.time}.`
    );
    window.open(`https://wa.me/${eventData.whatsappNumber}?text=${message}`, '_blank');
  };

  if (!eventData.isActive) {
    return (
      <Card className="max-w-md w-full bg-gray-100 text-gray-500 border-gray-300 shadow-2xl">
        <CardContent className="p-6 text-center">
          <p>Pop-up está desativado</p>
          <Button variant="outline" onClick={onClose} className="mt-4">
            Fechar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md w-full bg-gradient-to-br from-fishing-blue to-fishing-green text-white border-none shadow-2xl transform animate-in zoom-in-95 duration-300">
      <CardContent className="p-6 relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-2 right-2 text-white hover:bg-white/20"
        >
          <EyeOff className="h-4 w-4" />
        </Button>

        <div className="text-center space-y-4">
          <div className="bg-white/20 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          
          <div>
            <div className="bg-white text-fishing-blue mb-2 px-2 py-1 rounded text-sm inline-block">
              Próxima Pescaria
            </div>
            <h3 className="text-xl font-bold mb-2">{eventData.eventName}</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(eventData.date)} às {eventData.time}</span>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{eventData.location}</span>
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
              onClick={onClose}
              className="w-full bg-white/20 border-white/40 text-white hover:bg-white/30"
            >
              Fechar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminFishingReminder;
