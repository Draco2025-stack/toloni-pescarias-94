import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Users, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSchedules, FishingSchedule } from "@/services/scheduleService";

const CronogramaPage = () => {
  const [schedules, setSchedules] = useState<FishingSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const data = await getSchedules();
        setSchedules(data);
      } catch (error) {
        console.error("Error loading schedules:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedules();
  }, []);

  const handleWhatsAppContact = (whatsapp?: string, title?: string) => {
    const phone = whatsapp || "5511972225982";
    const message = encodeURIComponent(
      `Olá! Gostaria de saber mais informações sobre: ${title || "Cronograma de Pescarias"}`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-gray-600">Carregando cronograma...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-fishing-blue mb-4">
          Cronograma de Pescarias
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Confira as próximas pescarias agendadas e garante sua vaga nas melhores aventuras!
        </p>
      </div>

      {schedules.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Nenhuma pescaria agendada
          </h3>
          <p className="text-gray-500 mb-6">
            Entre em contato conosco para saber sobre as próximas aventuras
          </p>
          <Button
            onClick={() => handleWhatsAppContact()}
            className="bg-fishing-green hover:bg-fishing-green/90"
          >
            <Phone className="h-4 w-4 mr-2" />
            Entrar em Contato
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-fishing-blue">
                    {schedule.title}
                  </CardTitle>
                  <Badge variant="outline" className="text-fishing-green border-fishing-green">
                    Disponível
                  </Badge>
                </div>
                <CardDescription>{schedule.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-fishing-blue" />
                  {schedule.date}
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2 text-fishing-blue" />
                  {schedule.time}
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-fishing-blue" />
                  {schedule.location}
                </div>
                
                {schedule.max_participants && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2 text-fishing-blue" />
                    Máximo {schedule.max_participants} pessoas
                  </div>
                )}
                
                {schedule.price && (
                  <div className="flex items-center text-sm font-semibold text-fishing-green">
                    R$ {schedule.price.toFixed(2)}
                  </div>
                )}

                <Button
                  onClick={() => handleWhatsAppContact(undefined, schedule.title)}
                  className="w-full bg-fishing-green hover:bg-fishing-green/90"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Reservar Vaga
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CronogramaPage;