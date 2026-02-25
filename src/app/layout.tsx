import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Toko Mbak Atria — Manajemen Toko Pintar',
  description: 'Aplikasi manajemen toko all-in-one dengan Kasir (POS), Inventaris, dan Laporan Keuangan.',
  keywords: 'toko, kasir, pos, inventaris, keuangan, manajemen stok',
  authors: [{ name: 'Toko Mbak Atria' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#059669',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="app-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
