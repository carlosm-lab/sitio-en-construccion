'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export function GoogleSignInButton({
  nextPath = '/vip',
  label = 'Continuar con Google',
  className = '',
}: {
  nextPath?: string;
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const supabase = createSupabaseBrowserClient();
      if (typeof document !== 'undefined') {
        document.cookie = `artedigital_oauth_next=${encodeURIComponent(
          nextPath
        )}; path=/; max-age=600; SameSite=Lax`;
      }
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'No se pudo iniciar sesión con Google.'
      );
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className={`inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-ink/25 bg-white px-5 py-3 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-surface disabled:opacity-60 ${className}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.3 0 6.08-1.09 8.11-2.96l-3.88-3.05c-1.08.72-2.45 1.16-4.23 1.16-3.25 0-6-2.2-6.98-5.15H1.01v3.14C3.05 21.2 7.24 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.02 14c-.25-.72-.39-1.5-.39-2.3 0-.8.14-1.58.39-2.3V6.26H1.01C.37 7.55 0 9.01 0 11.7s.37 4.15 1.01 5.44L5.02 14Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.79 0 3.4.62 4.67 1.83l3.5-3.5C18.07 1.19 15.3 0 12 0 7.24 0 3.05 2.8 1.01 6.86L5.02 10c.98-2.95 3.73-5.25 6.98-5.25Z"
            />
          </svg>
        )}
        <span>{loading ? 'Redirigiendo a Google...' : label}</span>
      </button>
      {errorMsg && (
        <p className="mt-2 text-xs font-medium text-accent">{errorMsg}</p>
      )}
    </div>
  );
}
