
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import LocationCard from "@/components/common/LocationCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";
import { getLocations, Location } from "@/services/mockData";
import { useAuth } from "@/contexts/AuthContext";

const LocationsPage = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await getLocations();
        setLocations(data);
        setFilteredLocations(data);
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = locations.filter(location =>
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations(locations);
    }
  }, [searchQuery, locations]);

  return (
    <div>
      <PageHeader 
        title="Localidades de Pesca"
        description="Descubra os melhores lugares para pescar e compartilhar experiências"
        image=""
      />

      <div className="container mx-auto px-4 py-12">
        {/* Search Bar & Suggest Location */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por localidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {user && (
            <Button 
              className="w-full md:w-auto bg-fishing-green hover:bg-fishing-green-light"
              asChild
            >
              <Link to="/suggest-location">
                <MapPin className="mr-2 h-4 w-4" />
                Sugerir Nova Localidade
              </Link>
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          </div>
        ) : filteredLocations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location) => (
              <LocationCard key={location.id} location={location} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-500 mb-4">Nenhuma localidade encontrada com este termo</p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Limpar busca
              </Button>
            )}
          </div>
        )}
        
        {!user && (
          <div className="mt-12 p-6 bg-gradient-to-r from-fishing-blue/10 to-fishing-green/10 rounded-lg border border-fishing-blue/20 text-center">
            <h3 className="text-xl font-semibold mb-4">Conhece um bom lugar para pescar?</h3>
            <p className="mb-4 text-gray-600">Faça login para sugerir novas localidades e compartilhar com nossa comunidade.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild>
                <Link to="/login">Fazer Login</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/register">Criar Conta</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationsPage;
