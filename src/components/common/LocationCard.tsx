
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, MessageCircle } from "lucide-react";
import { Location } from "@/services/mockData";

interface LocationCardProps {
  location: Location;
}

const LocationCard = ({ location }: LocationCardProps) => {
  const openWhatsApp = (whatsapp: string) => {
    const message = encodeURIComponent("Olá! Estou interessado nas pescarias da Toloni Pescarias e gostaria de mais informações.");
    const url = `https://wa.me/5511972225982?text=${message}`;
    window.open(url, "_blank");
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow">
      {location.image ? (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={location.image}
            alt={location.name}
            className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) parent.style.display = 'none';
            }}
          />
          {location.featured && (
            <div className="absolute top-3 right-3 bg-fishing-blue text-white text-xs font-bold px-2 py-1 rounded">
              DESTAQUE
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-12 w-full overflow-hidden flex items-center justify-center bg-gradient-to-r from-fishing-blue/10 to-fishing-green/10">
          {location.featured && (
            <div className="absolute top-3 right-3 bg-fishing-blue text-white text-xs font-bold px-2 py-1 rounded">
              DESTAQUE
            </div>
          )}
        </div>
      )}
      <CardContent className="pt-6 flex-grow">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4 text-fishing-blue" />
          <h3 className="text-lg font-semibold line-clamp-1">{location.name}</h3>
        </div>
        <p className="text-sm text-gray-600 line-clamp-3">{location.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between pt-2 pb-4">
        <Button
          variant="outline"
          onClick={() => openWhatsApp(location.whatsapp)}
          className="text-fishing-green hover:text-white hover:bg-fishing-green"
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          Contato
        </Button>
        <Button asChild>
          <Link to={`/location/${location.id}`}>Ver detalhes</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LocationCard;
