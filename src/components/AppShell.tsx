'use client';

import { useState, useEffect } from 'react';
import { CartProvider } from '@/contexts/CartContext';
import { SettingsProvider, PublicSettings } from '@/contexts/SettingsContext';
import { MenuItem } from '@/lib/firestore/menuItems';
import { BurritoConfig } from '@/lib/firestore/burritoConfig';
import { Promotion } from '@/lib/firestore/promotions';
import { Aderezo } from '@/lib/firestore/aderezosTypes';
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

export default function AppShell({ settings, menuItems, burritoConfig, promotions, aderezos }: { settings: PublicSettings; menuItems: MenuItem[]; burritoConfig: BurritoConfig; promotions: Promotion[]; aderezos: Aderezo[] }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <SettingsProvider value={settings}>
    <CartProvider>
      <div style={{ maxWidth:'var(--max)', margin:'0 auto', position:'relative' }}>
        <Nav scrolled={scrolled}/>
        <Hero/>
        <div className="section-divider"></div>
        <MenuSection items={menuItems} burritoConfig={burritoConfig} promotions={promotions} aderezos={aderezos}/>
        <div className="section-divider"></div>
        <Gallery/>
        <div className="section-divider"></div>
        <About/>
        <div className="section-divider"></div>
        <Reviews/>
        <div className="section-divider"></div>
        <TipSection/>
        <div className="section-divider"></div>
        <Contact/>
        <Footer/>
        <FloatingWA/>
        <CartBar/>
        <CartDrawer/>
      </div>
    </CartProvider>
    </SettingsProvider>
  );
}
