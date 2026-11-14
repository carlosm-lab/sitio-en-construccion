import React from 'react';
import type { Metadata } from 'next';
import dynamicImport from 'next/dynamic';
import { ShieldCheck } from 'lucide-react';
import { requireAdminUser } from '@/lib/admin-auth';
import {
  getAllArtworksAdmin,
  getManuals,
  listRecentCustomers,
  listSupportMessages,
} from '@/lib/data-store';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

const AdminDashboardClient = dynamicImport(
  () =>
    import('@/components/AdminDashboardClient').then(
      (mod) => mod.AdminDashboardClient
    ),
  { ssr: false }
);

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Gestión Editorial',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: { auth_error?: string };
}) {
  const auth = await requireAdminUser();

  if (!auth.ok) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="rounded-3xl border border-ink/20 bg-surface/75 p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-canvas px-3 py-1 text-xs font-semibold text-ink">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            Acceso Restringido
          </div>
          <h1 className="mt-4 font-serif text-3xl font-semibold text-ink">
            Gestión Editorial
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-ink/80">
            Área reservada exclusivamente para el personal autorizado de
            ArteDigital.click.
          </p>

          {(auth.status === 403 || searchParams?.auth_error) && (
            <div className="mt-4 rounded-xl border border-accent/50 bg-canvas p-3.5 text-xs text-ink">
              {auth.status === 403
                ? `La cuenta conectada (${auth.email || 'actual'}) no tiene permisos de administración. Selecciona una cuenta de Google autorizada.`
                : 'No se pudo completar el inicio de sesión. Intenta nuevamente con una cuenta autorizada.'}
            </div>
          )}

          <div className="mt-6">
            <GoogleSignInButton
              nextPath="/admin"
              label="Continuar con Cuenta Autorizada"
            />
          </div>
        </div>
      </div>
    );
  }

  const [customers, artworks, manuals, supportMessages] = await Promise.all([
    listRecentCustomers(),
    getAllArtworksAdmin(),
    getManuals(true),
    listSupportMessages(),
  ]);

  return (
    <AdminDashboardClient
      initialAdminEmail={auth.admin.email}
      initialCustomers={customers}
      initialArtworks={artworks}
      initialManuals={manuals}
      initialSupportMessages={supportMessages}
    />
  );
}
