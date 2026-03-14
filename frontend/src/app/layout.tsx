import type { Metadata } from 'next';
import './globals.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

export const metadata: Metadata = {
  title: 'BaapCollab',
  description: 'Cross-Branch Community Platform for The Baap Company',
  icons: {
    icon: '/baap-logo.jpg',
  },
  referrer: 'no-referrer',
};

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "735745260532-2c2nmc7s92j25o0fl0p5a1itoauv30u0.apps.googleusercontent.com";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans text-gray-900 bg-[#F8FAFC]">
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
