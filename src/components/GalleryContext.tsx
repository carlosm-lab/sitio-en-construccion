'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface GalleryContextValue {
  isCheckoutOpen: boolean;
  selectedArtworkTitle: string | null;
  openCheckout: (artworkTitle?: string) => void;
  closeCheckout: () => void;
  isLoginOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  isVipActive: boolean;
  vipLicenseCode: string | null;
  refreshVipSession: () => Promise<void>;
}

const GalleryContext = createContext<GalleryContextValue | null>(null);

export function GalleryProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedArtworkTitle, setSelectedArtworkTitle] = useState<string | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isVipActive, setIsVipActive] = useState(false);
  const [vipLicenseCode, setVipLicenseCode] = useState<string | null>(null);

  const refreshVipSession = useCallback(async () => {
    try {
      const res = await fetch('/api/vip/verify?summary=1', { cache: 'no-store' });
      if (!res.ok) {
        setIsVipActive(false);
        setVipLicenseCode(null);
        return;
      }
      const data = await res.json();
      if (data?.authenticated && data?.customer?.license_code) {
        setIsVipActive(true);
        setVipLicenseCode(String(data.customer.license_code));
      } else {
        setIsVipActive(false);
        setVipLicenseCode(null);
      }
    } catch {
      setIsVipActive(false);
      setVipLicenseCode(null);
    }
  }, []);

  useEffect(() => {
    refreshVipSession();
  }, [refreshVipSession]);

  const openCheckout = (artworkTitle?: string) => {
    if (isVipActive) {
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
    if (isVipActive) {
      router.push('/vip');
      return;
    }
    setIsCheckoutOpen(false);
    setIsLoginOpen(true);
  };

  const closeLogin = () => {
    setIsLoginOpen(false);
  };

  return (
    <GalleryContext.Provider
      value={{
        isCheckoutOpen,
        selectedArtworkTitle,
        openCheckout,
        closeCheckout,
        isLoginOpen,
        openLogin,
        closeLogin,
        isVipActive,
        vipLicenseCode,
        refreshVipSession,
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
