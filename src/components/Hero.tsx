import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowDownLeft, Scale, Shield, Building, ChevronDown } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface HeroProps {
  onNavigateToContact: () => void;
  onNavigateToCalculator: () => void;
}

export default function Hero({ onNavigateToContact, onNavigateToCalculator }: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { language, t, dir } = useLanguage();

  const slides = [
    {
      title: t('hero.title1'),
      subtitle: t('hero.subtitle1'),
      description: t('hero.desc1'),
      tag: t('hero.tag1'),
      highlight: t('hero.highlight1'),
      icon: <Scale className="w-8 h-8 text-brand-gold" />
    },
    {
      title: t('hero.title2'),
      subtitle: t('hero.subtitle2'),
      description: t('hero.desc2'),
      tag: t('hero.tag2'),
      highlight: t('hero.highlight2'),
      icon: <Building className="w-8 h-8 text-brand-gold" />
    },
    {
      title: t('hero.title3'),
      subtitle: t('hero.subtitle3'),
      description: t('hero.desc3'),
      tag: t('hero.tag3'),
      highlight: t('hero.highlight3'),
      icon: <Shield className="w-8 h-8 text-brand-gold" />
    }
  ];

  const stats = language === 'ar' ? [
    { val: '١٥+ عاماً', label: 'الخبرة التراكمية في الاستشارات العقارية والقضائية' },
    { val: '١٤٥+ شركة', label: 'تم حوكمتها وتأسيس هياكلها القانونية' },
    { val: '٨٥٠+ مليون', label: 'قيمة صكوك الأراضي والتركات المفحوصة' },
    { val: '٩٨.٤٪', label: 'نسبة الرضا والامتثال الوقائي الخالي من النزاعات' }
  ] : [
    { val: '15+ Years', label: 'Cumulative Real Estate & Legal Advisory Experience' },
    { val: '145+ Cos.', label: 'Governed, Structured, & Formed Incorporations' },
    { val: 'SAR 850M+', label: 'Total Value of Property Titles Inspected' },
    { val: '98.4%', label: 'Dispute-Free Client Compliance Rate' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8500);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const currentSlideData = slides[currentSlide] || slides[0];

  return (
    <section 
      id="hero"
      className="relative min-h-[95vh] flex items-center justify-center bg-brand-dark pt-20 overflow-hidden"
    >
      {/* Visual Background Pattern with luxurious gold/blue accents */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-blue/95 via-brand-dark/95 to-brand-blue/90" />
        
        {/* Skycraper Geometric Outlines */}
        <div className="absolute bottom-0 right-0 left-0 h-96 opacity-10 flex justify-around items-end px-12 select-none pointer-events-none">
          <div className="w-16 h-80 bg-white rounded-t-lg" />
          <div className="w-24 h-[400px] bg-white rounded-t-lg" />
          <div className="w-20 h-96 bg-white rounded-t-lg" />
          <div className="w-28 h-[450px] bg-white rounded-t-lg" />
          <div className="w-14 h-72 bg-white rounded-t-lg" />
          <div className="w-24 h-80 bg-white rounded-t-lg" />
        </div>

        {/* Dynamic Abstract Light Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-gold/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[140px] pointer-events-none translate-x-1/2" />
      </div>

      <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
        
        {/* Slides Content Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[480px]">
          
          {/* Main Slide Panel */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Tag Badges */}
            <div className="inline-flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-brand-gold/15 to-yellow-500/5 border border-brand-gold/30 px-3.5 py-1.5 rounded-full text-brand-gold text-xs font-semibold tracking-wide animate-pulse">
              <span className="w-1.5 h-1.5 bg-brand-gold rounded-full" />
              <span>{currentSlideData.tag}</span>
            </div>

            {/* Slide Title */}
            <h1 className="text-3xl md:text-5xl lg:text-5xl font-extrabold text-white leading-tight md:leading-snug">
              {currentSlideData.title.split(currentSlideData.highlight)[0]}
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-brand-gold to-yellow-500 underline decoration-brand-gold/30">
                {currentSlideData.highlight}
              </span>
              {currentSlideData.title.split(currentSlideData.highlight)[1]}
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-brand-lightgold font-sans font-medium">
              {currentSlideData.subtitle}
            </p>

            {/* Paragraph Description */}
            <p className="text-gray-300 md:text-lg leading-relaxed max-w-3xl font-tajawal">
              {currentSlideData.description}
            </p>

            {/* Call To Actions */}
            <div className={`pt-6 flex flex-wrap gap-4 ${dir === 'rtl' ? 'justify-start' : 'justify-start'}`}>
              <button
                onClick={onNavigateToContact}
                className="group flex items-center space-x-2 space-x-reverse bg-gradient-to-l from-brand-gold to-yellow-600 text-brand-dark font-extrabold px-7 py-4 rounded-xl shadow-lg hover:shadow-brand-gold/10 hover:scale-[1.02] transform transition-all text-sm md:text-base cursor-pointer"
              >
                <span>{t('hero.btnConsult')}</span>
                <ArrowDownLeft className={`w-5 h-5 transition-transform duration-200 ${dir === 'rtl' ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
              </button>
              
              <button
                onClick={onNavigateToCalculator}
                className="border border-white/20 hover:border-brand-gold/60 text-white hover:bg-white/5 font-semibold px-6 py-4 rounded-xl transition-all text-sm md:text-base flex items-center space-x-2 space-x-reverse cursor-pointer"
              >
                <span>{t('hero.btnCalc')}</span>
              </button>
            </div>

          </div>

          {/* Majestic Badge Counter / Icon Grid */}
          <div className="lg:col-span-4 hidden lg:flex flex-col items-center justify-center">
            <div className="relative p-10 bg-brand-blue/40 backdrop-blur-md rounded-2xl border border-white/10 w-80 text-center space-y-6 shadow-2xl">
              
              {/* Outer corner design items */}
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-brand-gold/40" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-brand-gold/40" />
              
              <div className="p-4 bg-brand-gold/10 rounded-full inline-block border border-brand-gold/20">
                {currentSlideData.icon}
              </div>

              <h4 className="text-xl font-bold text-white font-sans">
                {t('hero.visionTitle')}
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed font-tajawal">
                {t('brand.vision')}
              </p>

              <div className="pt-2 flex justify-center space-x-1 space-x-reverse">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${i === currentSlide ? 'w-8 bg-brand-gold' : 'w-2 bg-white/25'}`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Core Stats Bar integrated seamlessly at the bottom margin of Hero */}
        <div className="mt-14 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-6xl mx-auto">
          {stats.map((stat, sIndex) => (
            <div key={sIndex} className="space-y-1">
              <p className="text-2xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-l from-brand-gold to-yellow-400">
                {stat.val}
              </p>
              <p className="text-xs md:text-sm text-gray-400 font-tajawal font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

      </div>

      {/* Slide Navigation Manual Controls */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-brand-blue/30 hover:bg-brand-gold hover:text-brand-dark text-white border border-white/10 transition-all z-20 cursor-pointer"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-6 h-6 animate-pulse" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-brand-blue/30 hover:bg-brand-gold hover:text-brand-dark text-white border border-white/10 transition-all z-20 cursor-pointer"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-6 h-6 animate-pulse" />
      </button>

      {/* Downward Arrow guide */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center cursor-pointer animate-bounce hover:scale-105" onClick={onNavigateToContact}>
        <span className="text-[10px] text-brand-gold/80 mb-1 font-semibold tracking-widest font-tajawal">{t('hero.seekConsult')}</span>
        <ChevronDown className="w-5 h-5 text-brand-gold" />
      </div>
    </section>
  );
}
