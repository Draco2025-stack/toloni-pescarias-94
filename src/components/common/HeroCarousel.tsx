
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  alt?: string;
}

// Sistema limpo - conteúdo será gerenciado pelo administrador
const mockMediaItems: MediaItem[] = [];

const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [mediaItems] = useState<MediaItem[]>(mockMediaItems);

  useEffect(() => {
    if (!isPlaying || mediaItems.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === mediaItems.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying, mediaItems.length]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (mediaItems.length === 0) {
    return (
      <Card className="w-full max-w-2xl h-96 flex flex-col items-center justify-center bg-gradient-to-br from-blue-900/20 to-blue-600/20 text-foreground rounded-2xl shadow-lg border border-blue-200/20">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center">
            <Play className="h-8 w-8 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-700">Carrossel Principal</h3>
            <p className="text-muted-foreground mt-2">Aguardando conteúdo do administrador</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl relative">
      <Card className="overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-blue-600 rounded-2xl shadow-2xl p-4">
        <div className="relative h-96 rounded-xl overflow-hidden">
          <Carousel className="w-full h-full">
            <CarouselContent className="h-full">
              {mediaItems.map((item, index) => (
                <CarouselItem 
                  key={item.id} 
                  className={`h-full transition-opacity duration-1000 ${
                    index === currentIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ 
                    position: index === currentIndex ? 'relative' : 'absolute',
                    top: index === currentIndex ? 'auto' : 0,
                    left: index === currentIndex ? 'auto' : 0,
                    width: '100%'
                  }}
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.alt}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <video
                      src={item.url}
                      className="w-full h-full object-cover rounded-lg"
                      autoPlay
                      muted
                      loop
                    />
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Navigation arrows */}
            <CarouselPrevious 
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30" 
              onClick={() => setCurrentIndex(currentIndex === 0 ? mediaItems.length - 1 : currentIndex - 1)}
            />
            <CarouselNext 
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30"
              onClick={() => setCurrentIndex(currentIndex === mediaItems.length - 1 ? 0 : currentIndex + 1)}
            />
          </Carousel>

          {/* Play/Pause button */}
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30"
            onClick={togglePlayPause}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          {/* Dots indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {mediaItems.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HeroCarousel;
