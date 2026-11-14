import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-ink/15 bg-surface">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
      <p className="mt-4 text-sm font-medium text-ink/75">
        Cargando recursos desde Supabase...
      </p>
    </div>
  );
}
