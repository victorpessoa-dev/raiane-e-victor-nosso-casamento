import { MediaCarousel } from '@/components/public/media-carousel';
import { PublicHero } from '@/components/public/public-hero';
import { UploadForm } from '@/components/public/upload-form';

export default function HomePage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #faf8f5 0%, #fdf2f4 50%, #faf8f5 100%)' }}
    >
      <PublicHero />

      <main className="mx-auto flex max-w-4xl flex-col gap-12 px-4 pb-14 sm:gap-16 sm:pb-16">
        <section className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <h2 className="mb-6 flex items-center justify-center gap-2 text-center font-playfair text-2xl text-burgundy-800 sm:mb-8 md:text-3xl">
            <span className="text-burgundy-400">*</span>
            Momentos do Casamento
            <span className="text-burgundy-400">*</span>
          </h2>
          <MediaCarousel />
        </section>

        <UploadForm />
      </main>

      <footer className="space-y-2 px-4 py-8 text-center sm:py-10">
        <p className="font-playfair text-lg text-burgundy-700">R &amp; V</p>
        <p className="font-lato text-sm text-burgundy-600">Usque Ad Caelum</p>
        <p className="pt-2 font-lato text-xs text-muted-foreground">
          &quot;O Senhor ha de te abencoar e ha de te guardar&quot; - Numeros 6:24
        </p>
      </footer>
    </div>
  );
}
