'use client';

import { useEffect } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';

import { formatDateTime } from '@/lib/format';

export function MediaLightbox({ item, onClose }) {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={onClose}>
      <button
        type="button"
        className="absolute right-4 top-4 text-white/80 transition-colors hover:text-white"
        onClick={onClose}
      >
        <X size={28} />
      </button>
      <div className="w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
        {item.fileType === 'image' ? (
          <img src={item.signedUrl} alt={item.fileName} className="mx-auto max-h-[80vh] rounded-xl object-contain shadow-2xl" />
        ) : (
          <video src={item.signedUrl} controls className="mx-auto max-h-[80vh] w-full rounded-xl shadow-2xl" autoPlay />
        )}
        <div className="mt-4 text-center">
          {item.uploaderName ? <p className="font-playfair text-lg text-white">{item.uploaderName}</p> : null}
          {item.message ? (
            <p className="mt-1 font-lato text-sm italic text-white/70">&quot;{item.message}&quot;</p>
          ) : null}
          <p className="mt-2 font-lato text-xs text-white/40">{formatDateTime(item.createdAt)}</p>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-white/50">
            {item.isVisible ? (
              <>
                <Eye size={14} />
                <span>Visível no carrossel</span>
              </>
            ) : (
              <>
                <EyeOff size={14} />
                <span>Oculta</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
