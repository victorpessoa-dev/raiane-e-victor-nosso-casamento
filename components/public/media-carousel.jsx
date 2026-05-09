'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader as Loader2, Video } from 'lucide-react';

function rotate(index, length, step) {
  return (index + step + length) % length;
}

export function MediaCarousel() {
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fade, setFade] = useState(true);
  const autoplayRef = useRef(null);

  const totalItems = items.length;
  const currentItem = useMemo(() => items[currentIndex], [currentIndex, items]);

  useEffect(() => {
    let active = true;

    async function loadItems() {
      try {
        const response = await fetch('/api/media', { cache: 'no-store' });
        const data = await response.json();
        if (active) {
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadItems();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (totalItems <= 1) {
      return undefined;
    }

    clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex((value) => rotate(value, totalItems, 1));
        setFade(true);
      }, 300);
    }, 5000);

    return () => clearInterval(autoplayRef.current);
  }, [totalItems]);

  const jumpTo = (nextIndex) => {
    clearInterval(autoplayRef.current);
    setFade(false);
    setTimeout(() => {
      setCurrentIndex(nextIndex);
      setFade(true);
    }, 300);
  };

  if (loading) {
    return (
      <div className="relative flex h-72 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-white to-zinc-50 sm:h-80 md:h-[500px]">
        <div className="shimmer-loading absolute inset-0" />
        <Loader2 className="relative z-10 animate-spin text-burgundy-400" size={40} strokeWidth={1.5} />
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="group relative flex h-72 flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border-2 border-dashed border-burgundy-200 bg-white px-6 sm:h-80 md:h-[500px]">
        <div className="absolute inset-0 bg-gradient-to-br from-burgundy-50/0 to-burgundy-50/50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <Video className="relative z-10 text-burgundy-200 transition-colors group-hover:text-burgundy-300" size={48} strokeWidth={1} />
        <p className="relative z-10 font-playfair text-lg text-burgundy-700">Momentos em breve</p>
        <p className="relative z-10 max-w-xs text-center font-lato text-sm text-muted-foreground">
          Comece enviando suas fotos para ve-las aqui em tempo real.
        </p>
      </div>
    );
  }

  return (
    <div className="group relative h-72 overflow-hidden rounded-2xl shadow-2xl sm:h-80 md:h-[500px]">
      <div className={`absolute inset-0 transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}>
        <img
          src={currentItem.signedUrl}
          alt={currentItem.fileName}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-4 text-white sm:p-6">
        {currentItem.uploaderName ? (
          <p className="mb-1 font-lato text-xs opacity-90 sm:text-sm">
            Compartilhado por <span className="font-semibold">{currentItem.uploaderName}</span>
          </p>
        ) : null}
        {currentItem.message ? (
          <p className="line-clamp-2 max-w-[90%] font-lato text-xs italic opacity-80 sm:text-sm">
            &quot;{currentItem.message}&quot;
          </p>
        ) : null}
      </div>

      {totalItems > 1 ? (
        <>
          <button
            type="button"
            onClick={() => jumpTo(rotate(currentIndex, totalItems, -1))}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/30 p-2 text-white opacity-100 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/40 sm:left-4 sm:p-2.5 sm:opacity-0 sm:group-hover:opacity-100"
            aria-label="Anterior"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => jumpTo(rotate(currentIndex, totalItems, 1))}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/30 p-2 text-white opacity-100 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/40 sm:right-4 sm:p-2.5 sm:opacity-0 sm:group-hover:opacity-100"
            aria-label="Proxima"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </>
      ) : null}

      {totalItems > 1 ? (
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 sm:bottom-4">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => jumpTo(index)}
              className={`transition-all ${index === currentIndex
                ? 'h-2 w-8 rounded-full bg-white'
                : 'h-2 w-2 rounded-full bg-white/50 hover:bg-white/70'
                }`}
              aria-label={`Ir para foto ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
