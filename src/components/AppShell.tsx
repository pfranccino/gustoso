'use client';

import { useState, useEffect } from 'react';
import { CartProvider } from '@/contexts/CartContext';
import { SettingsProvider, PublicSettings } from '@/contexts/SettingsContext';
import { MenuItem } from '@/lib/firestore/menuItems';
import { BurritoConfig } from '@/lib/firestore/burritoConfig';
import { Promotion } from '@/lib/firestore/promotions';
import { Aderezo } from '@/lib/firestore/aderezosTypes';
import { GalleryItem } from '@/lib/firestore/gallery';
import { Review } from '@/lib/firestore/reviews';
import Nav from './Nav';
import Hero from './Hero';
import MenuSection from './MenuSection';
import Gallery from './Gallery';
import About from './About';
import Reviews from './Reviews';
import TipSection from './TipSection';
import Contact from './Contact';
import Footer from './Footer';
import FloatingWA from './FloatingWA';
import CartBar from './CartBar';
import CartDrawer from './CartDrawer';

export default function AppShell({ settings, menuItems, burritoConfig, promotions, aderezos, disabledIngredients = [], galleryItems = [], reviewItems = [], mostrador = false }: { settings: PublicSettings; menuItems: MenuItem[]; burritoConfig: BurritoConfig; promotions: Promotion[]; aderezos: Aderezo[]; disabledIngredients?: string[]; galleryItems?: GalleryItem[]; reviewItems?: Review[]; mostrador?: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <SettingsProvider value={settings}>
    <CartProvider>
      <div className="pub-outer" style={{ maxWidth:'var(--max)', margin:'0 auto', position:'relative' }}>
        <Nav scrolled={scrolled}/>
        <Hero/>
        <div className="section-divider"></div>
        <MenuSection items={menuItems} burritoConfig={burritoConfig} promotions={promotions} aderezos={aderezos} disabledIngredients={disabledIngredients}/>
        <div className="section-divider"></div>
        <Gallery items={galleryItems}/>
        <div className="section-divider"></div>
        <About/>
        <div className="section-divider"></div>
        <Reviews items={reviewItems}/>
        <div className="section-divider"></div>
        <TipSection/>
        <div className="section-divider"></div>
        <Contact/>
        <Footer/>
        <FloatingWA/>
        <CartBar/>
        <CartDrawer mostrador={mostrador}/>
      </div>
    </CartProvider>
    </SettingsProvider>
  );
}
