'use client';

import { useState, useEffect } from 'react';
import { CartProvider } from '@/contexts/CartContext';
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

export default function AppShell() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <CartProvider>
      <div style={{ maxWidth:'var(--max)', margin:'0 auto', position:'relative' }}>
        <Nav scrolled={scrolled}/>
        <Hero/>
        <div className="section-divider"></div>
        <MenuSection/>
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
  );
}
