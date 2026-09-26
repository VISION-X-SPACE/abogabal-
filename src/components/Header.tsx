/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Scale, Building2, Menu, X, ShieldCheck, PhoneCall, Globe } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import NotificationCenter from './NotificationCenter';

interface HeaderProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  onOpenPortal: () => void;
}

export default function Header({ activeSection, onNavigate, onOpenPortal }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { language, setLanguage, t, dir } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'hero', label: t('nav.hero') },
    { id: 'about', label: t('nav.about') },
    { id: 'services', label: t('nav.services') },
    { id: 'calculator', label: t('nav.calculator') },
    { id: 'insights', label: t('nav.insights') },
    { id: 'contact', label: t('nav.contact') }
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    setIsOpen(false);
  };

  return (
    <header
      id="main-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-brand-blue/95 backdrop-blur-md shadow-lg border-b border-brand-gold/10 py-3'
          : 'bg-gradient-to-b from-brand-blue/90 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          
          {/* Logo Brand Accent */}
          <div 
            id="brand-logo-container"
            className="flex items-center space-x-2 space-x-reverse cursor-pointer group"
            onClick={() => handleItemClick('hero')}
          >
            <div className="relative p-2 bg-brand-gold/15 rounded-xl border border-brand-gold/30 group-hover:bg-brand-gold/25 transition-all">
              <Scale className="w-6 h-6 text-brand-gold" />
              <Building2 className={`w-3.5 h-3.5 text-white absolute bottom-1 ${dir === 'rtl' ? 'right-2' : 'left-2'}`} />
            </div>
            <div className={`flex flex-col ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
              <span className="text-white font-bold text-lg md:text-xl tracking-tight group-hover:text-brand-gold transition-colors leading-none font-sans">
                {t('brand.logoText')}
              </span>
              <span className="text-[10px] text-brand-lightgold/85 mt-0.5 tracking-wide">
                {t('brand.subtext')}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav id="desktop-nav" className="hidden md:flex items-center space-x-1 lg:space-x-2 space-x-reverse">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  activeSection === item.id
                    ? 'text-brand-gold bg-brand-gold/10 font-bold border-b-2 border-brand-gold'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Action Buttons */}
          <div id="header-actions" className="hidden md:flex items-center space-x-3 space-x-reverse">
            {/* Language Switch Button */}
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="flex items-center space-x-1.5 space-x-reverse bg-white/10 hover:bg-white/15 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all border border-white/10 cursor-pointer"
              title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
            >
              <Globe className="w-3.5 h-3.5 text-brand-gold" />
              <span className="font-sans">{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            {/* Secure Notification Center System */}
            <NotificationCenter />

            <button
              onClick={onOpenPortal}
              className="flex items-center space-x-1.5 space-x-reverse bg-gradient-to-l from-brand-gold to-yellow-600 text-brand-dark px-4 py-2 rounded-xl text-xs font-bold hover:scale-[1.03] transition-all shadow-md shadow-brand-gold/20 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-brand-dark" />
              <span>{t('nav.portal')}</span>
            </button>
            
            <button
              onClick={() => handleItemClick('contact')}
              className="flex items-center space-x-1 space-x-reverse border border-white/20 hover:border-brand-gold/50 text-white hover:bg-white/5 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-brand-gold" />
              <span>{t('nav.requestCall')}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2 space-x-reverse">
            {/* Mobile Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="p-2 text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 cursor-pointer"
            >
              <Globe className="w-4 h-4 text-brand-gold" />
            </button>

            {/* Mobile Notification System */}
            <NotificationCenter />

            <button
              onClick={onOpenPortal}
              className="flex items-center space-x-1 bg-brand-gold/90 text-brand-dark px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'البوابة' : 'Portal'}</span>
            </button>
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white p-2 rounded-lg focus:outline-none cursor-pointer"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-brand-blue border-b border-brand-gold/10 py-4 px-4 space-y-2"
          >
            {navItems.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ x: dir === 'rtl' ? 30 : -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.04, duration: 0.25 }}
                onClick={() => handleItemClick(item.id)}
                className={`block w-full px-4 py-3 rounded-lg text-base font-medium transition-all cursor-pointer ${dir === 'rtl' ? 'text-right border-r-4' : 'text-left border-l-4'} ${
                  activeSection === item.id
                    ? 'bg-brand-gold/15 text-brand-gold border-brand-gold font-bold'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white border-transparent'
                }`}
              >
                {item.label}
              </motion.button>
            ))}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: navItems.length * 0.04, duration: 0.3 }}
              className="pt-4 border-t border-white/10 flex flex-col space-y-2"
            >
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenPortal();
                }}
                className="flex items-center justify-center space-x-2 space-x-reverse bg-brand-gold text-brand-dark py-3 rounded-xl font-bold text-sm shadow-md cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{t('nav.portalTitleMobile')}</span>
              </button>
              <button
                onClick={() => handleItemClick('contact')}
                className="flex items-center justify-center space-x-2 space-x-reverse border border-white/20 text-white py-3 rounded-xl text-sm cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 text-brand-gold" />
                <span>{t('nav.directContact')}</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
