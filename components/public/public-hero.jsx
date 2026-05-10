import Image from 'next/image';
import Link from 'next/link';
import { Lock } from 'lucide-react';

import { MediaCarousel } from '@/components/public/media-carousel';
import { Button } from '@/components/ui/button';

export function PublicHero() {
  return (
    <header className="relative overflow-hidden text-center">
      <MediaCarousel />

      <Button
        asChild
        variant="outline"
        className="absolute right-4 top-4 z-20 h-auto border-white/35 bg-white/18 px-3 py-2 text-[11px] font-medium text-white backdrop-blur-md hover:border-white/50 hover:bg-white/24 hover:text-white sm:right-6 sm:top-6 sm:text-xs"
      >
        <Link href="/admin/login" className="flex items-center gap-1.5">
          <Lock size={12} />
          Painel Admin
        </Link>
      </Button>

      <div className="relative z-10 mx-auto flex min-h-[31rem] max-w-5xl items-center justify-center px-6 pb-12 pt-20 sm:min-h-[37rem] sm:px-10 sm:pb-16 sm:pt-24">
        <div className="text-white">
          <div className="mb-4 flex justify-center animate-float sm:mb-5">
            <Image
              src="/brasao 2x bg.png"
              alt="R & V"
              width={120}
              height={140}
              className="h-auto w-[92px] object-contain drop-shadow-[0_12px_35px_rgba(0,0,0,0.35)] sm:w-[120px]"
              priority
            />
          </div>

          <h1 className="mb-2 font-playfair text-3xl font-bold leading-tight text-white animate-slide-up sm:text-4xl md:text-6xl">
            Raiane &amp; Victor
          </h1>

          <div className="mb-4 flex flex-col items-center gap-1 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <p className="font-lato text-[11px] uppercase tracking-[0.18em] text-white/90 sm:text-sm sm:tracking-[0.2em]">
              13 de Maio de 2026
            </p>
          </div>

          <div className="ornament-divider mx-auto mb-4 max-w-[15rem] animate-slide-up text-white/80 sm:mb-5 sm:max-w-xs" style={{ animationDelay: '200ms' }}>
            <span className="text-xl text-white/80">*</span>
          </div>

          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <p className="mx-auto max-w-md text-balance font-lato text-sm leading-relaxed text-white/90 sm:max-w-2xl">
              Que Deus abencoe este casamento. Compartilhe os momentos sagrados desta uniao.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
