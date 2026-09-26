/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Calculator from './components/Calculator';
import ClientPortal from './components/ClientPortal';
import Insights from './components/Insights';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';
import LiveChat from './components/LiveChat';
import NotificationToast from './components/NotificationToast';
import { ShieldCheck, HelpCircle, ArrowUp } from 'lucide-react';

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [preselectedService, setPreselectedService] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Monitor scrolling to highlight the correct nav item
  useEffect(() => {
    // Send automatic visitor alert when a new user visits the site
    const hasVisitedThisSession = sessionStorage.getItem('abujabal_session_logged');
    if (!hasVisitedThisSession) {
      sessionStorage.setItem('abujabal_session_logged', 'true');
      fetch('/api/analytics/visitor-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userAgent: navigator.userAgent,
          referrer: document.referrer || "Direct Link",
          language: navigator.language || "ar",
          screenResolution: `${window.screen.width}x${window.screen.height}`
        })
      })
      .then(r => r.json())
      .then(d => {
        console.log("[Visitor Analytics] Visited recorded successfully:", d);
      })
      .catch(e => console.error("[Visitor Analytics] Tracking dispatch failed:", e));
    }

    const handleScroll = () => {
      // Show/hide scroll to top button
      if (window.scrollY > 500) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      const sections = ['hero', 'about', 'services', 'calculator', 'portal', 'insights', 'contact'];
      const scrollPosition = window.scrollY + 250;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section === 'portal' ? 'hero' : section); // map portal to hero or handle custom highlight
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigate = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  const handleOpenPortalDirectly = () => {
    const element = document.getElementById('portal');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a temporary glow effect to the portal section to draw focus
      element.classList.add('ring-2', 'ring-brand-gold', 'ring-offset-4', 'duration-500');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-brand-gold', 'ring-offset-4');
      }, 3000);
    }
  };

  const handlePreSelectService = (serviceName: string) => {
    setPreselectedService(serviceName);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans select-none text-right" dir="rtl">
      
      {/* 1. Header component */}
      <Header 
        activeSection={activeSection} 
        onNavigate={handleNavigate} 
        onOpenPortal={handleOpenPortalDirectly} 
      />

      {/* 2. Page main layers */}
      <main className="flex-grow">
        
        {/* Banner Hero slideshow */}
        <Hero 
          onNavigateToContact={() => handleNavigate('contact')} 
          onNavigateToCalculator={() => handleNavigate('calculator')} 
        />

        {/* About Company section */}
        <About />

        {/* Advisory Services Grid tabber */}
        <Services />

        {/* Startup Legal Advisor Calculator */}
        <Calculator onPreSelectService={handlePreSelectService} />

        {/* Secure Upload Files portal */}
        <ClientPortal />

        {/* Knowledge Articles detailed prose section (strictly no tables) */}
        <Insights />

        {/* Contact scheduling Consultation calendar */}
        <ContactForm preselectedService={preselectedService} />

      </main>

      {/* 3. Footer and Disclaimers */}
      <Footer onNavigate={handleNavigate} />

      {/* Back to top float button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 p-3 bg-brand-gold hover:bg-yellow-600 text-brand-dark rounded-full shadow-lg hover:scale-105 transition-all z-40 cursor-pointer animate-fadeIn"
          aria-label="العودة لأعلى الصفحة"
        >
          <ArrowUp className="w-5 h-5 font-bold" />
        </button>
      )}

      {/* Floating Live Chat Widget */}
      <LiveChat />

      {/* Global animated Toast notification receiver */}
      <NotificationToast />

    </div>
  );
}
