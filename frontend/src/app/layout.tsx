import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BaapCollab',
  description: 'Cross-Branch Community Platform for The Baap Company',
  icons: {
    icon: '/baap-logo.jpg',
  },
  referrer: 'no-referrer',
};

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "735745260532-2c2nmc7s92j25o0fl0p5a1itoauv30u0.apps.googleusercontent.com";

import ConsoleSuppressor from '@/components/ConsoleSuppressor';
import RouteGuard from '@/components/auth/RouteGuard';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans text-gray-900 bg-[#F8FAFC]">
        <ConsoleSuppressor />
        <RouteGuard>
          {children}
        </RouteGuard>
      </body>
    </html>
  );
}
