import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function PublicHero() {
  return (
    <header className="relative overflow-hidden px-4 pb-6 pt-5 text-center sm:pb-8 sm:pt-8">
      <Button
        asChild
        variant="outline"
        className="absolute right-4 top-4 border-burgundy-300 bg-white/80 px-3 py-1.5 text-xs text-burgundy-700 backdrop-blur-sm hover:border-burgundy-400 hover:bg-burgundy-50 hover:text-burgundy-800 sm:right-6 sm:top-6"
      >
        <Link href="/admin">Admin</Link>
      </Button>

      <div className="mb-4 flex justify-center animate-float sm:mb-5">
        <Image
          src="/brasao 2x bg.png"
          alt="R & V"
          width={120}
          height={140}
          className="h-auto w-[92px] object-contain drop-shadow-lg sm:w-[120px]"
          priority
        />
      </div>

      <h1 className="mb-2 font-playfair text-3xl font-bold leading-tight text-burgundy-800 animate-slide-up sm:text-4xl md:text-5xl">
        Raiane &amp; Victor
      </h1>

      <div className="mb-4 flex flex-col items-center gap-1 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <p className="font-lato text-[11px] uppercase tracking-[0.18em] text-burgundy-600 sm:text-sm sm:tracking-[0.2em]">
          13 de Maio de 2026
        </p>
        <p className="max-w-[18rem] text-balance font-lato text-xs italic text-burgundy-500 sm:max-w-none">
          Dia da Festa de Nossa Senhora de Fatima
        </p>
      </div>

      <div className="ornament-divider mx-auto mb-4 max-w-[15rem] animate-slide-up sm:mb-5 sm:max-w-xs" style={{ animationDelay: '200ms' }}>
        <span className="text-xl text-burgundy-400">*</span>
      </div>

      <div className="space-y-2 animate-slide-up" style={{ animationDelay: '300ms' }}>
        <p className="mx-auto max-w-md text-balance font-lato text-sm leading-relaxed text-burgundy-600 sm:max-w-2xl">
          Que Deus abencoe este casamento. Compartilhe os momentos sagrados desta uniao.
        </p>
      </div>
    </header>
  );
}
