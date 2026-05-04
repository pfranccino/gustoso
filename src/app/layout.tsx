import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Gustoso's — La Calidad Va en el Gusto",
  description: "Vienesas, sándwiches, burritos y más. Pide directo por WhatsApp — Gustoso's, Marino José Manuel Ramírez #1641.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
