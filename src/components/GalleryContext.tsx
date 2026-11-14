'use client';

import React, { createContext, useContext, useState } from 'react';

interface GalleryContextValue {
  isCheckoutOpen: boolean;
  selectedArtworkTitle: string | null;
  openCheckout: (artworkTitle?: string) => void;
  closeCheckout: () => void;
  isLoginOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
}

const GalleryContext = createContext<GalleryContextValue | null>(null);

export function GalleryProvider({ children }: { children: React.ReactNode }) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedArtworkTitle, setSelectedArtworkTitle] = useState<string | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const openCheckout = (artworkTitle?: string) => {
    setSelectedArtworkTitle(artworkTitle || null);
    setIsLoginOpen(false);
    setIsCheckoutOpen(true);
  };

  const closeCheckout = () => {
    setIsCheckoutOpen(false);
    setSelectedArtworkTitle(null);
  };

  const openLogin = () => {
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
