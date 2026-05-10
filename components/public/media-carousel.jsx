'use client';

import { useEffect, useMemo, useState } from 'react';

const PUBLIC_MEDIA_REFRESH_MS = 20 * 60 * 1000;
const DEFAULT_WALLPAPER_IMAGE = '/default-image.jpeg';

function WallpaperTile({ item, aspectRatio, onLoad, priority = false }) {
  return (
    <div
      className="relative h-full shrink-0 overflow-hidden bg-black/10"
      style={{ aspectRatio: aspectRatio || '3 / 4' }}
    >
      <img
        src={item.signedUrl}
        alt={item.fileName}
        className="block h-full w-auto max-w-none object-contain"
        loading={priority ? 'eager' : 'lazy'}
        onLoad={onLoad}
      />
    </div>
  );
}

export function MediaCarousel() {
  const [items, setItems] = useState([]);
  const [aspectMap, setAspectMap] = useState({});
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadItems() {
      try {
        const response = await fetch('/api/media', { cache: 'no-store' });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || 'Falha ao carregar wallpaper.');
        }

        if (active) {
          setItems(Array.isArray(data.items) ? data.items.filter((item) => item.fileType === 'image') : []);
          setHasError(false);
        }
      } catch {
        if (active) {
          setItems([]);
          setHasError(true);
        }
      }
    }

    loadItems();
    const refreshId = window.setInterval(loadItems, PUBLIC_MEDIA_REFRESH_MS);
    return () => {
      active = false;
      window.clearInterval(refreshId);
    };
  }, []);

  const wallpaperItems = useMemo(() => {
    if (items.length === 0) {
      return [];
    }

    return [...items, ...items];
  }, [items]);

  const handleImageLoad = (itemId, event) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (!naturalWidth || !naturalHeight) {
      return;
    }

    const nextAspect = `${naturalWidth} / ${naturalHeight}`;

    setAspectMap((current) => (
      current[itemId] === nextAspect
        ? current
        : { ...current, [itemId]: nextAspect }
    ));
  };

  if (wallpaperItems.length === 0) {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#120c0d]">
        <img
          src={DEFAULT_WALLPAPER_IMAGE}
          alt="Imagem padrao do wallpaper"
          className="h-full w-full scale-[1.04] object-cover blur-[3.5px]"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#120c0d]">
      <div className="hero-wallpaper-track scale-[1.04] blur-[3.5px]">
        {wallpaperItems.map((item, index) => (
          <WallpaperTile
            key={`${item.id}-${index}`}
            item={item}
            aspectRatio={aspectMap[item.id]}
            onLoad={(event) => handleImageLoad(item.id, event)}
            priority={index < 6}
          />
        ))}
      </div>

      <div className={`absolute inset-0 ${hasError ? 'bg-black/30' : 'bg-black/20'}`} />
    </div>
  );
}
