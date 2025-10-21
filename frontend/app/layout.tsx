// Root layout
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TON Escrow MVP',
  description: 'Xavfsiz escrow xizmati TON blockchain asosida',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
