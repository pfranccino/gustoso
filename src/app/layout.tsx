import type { Metadata } from 'next';
import './globals.css';
import RestaurantJsonLd from '@/components/RestaurantJsonLd';

const SITE_URL  = 'https://gustoso-dun.vercel.app';
const SITE_NAME = "Gustoso's";
const TITLE     = "Gustoso's Los Andes — Vienesas, Sándwiches & Burritos";
const DESC      = "El mejor local de vienesas, sándwiches mechada, burritos y papas en Los Andes. Pide directo por WhatsApp con delivery o retiro. Abierto de lunes a domingo.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:  TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESC,
  keywords: [
    'gustosos los andes', 'comida los andes', 'vienesas los andes',
    'sándwiches los andes', 'mechada los andes', 'burrito los andes',
    'papas fritas los andes', 'delivery los andes', 'comida rápida los andes',
    'restaurant los andes chile', 'pedido whatsapp los andes',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type:        'website',
    locale:      'es_CL',
    url:         SITE_URL,
    siteName:    SITE_NAME,
    title:       TITLE,
    description: DESC,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: "Gustoso's — Comida en Los Andes" }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       TITLE,
    description: DESC,
    images:      ['/og-image.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <RestaurantJsonLd/>
        {children}
      </body>
    </html>
  );
}
