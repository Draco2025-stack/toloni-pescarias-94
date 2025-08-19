
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  title: string;
  alt?: string;
}

// Função para buscar os dados do localStorage (simulando o painel administrativo)
const getAdminCarouselData = (): MediaItem[] => {
  try {
    const storedData = localStorage.getItem('adminMediaCarousel');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      return parsedData.map((item: any) => ({
        id: item.id,
        url: item.url,
        type: item.type,
        title: item.alt || 'Experiência de Pesca',
        alt: item.alt
      }));
    }
  } catch (error) {
    console.error('Erro ao carregar dados do carrossel:', error);
  }
  
  // Sistema limpo - sem dados de demonstração
  return [];
};

const ExperienceCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [experiences, setExperiences] = useState<MediaItem[]>([]);

  useEffect(() => {
    const loadExperiences = () => {
      const data = getAdminCarouselData();
      setExperiences(data);
    };

    loadExperiences();

    // Escutar mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'adminMediaCarousel') {
        loadExperiences();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Também escutar mudanças customizadas
    const handleCustomStorageChange = () => {
      loadExperiences();
    };
    
    window.addEventListener('adminMediaCarouselUpdate', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('adminMediaCarouselUpdate', handleCustomStorageChange);
    };
  }, []);

  useEffect(() => {
    if (experiences.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === experiences.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [experiences.length]);

  const goToNext = () => {
    setCurrentIndex(currentIndex === experiences.length - 1 ? 0 : currentIndex + 1);
  };

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? experiences.length - 1 : currentIndex - 1);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (experiences.length === 0) {
    return (
      <div className="relative w-full h-64 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50 rounded-lg flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-700">Carrossel de Experiências</h3>
            <p className="text-xs text-muted-foreground">Conteúdo será gerenciado pelo administrador</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="relative h-64 md:h-80 overflow-hidden rounded-lg shadow-lg">
        {experiences.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
              index === currentIndex ? 'translate-x-0' : 
              index < currentIndex ? '-translate-x-full' : 'translate-x-full'
            }`}
          >
            {item.type === 'image' ? (
              <img
                src={item.url}
                alt={item.alt || item.title}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <video
                src={item.url}
                className="w-full h-full object-cover"
                controls={false}
                autoPlay
                muted
                loop
              />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-end">
              <div className="p-4 text-white">
                <h3 className="text-lg font-semibold">{item.title}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
        onClick={goToPrevious}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
        onClick={goToNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Indicators */}
      <div className="flex justify-center mt-4 space-x-2">
        {experiences.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentIndex ? 'bg-fishing-blue' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ExperienceCarousel;
