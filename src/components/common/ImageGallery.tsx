
import { useState, useEffect } from "react";

const ImageGallery = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images: string[] = [];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="relative w-80 h-96 bg-gradient-to-b from-blue-900/20 to-blue-500/20 border border-blue-200/20 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-700">Galeria Vazia</h3>
            <p className="text-xs text-muted-foreground mt-1">Nenhuma imagem disponível</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-80 h-96 bg-gradient-to-b from-slate-800 to-blue-500 rounded-2xl overflow-hidden shadow-2xl">
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={image}
            alt={`Galeria de imagens ${index + 1}`}
            className="w-full h-full object-cover rounded-2xl"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      ))}
      
      {/* Overlay gradient for better visual effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl pointer-events-none" />
    </div>
  );
};

export default ImageGallery;
