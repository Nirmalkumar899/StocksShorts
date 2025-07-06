import { useState } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoImage from "@assets/stocksshorts-logo-new.jpeg";

interface ImageLightboxProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageLightbox({ src, alt, isOpen, onClose }: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 0.5));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* StocksShorts Branding */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
        <img 
          src={logoImage} 
          alt="StocksShorts" 
          className="h-8 w-auto object-contain rounded"
        />
        <span className="text-white font-bold text-lg bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
          StocksShorts
        </span>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          className="bg-black/50 border-white/20 text-white hover:bg-black/70"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          onClick={resetZoom}
          className="bg-black/50 border-white/20 text-white hover:bg-black/70"
        >
          {Math.round(zoom * 100)}%
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleZoomIn}
          disabled={zoom >= 3}
          className="bg-black/50 border-white/20 text-white hover:bg-black/70"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          onClick={onClose}
          className="bg-black/50 border-white/20 text-white hover:bg-black/70"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Image */}
      <div className="max-w-full max-h-full overflow-auto">
        <img
          src={src}
          alt={alt}
          className="max-w-none transition-transform duration-200 ease-in-out cursor-grab active:cursor-grabbing"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: 'center'
          }}
          onClick={resetZoom}
          draggable={false}
        />
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/70 text-sm text-center">
        Click image to reset zoom • Click outside to close
      </div>
    </div>
  );
}