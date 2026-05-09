import './globals.css';
import { Lato, Playfair_Display } from 'next/font/google';

import { Toaster } from '@/components/ui/toaster';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-lato',
  display: 'swap',
});

export const metadata = {
  title: 'R & V - Momentos do Casamento',
  description: 'Compartilhe os momentos especiais do nosso casamento. Usque Ad Caelum.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${lato.variable}`}>
      <body className="font-lato antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
