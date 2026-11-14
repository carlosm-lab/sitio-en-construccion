import type { Metadata } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { SITE_URL } from '@/lib/constants';
import { resolveServerAccess } from '@/lib/vip-auth';
import { GalleryProvider } from '@/components/GalleryContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CheckoutModal } from '@/components/CheckoutModal';
import { MemberLoginModal } from '@/components/MemberLoginModal';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-cormorant',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ArteDigital.click | Galería de Arte IA en 4K, Prompts y Manuales',
    template: '%s | ArteDigital.click',
  },
  description:
    'Banco editorial de arte digital generado por IA en alta resolución 4K, ingeniería de prompts verificados y manuales técnicos de consistencia de personajes. Pase de Acceso Total por $25 USD.',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: SITE_URL,
    siteName: 'ArteDigital.click',
    title: 'ArteDigital.click | Galería de Arte IA en 4K y Prompts Profesionales',
    description:
      'Desbloquea obras digitales en alta resolución 4K sin marca de agua, prompts exactos y manuales de consistencia de personajes por un pago único de $25 USD.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const access = await resolveServerAccess();
  const initialAuth = {
    hasFullAccess: access.hasFullAccess,
    isAdmin: access.isAdmin,
    licenseCode: access.customer?.license_code ?? null,
    userEmail: access.customer?.email ?? access.googleUser?.email ?? null,
    googleUser: access.googleUser,
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ArteDigital.click',
    url: SITE_URL,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: `${SITE_URL}/contacto`,
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ArteDigital.click',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="es" className={`${jakarta.variable} ${cormorant.variable}`}>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <GalleryProvider initialAuth={initialAuth}>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <CheckoutModal />
          <MemberLoginModal />
        </GalleryProvider>
      </body>
    </html>
  );
}
