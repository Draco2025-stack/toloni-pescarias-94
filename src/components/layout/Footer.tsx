
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Fish, MapPin, ChevronDown } from "lucide-react";
import toloniLogoOfficial from "/lovable-uploads/18ea2e85-531f-4791-a50b-4dbd83b5f5dd.png";
import { getLocations, Location } from "@/services/mockData";

const Footer = () => {
  const [popularLocations, setPopularLocations] = useState<Location[]>([]);
  const [showAllLocations, setShowAllLocations] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locations = await getLocations();
        // Get featured or most popular locations
        const featured = locations.filter(loc => loc.featured);
        setPopularLocations(featured.length > 0 ? featured : locations.slice(0, 5));
      } catch (error) {
        console.error("Error fetching locations for footer:", error);
      }
    };

    fetchLocations();
  }, []);

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Olá! Estou interessado nas pescarias da Toloni Pescarias e gostaria de mais informações.");
    const phoneNumber = "5511972225982";
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <footer className="bg-gradient-to-br from-fishing-green to-fishing-green-light text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link to="/" className="mb-4 inline-block">
              <span className="text-2xl font-heading font-bold">Toloni Pescarias</span>
            </Link>
            <p className="text-sm text-gray-200 mb-4">
              Sua plataforma para compartilhar experiências de pesca e conectar-se com outros pescadores.
            </p>
          </div>
          
          <div>
            <h3 className="font-heading font-semibold text-xl mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-200 hover:text-white transition-colors flex items-center">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-200 hover:text-white transition-colors flex items-center">
                  Sobre
                </Link>
              </li>
              <li>
                <Link to="/locations" className="text-gray-200 hover:text-white transition-colors flex items-center">
                  Localidades
                </Link>
              </li>
              <li>
                <Link to="/suggest-location" className="text-gray-200 hover:text-white transition-colors flex items-center">
                  Sugerir Localidade
                  <MapPin className="ml-1 h-4 w-4" />
                </Link>
              </li>
              <li>
                <Link to="/reports" className="text-gray-200 hover:text-white transition-colors flex items-center">
                  Relatos
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-200 hover:text-white transition-colors flex items-center">
                  Contato
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <h3 className="font-heading font-semibold text-xl">Localidades Populares</h3>
              <button 
                onClick={() => setShowAllLocations(!showAllLocations)}
                className="rounded-full p-1 hover:bg-white/10 transition-colors"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
            <ul className="space-y-2">
              {(showAllLocations ? popularLocations : popularLocations.slice(0, 3)).map(location => (
                <li key={location.id}>
                  <Link 
                    to={`/locations/${location.id}`} 
                    className="text-gray-200 hover:text-white transition-colors flex items-center"
                  >
                    <MapPin className="mr-2 h-4 w-4 text-fishing-sand" />
                    {location.name}
                  </Link>
                </li>
              ))}
              {!showAllLocations && popularLocations.length > 3 && (
                <li className="pt-2">
                  <button 
                    onClick={() => setShowAllLocations(true)}
                    className="text-fishing-sand hover:text-fishing-sand-dark transition-colors text-sm font-medium"
                  >
                    Ver todas ({popularLocations.length})
                  </button>
                </li>
              )}
            </ul>
            
            <h3 className="font-heading font-semibold text-xl mt-6 mb-4">Contato</h3>
            <address className="not-italic text-gray-200">
              <p className="mb-2">Email: contato@tolonipescarias.com</p>
              <button 
                onClick={handleWhatsAppClick}
                className="text-fishing-sand hover:text-fishing-sand-dark transition-colors mb-2 block"
              >
                WhatsApp: (11) 97222-5982
              </button>
              <p>Brasil</p>
            </address>
          </div>
        </div>
        
        <div className="border-t border-gray-600 mt-8 pt-6 text-center text-sm text-gray-300">
          <p>© {new Date().getFullYear()} Toloni Pescarias. Todos os direitos reservados.</p>
          <div className="mt-2 space-x-4">
            <Link to="/terms" className="hover:text-white transition-colors">
              Termos de Uso
            </Link>
            <Link to="/privacy" className="hover:text-white transition-colors">
              Política de Privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
