'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Expand, Loader as Loader2, Video, X } from 'lucide-react';

import { formatDateTime } from '@/lib/format';

const PUBLIC_MEDIA_REFRESH_MS = 20 * 60 * 1000;

function VideoThumbnail({ src }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return undefined;
    }

    const handleLoadedMetadata = () => {
      try {
        video.currentTime = Math.min(0.1, Math.max(video.duration / 10, 0.1));
      } catch {
        // Best effort only for video poster extraction.
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      muted
      playsInline
      preload="metadata"
    />
  );
}

function PublicLightbox({ item, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!item) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [item, onClose]);

  if (!item) {
    return null;
  }

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex min-h-screen w-screen items-center justify-center bg-black/45 p-4 sm:p-6" onClick={onClose}>
      <div
        className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-[1.75rem] border border-white/18 bg-black/45 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-30 rounded-full border border-white/45 bg-black/72 p-3 text-white shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-all hover:scale-105 hover:bg-black/90"
          aria-label="Fechar midia"
        >
          <X size={26} strokeWidth={2.7} />
        </button>

        <div className="relative flex max-h-[78vh] min-h-[18rem] w-full items-center justify-center overflow-hidden bg-black/35 sm:max-h-[82vh]">
        {item.fileType === 'video' ? (
          <video
            src={item.signedUrl}
            controls
            playsInline
            className="max-h-[78vh] w-full object-contain sm:max-h-[82vh]"
          />
        ) : (
          <img
            src={item.signedUrl}
            alt={item.fileName}
            className="max-h-[78vh] w-full object-contain sm:max-h-[82vh]"
          />
        )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/82 via-black/36 to-transparent px-6 pb-6 pt-16 text-center text-white sm:px-10 sm:pb-8">
          {item.uploaderName ? (
            <p className="font-playfair text-xl">{item.uploaderName}</p>
          ) : null}
          {item.message ? (
            <p className="mt-2 font-lato text-sm italic text-white/75">&quot;{item.message}&quot;</p>
          ) : null}
          <p className="mt-2 font-lato text-xs text-white/50">{formatDateTime(item.createdAt)}</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function PublicGallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pageSize, setPageSize] = useState(8);
  const [visibleCount, setVisibleCount] = useState(8);
  const [error, setError] = useState('');

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const nextPageSize = desktop.matches ? 10 : 8;
    setPageSize(nextPageSize);
    setVisibleCount(nextPageSize);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadItems() {
      try {
        const response = await fetch('/api/media', { cache: 'no-store' });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || 'Falha ao carregar a galeria.');
        }

        if (active) {
          setItems(Array.isArray(data.items) ? data.items : []);
          setError('');
        }
      } catch (loadError) {
        if (active) {
          setItems([]);
          setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar a galeria.');
        }
      } finally {
        if (active) {
          setLoading(false);
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

  const galleryItems = useMemo(() => {
    const photos = items.filter((item) => item.fileType === 'image');
    const videos = items.filter((item) => item.fileType === 'video');
    return [...photos, ...videos];
  }, [items]);
  const visibleItems = useMemo(
    () => galleryItems.slice(0, visibleCount),
    [galleryItems, visibleCount],
  );
  const hasMoreItems = visibleCount < galleryItems.length;

  return (
    <section className="space-y-7 sm:space-y-9">
      <div className="text-center px-2">
        <h2 className="font-playfair text-2xl text-burgundy-800 sm:text-3xl">Fotos e Videos</h2>
      </div>

      {loading ? (
        <div className="flex min-h-[18rem] items-center justify-center rounded-[2rem] bg-white/70 shadow-lg">
          <Loader2 className="animate-spin text-burgundy-400" size={34} strokeWidth={1.5} />
        </div>
      ) : error ? (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-8 text-center shadow-sm">
          <p className="font-playfair text-xl text-red-700">Nao foi possivel carregar a galeria</p>
          <p className="mt-2 font-lato text-sm text-red-600">{error}</p>
        </div>
      ) : galleryItems.length === 0 ? (
        <div className="rounded-[2rem] border border-burgundy-100 bg-white/80 px-6 py-12 text-center shadow-lg">
          <p className="font-playfair text-xl text-burgundy-700">A galeria ainda esta vazia</p>
          <p className="mt-2 font-lato text-sm text-muted-foreground">
            As fotos e videos visiveis vao aparecer aqui automaticamente.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItem(item)}
                className="group relative overflow-hidden rounded-[1.35rem] bg-white/70 text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="aspect-[4/5] overflow-hidden bg-zinc-950">
                  {item.fileType === 'video' ? (
                    <div className="relative h-full w-full">
                      <VideoThumbnail src={item.signedUrl} />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="rounded-full bg-white/20 p-3 text-white backdrop-blur-sm">
                          <Video size={22} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.signedUrl}
                      alt={item.fileName}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-90" />
                <div className="absolute right-3 top-3 rounded-full bg-white/20 p-2 text-white opacity-0 backdrop-blur transition-all group-hover:opacity-100">
                  <Expand size={15} />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                  {item.uploaderName ? (
                    <p className="truncate font-lato text-xs font-semibold">{item.uploaderName}</p>
                  ) : null}
                  <p className="mt-1 truncate font-lato text-[11px] text-white/75">{formatDateTime(item.createdAt)}</p>
                </div>
              </button>
            ))}
          </div>
          {hasMoreItems ? (
            <div className="flex flex-col items-center justify-center gap-2 pt-2">
              <p className="font-lato text-xs text-burgundy-500">
                Mostrando {visibleItems.length} de {galleryItems.length} fotos e videos.
              </p>
              <button
                type="button"
                onClick={() => setVisibleCount((current) => current + pageSize)}
                className="rounded-full border border-burgundy-200 bg-white/80 px-5 py-2.5 font-lato text-sm font-semibold text-burgundy-700 shadow-sm transition-all hover:border-burgundy-300 hover:bg-white hover:shadow-md"
              >
                Carregar mais itens
              </button>
            </div>
          ) : null}
        </>
      )}

      <PublicLightbox item={selectedItem} onClose={() => setSelectedItem(null)} />
    </section>
  );
}
