import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, DollarSign, Fish, Anchor, Sun, ChevronDown, ChevronUp, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

// Define the schedule interface based on the admin form structure
interface Schedule {
  id: number;
  title: string;
  location: string;
  date: string;
  time: string;
  duration: string;
  participants: string;
  status: string;
  details: {
    trajectory: string;
    departure: string;
    return: string;
    boat: string;
    equipment: string;
    includes: string;
    whatsapp: string;
  };
}

const CronogramaPage = () => {
  const [expandedSchedule, setExpandedSchedule] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch real schedules from PHP backend
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      // This will connect to your PHP backend on Hostinger
      const response = await fetch('/api/schedules.php');
      const data = await response.json();
      
      if (data.success) {
        // Filter only active schedules with future dates
        const activeSchedules = data.schedules.filter((schedule: any) => {
          const scheduleDate = new Date(schedule.date);
          const today = new Date();
          return schedule.status === 'active' && scheduleDate >= today;
        });
        setSchedules(activeSchedules);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      // Keep empty array if there's an error
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleWhatsAppRedirect = (whatsappNumber: string, scheduleName: string) => {
    const message = encodeURIComponent(`Olá! Gostaria de reservar uma vaga para a ${scheduleName}. Poderia me fornecer mais informações?`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const toggleExpanded = (scheduleId: number) => {
    setExpandedSchedule(expandedSchedule === scheduleId ? null : scheduleId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-fishing-blue to-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
            Cronograma de Pescarias
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Descubra como funciona nosso sistema de agendamento e participe das melhores pescarias organizadas
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Como Funciona */}
        <section className="mb-16">
          <h2 className="text-3xl font-heading font-bold text-center mb-12">Como Funciona o Cronograma</h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center">
              <CardHeader>
                <Calendar className="h-12 w-12 text-fishing-blue mx-auto mb-4" />
                <CardTitle>1. Escolha a Data</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Navegue pelo cronograma e escolha a pescaria que mais combina com sua agenda e preferências.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-fishing-blue mx-auto mb-4" />
                <CardTitle>2. Reserve sua Vaga</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Entre em contato via WhatsApp para confirmar sua participação e receber todas as informações.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Fish className="h-12 w-12 text-fishing-blue mx-auto mb-4" />
                <CardTitle>3. Aproveite a Pescaria</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Compareça no local e horário combinado e desfrute de uma experiência inesquecível de pesca.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Tipos de Pescaria */}
        <section className="mb-16">
          <h2 className="text-3xl font-heading font-bold text-center mb-12">Tipos de Pescaria</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Sun className="h-8 w-8 text-yellow-500" />
                  <CardTitle>Pescaria Diurna</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Início entre 5h e 7h da manhã</li>
                  <li>• Duração de 6 a 8 horas</li>
                  <li>• Ideal para iniciantes</li>
                  <li>• Inclui café da manhã e almoço</li>
                  <li>• Foco em peixes de água doce ou costeiros</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Anchor className="h-8 w-8 text-blue-600" />
                  <CardTitle>Pescaria Oceânica</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Saída madrugada (4h às 6h)</li>
                  <li>• Duração de 10 a 12 horas</li>
                  <li>• Para pescadores experientes</li>
                  <li>• Inclui todas as refeições</li>
                  <li>• Pesca de peixes grandes em alto mar</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Cronograma Atual */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-heading font-bold mb-4">Próximas Pescarias</h2>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Carregando pescarias...</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12">
              
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhuma pescaria agendada</h3>
              <p className="text-gray-500">Novas pescarias serão cadastradas em breve!</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {schedules.map((schedule) => (
              <Card key={schedule.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-3">{schedule.title}</h3>
                      <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-fishing-blue" />
                          {schedule.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-fishing-blue" />
                          {schedule.date}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-fishing-blue" />
                          Horário de Duração: {schedule.time} ({schedule.duration})
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-fishing-blue" />
                          Máx. {schedule.participants}
                        </div>
                      </div>
                    </div>
                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                       <div className="text-center">
                         <div className={`text-sm ${schedule.status === 'Vagas Disponíveis' ? 'text-green-600' : 'text-orange-600'}`}>
                           {schedule.status}
                         </div>
                       </div>
                      <Button 
                        className="bg-fishing-green hover:bg-green-600 flex items-center gap-2"
                        onClick={() => toggleExpanded(schedule.id)}
                      >
                        Mais Detalhes
                        {expandedSchedule === schedule.id ? 
                          <ChevronUp className="h-4 w-4" /> : 
                          <ChevronDown className="h-4 w-4" />
                        }
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedSchedule === schedule.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-fishing-blue mb-2">Trajeto</h4>
                            <p className="text-gray-600 text-sm">{schedule.details.trajectory}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-fishing-blue mb-2">Horários</h4>
                            <p className="text-gray-600 text-sm">
                              <strong>Saída:</strong> {schedule.details.departure}<br/>
                              <strong>Retorno:</strong> {schedule.details.return}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-fishing-blue mb-2">Embarcação</h4>
                            <p className="text-gray-600 text-sm">{schedule.details.boat}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-fishing-blue mb-2">Equipamentos</h4>
                            <p className="text-gray-600 text-sm">{schedule.details.equipment}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-fishing-blue mb-2">Incluso</h4>
                            <p className="text-gray-600 text-sm">{schedule.details.includes}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 text-center">
                        <Button 
                          size="lg" 
                          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 mx-auto"
                          onClick={() => handleWhatsAppRedirect(schedule.details.whatsapp, schedule.title)}
                        >
                          <Phone className="h-5 w-5" />
                          Reserve sua Vaga
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </section>

        {/* O que está Incluído */}
        <section className="mb-16">
          <h2 className="text-3xl font-heading font-bold text-center mb-12">O que está Incluído</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <Fish className="h-12 w-12 text-fishing-blue mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Equipamentos</h3>
                <p className="text-sm text-gray-600">Varas, molinetes, iscas e todos os equipamentos necessários</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Anchor className="h-12 w-12 text-fishing-blue mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Embarcação</h3>
                <p className="text-sm text-gray-600">Barcos seguros e equipados com todos os itens de segurança</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Users className="h-12 w-12 text-fishing-blue mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Guia Experiente</h3>
                <p className="text-sm text-gray-600">Guias especializados que conhecem os melhores pontos</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <DollarSign className="h-12 w-12 text-fishing-blue mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Refeições</h3>
                <p className="text-sm text-gray-600">Café da manhã, almoço e lanches durante a pescaria</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center bg-fishing-blue text-white rounded-lg p-12">
          <h2 className="text-3xl font-heading font-bold mb-4">
            Pronto para sua Próxima Aventura?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Entre em contato conosco e reserve sua vaga nas melhores pescarias da região
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-fishing-green hover:bg-green-600"
              onClick={() => window.location.href = '/locations'}
            >
              Ver Localidades
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white text-fishing-blue hover:bg-gray-100"
              onClick={() => {
                const message = encodeURIComponent("Olá, gostaria de saber quais são as próximas pescarias.");
                window.open(`https://wa.me/5511972225982?text=${message}`, '_blank');
              }}
            >
              Entrar em Contato
            </Button>
          </div>
        </section>
      </div>
      
      {/* Bottom Right Logo */}
      <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg">
        <span className="text-fishing-blue font-semibold text-sm">Toloni Pescarias</span>
      </div>
    </div>
  );
};

export default CronogramaPage;
