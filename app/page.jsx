import { PublicGallery } from '@/components/public/public-gallery';
import { PublicHero } from '@/components/public/public-hero';
import { MusicPlayer } from '@/components/public/music-player';
import { UploadForm } from '@/components/public/upload-form';

export default function HomePage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #faf8f5 0%, #fdf2f4 50%, #faf8f5 100%)' }}
    >
      <PublicHero />
      <MusicPlayer />

      <main className="mx-auto flex max-w-[92rem] flex-col gap-16 px-4 pb-16 pt-4 sm:gap-24 sm:pb-20 sm:pt-8">
        <section className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <PublicGallery />
        </section>

        <UploadForm />
      </main>
    </div>
  );
}
