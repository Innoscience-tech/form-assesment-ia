import type { Metadata } from 'next';
import { Instrument_Serif, Manrope } from 'next/font/google';
import './globals.css';

const instrumentSerif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Assessment de Prontidão em IA · Octógono da IA | Innoscience',
  description:
    'Identifique os avanços e as principais lacunas da sua empresa nas oito dimensões do Octógono da IA e receba uma leitura executiva da sua prontidão.',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${instrumentSerif.variable} ${manrope.variable}`}
    >
      <body className="min-h-screen bg-[#F9FAFB] font-sans text-[#111111] antialiased selection:bg-[#FAB600]/30 selection:text-[#000000]">
        <div className="ambient-backdrop" aria-hidden="true" />
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
