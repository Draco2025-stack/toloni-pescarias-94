import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Fish, MapPin, Users, ChevronRight } from "lucide-react";
import LocationCard from "@/components/common/LocationCard";
import ReportCard from "@/components/common/ReportCard";
import { getLocations, getAllReports, Location, Report } from "@/services/mockData";
import { useAuth } from "@/contexts/AuthContext";
import HeroCarousel from "@/components/common/HeroCarousel";
import TrophyGallery from "@/components/common/TrophyGallery";


const HomePage = () => {
  const { user } = useAuth();
  const [featuredLocations, setFeaturedLocations] = useState<Location[]>([]);
  const [latestReports, setLatestReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [locationsData, reportsData] = await Promise.all([
          getLocations(),
          getAllReports(),
        ]);
        
        // Get featured locations or first 3 if none are featured
        const featured = locationsData.filter(loc => loc.featured);
        setFeaturedLocations(featured.length > 0 ? featured : locationsData.slice(0, 3));
        
        // Get latest 3 reports
        setLatestReports(reportsData.slice(0, 3));
      } catch (error) {
        console.error("Error loading homepage data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

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

  return (
    <div>
      
      {/* Hero Section with enhanced background and new hero carousel */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-blue-600">
        {/* Gradient background instead of placeholder image */}
        
        <div className="absolute inset-0 bg-gradient-to-r from-fishing-blue/90 to-transparent"></div>
        
        <div className="container mx-auto px-4 py-16 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-screen">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-6 text-white animate-fade-in">
              Viva a Melhor Aventura de Pesca da Sua Vida com a Toloni Pescarias!
            </h1>
            <p className="text-xl mb-8 text-white/90 animate-[fade-in_0.5s_ease-out_0.3s_forwards] opacity-0">
              Conecte-se com outros pescadores, descubra novos locais e compartilhe suas aventuras na maior comunidade de pesca do Brasil.
            </p>
            <div className="flex flex-wrap gap-4 animate-[fade-in_0.5s_ease-out_0.6s_forwards] opacity-0">
              <Button size="lg" className="bg-fishing-green hover:bg-fishing-green/90 shadow-lg" asChild>
                <Link to="/reports">
                  Começar Agora
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white hover:bg-white/30" asChild>
                <Link to="/locations">Explorar Localidades</Link>
              </Button>
            </div>
          </div>
          
          {/* New Hero Carousel Component */}
          <div className="flex justify-center lg:justify-end">
            <HeroCarousel />
          </div>
        </div>
        
        {/* Decorative wave effect with enhanced animation */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="fill-white h-12 w-full">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C50.55,0,112.11,17.6,165.47,40.22,205.12,55.51,246.41,69.4,321.39,56.44Z"></path>
          </svg>
        </div>
      </section>

      {/* Feature Cards with enhanced design - Botões trocados de lugar */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-fishing-green/5 to-fishing-green/10 rounded-lg p-6 text-center hover:shadow-md transition-all hover:transform hover:scale-105">
              <div className="bg-gradient-to-r from-fishing-green to-fishing-green-light rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4 shadow-md">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold font-heading mb-3 text-fishing-green">Descubra Localidades</h3>
              <p className="text-gray-600">
                Encontre os melhores locais para pesca e saiba mais sobre cada região.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-fishing-blue/5 to-fishing-blue/10 rounded-lg p-6 text-center hover:shadow-md transition-all hover:transform hover:scale-105">
              <div className="bg-gradient-to-r from-fishing-blue to-fishing-blue-light rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4 shadow-md">
                <Fish className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold font-heading mb-3 text-fishing-blue">Compartilhe Relatos</h3>
              <p className="text-gray-600">
                Compartilhe suas experiências de pesca com fotos, vídeos e descrições detalhadas.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-fishing-sand/30 to-fishing-sand-dark/30 rounded-lg p-6 text-center hover:shadow-md transition-all hover:transform hover:scale-105">
              <div className="bg-gradient-to-r from-fishing-sand-dark to-amber-500 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4 shadow-md">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold font-heading mb-3 text-amber-800">Conecte-se</h3>
              <p className="text-gray-600">
                Interaja com outros pescadores através de comentários e crie uma comunidade.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Locations with enhanced styling */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold font-heading bg-gradient-to-r from-fishing-blue to-fishing-green bg-clip-text text-transparent">
              Localidades em Destaque
            </h2>
            <Button variant="outline" className="border-fishing-blue text-fishing-blue hover:bg-fishing-blue/5" asChild>
              <Link to="/locations">Ver todas</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredLocations.map((location) => (
              <LocationCard key={location.id} location={location} />
            ))}
          </div>
        </div>
      </section>

      {/* Latest Reports with improved visuals */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold font-heading bg-gradient-to-r from-fishing-green to-fishing-blue bg-clip-text text-transparent">
              Últimos Relatos
            </h2>
            <Button variant="outline" className="border-fishing-green text-fishing-green hover:bg-fishing-green/5" asChild>
              <Link to="/reports">Ver todos</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
          
          <div className="mt-12 text-center">
            {user ? (
              <Button size="lg" className="bg-gradient-to-r from-fishing-green to-fishing-blue hover:opacity-90 shadow-lg transition-all" asChild>
                <Link to="/create-report">
                  Compartilhe seu relato
                  <Fish className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {/* Adventure CTA Section */}
      <section className="py-16 bg-gradient-to-r from-fishing-blue to-fishing-blue-light text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-heading mb-4">
            Pronto para sua Próxima Aventura?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Entre em contato conosco e reserve sua vaga nas melhores pescarias da região
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-fishing-green hover:bg-fishing-green/90 shadow-lg" asChild>
              <Link to="/locations">Ver Localidades</Link>
            </Button>
            <Button 
              size="lg" 
              className="bg-white text-fishing-blue hover:bg-gray-100 shadow-lg"
              onClick={() => {
                const message = encodeURIComponent("Olá, gostaria de saber quais são as próximas pescarias.");
                window.open(`https://wa.me/5511972225982?text=${message}`, '_blank');
              }}
            >
              Entrar em Contato
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section with enhanced design */}
      <section className="py-16 bg-gradient-to-r from-fishing-green to-fishing-blue text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-heading mb-4">
            Junte-se à nossa comunidade de pescadores
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Compartilhe suas histórias, descubra novos locais e conecte-se com outros entusiastas da pesca.
          </p>
          {!user && (
            <div className="flex justify-center">
              <Button size="lg" className="bg-white text-fishing-green hover:bg-gray-100 shadow-lg" asChild>
                <Link to="/register">Criar Conta</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
