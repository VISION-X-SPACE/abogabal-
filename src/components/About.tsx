import { ShieldAlert, Landmark, GraduationCap } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import ScrollReveal from './ScrollReveal';

export default function About() {
  const { t, dir } = useLanguage();

  const pillars = [
    {
      icon: <Landmark className="w-6 h-6 text-brand-gold" />,
      title: t('about.pillar1Title'),
      desc: t('about.pillar1Desc')
    },
    {
      icon: <ShieldAlert className="w-6 h-6 text-brand-gold" />,
      title: t('about.pillar2Title'),
      desc: t('about.pillar2Desc')
    },
    {
      icon: <GraduationCap className="w-6 h-6 text-brand-gold" />,
      title: t('about.pillar3Title'),
      desc: t('about.pillar3Desc')
    }
  ];

  return (
    <section id="about" className="py-24 bg-white relative overflow-hidden">
      
      {/* Decorative luxury abstract circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-lightgold/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-gold/5 rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <ScrollReveal>
          {/* Section Heading */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <p className="text-xs font-bold text-brand-gold tracking-widest uppercase font-sans">
              {t('about.tag')}
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-brand-blue tracking-tight leading-tight font-sans">
              {t('about.mainTitle')}
            </h2>
            <div className="w-20 h-1 bg-brand-gold mx-auto rounded-full" />
          </div>
        </ScrollReveal>

        {/* Contents Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Column 1: Philosophy Text */}
          <div className="lg:col-span-6 space-y-6">
            <ScrollReveal direction="left" delay={0.2}>
              <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                <h3 className="text-2xl font-bold text-brand-blue font-sans mb-4">
                  {t('about.subTitle')}
                </h3>
                
                <p className="text-gray-600 leading-relaxed font-tajawal mb-4">
                  {t('about.desc1')}
                </p>

                <p className="text-gray-600 leading-relaxed font-tajawal mb-6">
                  {t('about.desc2')}
                </p>

                <div className={`p-5 bg-brand-lightgold/30 rounded-2xl border-brand-gold text-brand-blue space-y-2 ${dir === 'rtl' ? 'border-r-4 text-right' : 'border-l-4 text-left'}`}>
                  <p className="font-bold font-sans text-sm md:text-base italic">
                    {t('about.quote')}
                  </p>
                  <p className="text-xs text-brand-gold font-bold font-tajawal">
                    {t('about.founder')}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Column 2: Bento Grid Cards */}
          <div className="lg:col-span-6 grid grid-cols-1 gap-6">
            <ScrollReveal direction="right" delay={0.4}>
              <div className="space-y-6">
                {pillars.map((pillar, index) => (
                  <div 
                    key={index}
                    className="group flex flex-col md:flex-row items-start p-6 bg-brand-blue/5 hover:bg-brand-blue/10 rounded-2xl border border-brand-blue/5 hover:border-brand-gold/20 transition-all duration-300"
                  >
                    <div className={`p-3 bg-white rounded-xl border border-brand-gold/15 group-hover:scale-110 transition-transform duration-300 shadow-sm flex-shrink-0 ${dir === 'rtl' ? 'ml-4' : 'mr-4'}`}>
                      {pillar.icon}
                    </div>
                    <div className={`space-y-2 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      <h4 className="text-lg font-bold text-brand-blue group-hover:text-brand-gold transition-colors font-sans leading-none">
                        {pillar.title}
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed font-tajawal">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

        </div>

      </div>
    </section>
  );
}
