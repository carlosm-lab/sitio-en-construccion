'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export interface GoogleUserClient {
  email: string;
  name: string | null;
}

export interface InitialServerAuth {
  hasFullAccess: boolean;
  isAdmin: boolean;
  licenseCode: string | null;
  userEmail: string | null;
  googleUser: GoogleUserClient | null;
}

interface GalleryContextValue {
  isCheckoutOpen: boolean;
  selectedArtworkTitle: string | null;
  openCheckout: (artworkTitle?: string) => void;
  closeCheckout: () => void;
  isLoginOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  isVipActive: boolean;
  isAdmin: boolean;
  hasFullAccess: boolean;
  vipLicenseCode: string | null;
  userEmail: string | null;
  googleUser: GoogleUserClient | null;
  authLoading: boolean;
  refreshVipSession: () => Promise<void>;
  signInWithGoogle: (nextPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const GalleryContext = createContext<GalleryContextValue | null>(null);

export function GalleryProvider({
  children,
  initialAuth,
}: {
  children: React.ReactNode;
  initialAuth?: InitialServerAuth;
}) {
  const router = useRouter();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedArtworkTitle, setSelectedArtworkTitle] = useState<string | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isVipActive, setIsVipActive] = useState(Boolean(initialAuth?.hasFullAccess));
  const [isAdmin, setIsAdmin] = useState(Boolean(initialAuth?.isAdmin));
  const [vipLicenseCode, setVipLicenseCode] = useState<string | null>(
    initialAuth?.licenseCode ?? null
  );
  const [userEmail, setUserEmail] = useState<string | null>(
    initialAuth?.userEmail ?? initialAuth?.googleUser?.email ?? null
  );
  const [googleUser, setGoogleUser] = useState<GoogleUserClient | null>(
    initialAuth?.googleUser ?? null
  );
  const [authLoading, setAuthLoading] = useState(!initialAuth);

  const hasFullAccess = isVipActive || isAdmin;

  useEffect(() => {
    if (!initialAuth) return;
    setIsVipActive(Boolean(initialAuth.hasFullAccess));
    setIsAdmin(Boolean(initialAuth.isAdmin));
    setVipLicenseCode(initialAuth.licenseCode ?? null);
    setUserEmail(initialAuth.userEmail ?? initialAuth.googleUser?.email ?? null);
    setGoogleUser(initialAuth.googleUser ?? null);
    if (initialAuth.hasFullAccess || initialAuth.isAdmin) {
      setIsCheckoutOpen(false);
      setIsLoginOpen(false);
    }
  }, [initialAuth]);

  const refreshVipSession = useCallback(async () => {
    try {
      const res = await fetch('/api/vip/verify?summary=1', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));

      if (data?.googleUser?.email) {
        setGoogleUser({
          email: String(data.googleUser.email),
          name: data.googleUser.name ? String(data.googleUser.name) : null,
        });
      } else {
        setGoogleUser(null);
      }

      if (data?.authenticated && data?.customer) {
        setIsVipActive(true);
        setIsAdmin(Boolean(data.isAdmin));
        setVipLicenseCode(String(data.customer.license_code || 'VIP'));
        setUserEmail(String(data.customer.email));
        setIsCheckoutOpen(false);
        setIsLoginOpen(false);
      } else {
        setIsVipActive(false);
        setIsAdmin(false);
        setVipLicenseCode(null);
        setUserEmail(
          data?.googleUser?.email ? String(data.googleUser.email) : null
        );
      }
    } catch {
      setIsVipActive(false);
      setIsAdmin(false);
      setVipLicenseCode(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshVipSession().then(() => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('checkout') === '1') {
          setIsCheckoutOpen(true);
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
        }
      }
    });
  }, [refreshVipSession]);

  const signInWithGoogle = useCallback(async (nextPath?: string) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const targetNext =
        nextPath ||
        (typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : '/');
      if (typeof document !== 'undefined') {
        document.cookie = `artedigital_oauth_next=${encodeURIComponent(
          targetNext
        )}; path=/; max-age=600; SameSite=Lax`;
      }
      const redirectTo = `${window.location.origin}/auth/callback`;
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
    } catch (err) {
      console.error('Error iniciando sesión con Google:', err);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/vip/logout', { method: 'POST' });
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut().catch(() => {});
    } finally {
      setIsVipActive(false);
      setIsAdmin(false);
      setVipLicenseCode(null);
      setUserEmail(null);
      setGoogleUser(null);
      router.refresh();
    }
  }, [router]);

  const openCheckout = (artworkTitle?: string) => {
    if (hasFullAccess) {
      router.push('/vip');
      return;
    }
    setSelectedArtworkTitle(artworkTitle || null);
    setIsLoginOpen(false);
    setIsCheckoutOpen(true);
  };

  const closeCheckout = () => {
    setIsCheckoutOpen(false);
    setSelectedArtworkTitle(null);
  };

  const openLogin = () => {
    if (hasFullAccess) {
      router.push('/vip');
      return;
    }
    signInWithGoogle();
  };

  const closeLogin = () => {
    setIsLoginOpen(false);
  };

  return (
    <GalleryContext.Provider
      value={{
        isCheckoutOpen: !hasFullAccess && isCheckoutOpen,
        selectedArtworkTitle,
        openCheckout,
        closeCheckout,
        isLoginOpen: !hasFullAccess && isLoginOpen,
        openLogin,
        closeLogin,
        isVipActive,
        isAdmin,
        hasFullAccess,
        vipLicenseCode,
        userEmail,
        googleUser,
        authLoading,
        refreshVipSession,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </GalleryContext.Provider>
  );
}

export function useGalleryModal() {
  const ctx = useContext(GalleryContext);
  if (!ctx) {
    throw new Error('useGalleryModal debe usarse dentro de GalleryProvider');
  }
  return ctx;
}
