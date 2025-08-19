import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportCard from "@/components/common/ReportCard";
import { MapPin, Fish, Clock, Users, Calendar, MessageCircle } from "lucide-react";
import { getLocation, getReportsByLocation, Location, Report } from "@/services/mockData";

interface ExtendedLocation extends Location {
  especies?: string;
  melhorEpoca?: string;
  estrutura?: string;
  atividades?: string;
}

const LocationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useState<ExtendedLocation | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState("sobre");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const [locationData, reportsData] = await Promise.all([
          getLocation(id),
          getReportsByLocation(id)
        ]);
        
        if (locationData) {
          setLocation(locationData);
          setReports(reportsData);
        }
      } catch (error) {
        console.error("Error loading location data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [id]);

  const openWhatsApp = () => {
    if (!location) return;
    
    const message = encodeURIComponent("Olá! Estou interessado nas pescarias da Toloni Pescarias e gostaria de mais informações.");
    const url = `https://wa.me/5511972225982?text=${message}`;
    window.open(url, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Localidade não encontrada</h1>
          <Button asChild>
            <Link to="/locations">Voltar para localidades</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-72 md:h-96 bg-cover bg-center" style={{ backgroundImage: `url('${location.image}')` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent">
          <div className="container mx-auto px-4 h-full flex flex-col justify-end pb-8">
            <div className="text-white">
              <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
                {location.name}
              </h1>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-1" />
                <span>Brasil</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="sobre">Sobre</TabsTrigger>
            <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
            <TabsTrigger value="relatos">Relatos ({reports.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sobre" className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-heading font-semibold mb-4">Descrição</h2>
              <div className="space-y-4 text-gray-700">
                <p className="whitespace-pre-line">{location.description}</p>
                
                <div className="mt-6 space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800">Características da Localidade</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Espécies Encontradas</h4>
                      <p className="text-blue-700">
                        {location.especies || "Pirararucu, Tucunaré, Tambaqui, Piraíba, Dourado, Pintado e muitas outras espécies amazônicas."}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Melhor Época</h4>
                      <p className="text-green-700">
                        {location.melhorEpoca || "De junho a novembro, durante a estação seca, quando os peixes se concentram nas áreas mais profundas."}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2">Estrutura</h4>
                      <p className="text-yellow-700">
                        {location.estrutura || "Lodge completo com quartos confortáveis, restaurante, bar, área de descanso e equipamentos de pesca."}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">Atividades</h4>
                      <p className="text-purple-700">
                        {location.atividades || "Pesca esportiva, observação da fauna, passeios de barco, caminhadas na floresta e experiências culturais."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">O que está incluído</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Hospedagem em quartos climatizados com banheiro privativo</li>
                    <li>Todas as refeições (café da manhã, almoço e jantar)</li>
                    <li>Guia de pesca especializado</li>
                    <li>Barcos e equipamentos de pesca</li>
                    <li>Iscas e material de pesca básico</li>
                    <li>Transfers do aeroporto/porto</li>
                    <li>Seguro de viagem</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-8">
                <Button onClick={openWhatsApp} className="bg-green-600 hover:bg-green-700">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Contato via WhatsApp
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="cronograma" className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-heading font-semibold mb-6">Cronograma da Pescaria</h2>
              
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold">Dia 1 - Chegada</h3>
                  </div>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>14:00</strong> - Chegada ao lodge e check-in</p>
                    <p><strong>15:00</strong> - Apresentação da equipe e briefing de segurança</p>
                    <p><strong>16:00</strong> - Primeira pescaria de reconhecimento</p>
                    <p><strong>18:30</strong> - Retorno ao lodge</p>
                    <p><strong>19:30</strong> - Jantar de boas-vindas</p>
                  </div>
                </div>

                <div className="border-l-4 border-green-500 pl-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Fish className="h-5 w-5 text-green-500" />
                    <h3 className="text-lg font-semibold">Dia 2 - Pesca Intensiva</h3>
                  </div>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>05:30</strong> - Café da manhã</p>
                    <p><strong>06:00</strong> - Saída para pesca matinal</p>
                    <p><strong>12:00</strong> - Almoço no barco ou retorno ao lodge</p>
                    <p><strong>14:00</strong> - Pesca vespertina</p>
                    <p><strong>18:00</strong> - Retorno e descanso</p>
                    <p><strong>19:30</strong> - Jantar e compartilhamento de experiências</p>
                  </div>
                </div>

                <div className="border-l-4 border-yellow-500 pl-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-yellow-500" />
                    <h3 className="text-lg font-semibold">Dia 3 - Atividades Extras</h3>
                  </div>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>06:00</strong> - Café da manhã</p>
                    <p><strong>06:30</strong> - Pesca em novos pontos</p>
                    <p><strong>10:00</strong> - Visita à comunidade ribeirinha</p>
                    <p><strong>12:30</strong> - Almoço típico na comunidade</p>
                    <p><strong>15:00</strong> - Pesca de tambaqui</p>
                    <p><strong>18:00</strong> - Retorno ao lodge</p>
                    <p><strong>20:00</strong> - Jantar de despedida</p>
                  </div>
                </div>

                <div className="border-l-4 border-red-500 pl-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-red-500" />
                    <h3 className="text-lg font-semibold">Dia 4 - Partida</h3>
                  </div>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>07:00</strong> - Café da manhã</p>
                    <p><strong>08:00</strong> - Última pescaria (opcional)</p>
                    <p><strong>10:00</strong> - Check-out e preparação da bagagem</p>
                    <p><strong>11:00</strong> - Transfer para o aeroporto/porto</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Observações Importantes</h4>
                <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
                  <li>Os horários podem variar conforme as condições climáticas</li>
                  <li>As atividades são flexíveis e podem ser adaptadas ao grupo</li>
                  <li>Sempre acompanhado por guias experientes</li>
                  <li>Material de pesca fornecido, mas você pode trazer o seu próprio</li>
                </ul>
              </div>

              <div className="mt-6">
                <Button onClick={openWhatsApp} className="bg-green-600 hover:bg-green-700">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Reservar via WhatsApp
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="relatos">
            {reports.length > 0 ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reports.map((report) => (
                    <ReportCard key={report.id} report={report} showLocationLink={false} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <Fish className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum relato ainda</h3>
                <p className="text-gray-600 mb-6">
                  Esta localidade ainda não possui relatos de pescaria.
                </p>
                <Button asChild>
                  <Link to="/create-report">Criar o primeiro relato</Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LocationDetailPage;
