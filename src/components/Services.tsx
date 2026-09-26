import { useState } from 'react';
import { 
  Briefcase, 
  FileText, 
  ShieldAlert, 
  Scale, 
  Search, 
  Building, 
  BarChart3,
  ArrowUpLeft,
  CheckCircle2,
  X
} from 'lucide-react';
import { SERVICES_DATA } from '../data';
import { useLanguage } from '../lib/LanguageContext';
import ScrollReveal from './ScrollReveal';

export default function Services() {
  const { language, t, dir } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<'legal' | 'realestate'>('legal');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Map icon strings to Lucide components
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Briefcase': return <Briefcase className="w-6 h-6" />;
      case 'FileText': return <FileText className="w-6 h-6" />;
      case 'ShieldAlert': return <ShieldAlert className="w-6 h-6" />;
      case 'Scale': return <Scale className="w-6 h-6" />;
      case 'Search': return <Search className="w-6 h-6" />;
      case 'Building': return <Building className="w-6 h-6" />;
      case 'BarChart3': return <BarChart3 className="w-6 h-6" />;
      default: return <Briefcase className="w-6 h-6" />;
    }
  };

  // Perform English mapping on static services data
  const translatedServices = SERVICES_DATA.map(service => {
    if (language === 'ar') return service;
    
    switch (service.id) {
      case 'corp-setup':
        return {
          ...service,
          title: 'Company Incorporation & Governance',
          description: 'We guide you to choose the optimal legal entity while drafting incorporation documents and partners agreements.',
          detailedPoints: [
            'Selecting the optimal legal entity based on the new Companies Law.',
            'Drafting and reviewing Articles of Association and internal corporate bylaws.',
            'Establishing and structuring Simplified Joint Stock and Limited Liability Companies.',
            'Board governance, structuring relationships between partners, and drafting Shareholders Agreements.',
            'Supporting foreign investments and obtaining Ministry of Investment licenses.'
          ]
        };
      case 'contracts-drafting':
        return {
          ...service,
          title: 'Contract Drafting & Review',
          description: 'Protect your operations through tightly-drafted contracts that prevent disputes and ensure smooth workflows.',
          detailedPoints: [
            'Drafting local and international supply, distribution, and commercial agency agreements.',
            'Reviewing operational and technical service level agreements (SLAs).',
            'Drafting Memorandums of Understanding (MoUs), non-disclosure agreements (NDAs), and confidentiality deeds.',
            'Developing standardized template agreements to optimize efficiency and mitigate commercial risks.',
            'Analyzing contract liabilities, preparing risk mitigation briefs, and preventing liquidated damages.'
          ]
        };
      case 'ip-protection':
        return {
          ...service,
          title: 'Intellectual Property & Trademarking',
          description: 'Register innovations and formulate protection strategies for intangible assets of startups and developers.',
          detailedPoints: [
            'Registering and globalizing trademarks and patents with relevant intellectual property authorities.',
            'Drafting licensing agreements, IP assignment deeds, and technology transfer contracts.',
            'Representing entities in trademark infringement and copyright dispute resolutions.',
            'IP asset governance and reflecting asset values in the company balance sheet evaluations.',
            'Reviewing proprietary rights clauses in employment and external contractor agreements.'
          ]
        };
      case 'disputes-resolution':
        return {
          ...service,
          title: 'Dispute Resolution & Arbitration',
          description: 'Alternative methods and smart negotiating loops to resolve commercial and property disputes without harming active business operations.',
          detailedPoints: [
            'Representing clients in amicable negotiations and mediations to settle commercial disputes.',
            'Preparing arbitration briefs, statements of defense, and attending tribunal hearings.',
            'Representing corporations before commercial courts, general courts, and securities dispute committees.',
            'Offering preemptive risk assessments to resolve friction early and minimize operational down-times.'
          ]
        };
      case 'escrow-due-diligence':
        return {
          ...service,
          title: 'Title Inspections & Due Diligence',
          description: 'Rigorous property and title investigations to confirm ownership records and eliminate overlapping claims.',
          detailedPoints: [
            'Verifying property title deed validity, chain of ownership, and checking for mortgages or disputes.',
            'Reviewing sales agreements and real estate partnership contracts to secure rights and avoid unfair terms.',
            'Analyzing tax liabilities (Real Estate Transaction Tax) and governmental dues associated with the transaction.',
            'Conducting legal assessments of masterplans and lands to verify suitability for desired commercial development.'
          ]
        };
      case 'asset-governance':
        return {
          ...service,
          title: 'Asset Governance & Portfolio Structuring',
          description: 'Framing real estate assets legally within family offices and holding companies to maximize tax and estate protection.',
          detailedPoints: [
            'Structuring real estate assets for family offices to ensure multi-generational sustainability and prevent estate disputes.',
            'Establishing private and shared real estate investment funds in compliance with authorized financial entities.',
            'Drafting operations, maintenance, and facility management agreements for commercial and residential complexes.',
            'Aligning with updated real estate compliance guidelines issued by the Real Estate General Authority.'
          ]
        };
      case 'feasibility-legal-studies':
        return {
          ...service,
          title: 'Feasibility & Regulatory Studies',
          description: 'Analyzing municipal regulations, zoning policies, and building codes before capital deployment.',
          detailedPoints: [
            'Procuring licensing and regulatory clearances for major real estate developments.',
            'Analyzing municipal and legal risks associated with large-scale property developments.',
            'Determining height restrictions, setbacks, zoning compliance, and civil defense licensing costs.',
            'Drafting master development and joint-venture agreements between landowners and property developers.'
          ]
        };
      default:
        return service;
    }
  });

  const filteredServices = translatedServices.filter(s => s.category === activeCategory);
  const selectedService = translatedServices.find(s => s.id === selectedServiceId) || null;

  return (
    <section id="services" className="py-24 bg-brand-blue/5 border-y border-brand-blue/5 relative">
      
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <ScrollReveal>
          {/* Section Heading */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <p className="text-xs font-bold text-brand-gold tracking-widest uppercase font-sans">
              {t('services.tag')}
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-brand-blue font-sans">
              {t('services.title')}
            </h2>
            <div className="w-16 h-0.5 bg-brand-gold mx-auto rounded-full" />
          </div>
        </ScrollReveal>

        {/* Categories Tab Selector with active indicator sliding effect */}
        <div className="flex justify-center mb-12">
          <div className="bg-brand-blue/10 p-1.5 rounded-2xl flex max-w-md w-full border border-brand-blue/5 relative">
            
            <button
              id="tab-legal"
              onClick={() => setActiveCategory('legal')}
              className={`flex-1 py-3.5 text-center font-bold text-sm rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 space-x-reverse cursor-pointer z-10 ${
                activeCategory === 'legal'
                  ? 'bg-brand-blue text-white shadow-md'
                  : 'text-brand-blue hover:text-brand-gold'
              }`}
            >
              <Scale className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
              <span>{t('services.legalCat')}</span>
            </button>

            <button
              id="tab-realestate"
              onClick={() => setActiveCategory('realestate')}
              className={`flex-1 py-3.5 text-center font-bold text-sm rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 space-x-reverse cursor-pointer z-10 ${
                activeCategory === 'realestate'
                  ? 'bg-brand-blue text-white shadow-md'
                  : 'text-brand-blue hover:text-brand-gold'
              }`}
            >
              <Building className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
              <span>{t('services.reCat')}</span>
            </button>

          </div>
        </div>

        {/* Services Grid matching category */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service, sIdx) => (
            <div key={service.id} className="h-full">
              <ScrollReveal delay={sIdx * 0.1}>
                <div
                  onClick={() => setSelectedServiceId(service.id)}
                  className={`bg-white p-6 rounded-2xl border border-brand-blue/5 hover:border-brand-gold/30 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer flex flex-col justify-between h-full ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
                >
                  <div className="space-y-4">
                    <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-xl w-12 h-12 flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-all duration-300">
                      {getIcon(service.icon)}
                    </div>
                    <h3 className="text-lg font-bold text-brand-blue group-hover:text-brand-gold transition-colors font-sans">
                      {service.title}
                    </h3>
                    <p className="text-gray-500 text-xs md:text-sm leading-relaxed font-tajawal">
                      {service.description}
                    </p>
                  </div>

                  {/* Read more footer with custom arrow link */}
                  <div className="pt-6 border-t border-gray-100 mt-6 flex items-center justify-between text-brand-gold group-hover:text-brand-blue transition-colors text-xs font-semibold">
                    <span className="font-tajawal">{language === 'ar' ? 'عرض التفاصيل والامتثال القانوني' : 'View Scope & Compliance Details'}</span>
                    <ArrowUpLeft className={`w-4 h-4 transition-transform duration-200 ${dir === 'rtl' ? 'group-hover:-translate-x-1 group-hover:translate-y-1' : 'group-hover:translate-x-1 group-hover:-translate-y-1'}`} />
                  </div>
                </div>
              </ScrollReveal>
            </div>
          ))}
        </div>

        {/* Immersive Modal for Service Details */}
        {selectedService && (
          <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div 
              className={`bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 relative border border-brand-gold/20 shadow-2xl animate-scaleIn ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedServiceId(null)}
                className={`absolute top-4 p-2 bg-gray-100 hover:bg-brand-gold hover:text-brand-dark text-gray-500 rounded-full transition-all cursor-pointer ${dir === 'rtl' ? 'left-4' : 'right-4'}`}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Body */}
              <div className="space-y-6">
                
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className={`p-3.5 bg-brand-gold/10 text-brand-gold rounded-xl ${dir === 'rtl' ? 'ml-3' : 'mr-3'}`}>
                    {getIcon(selectedService.icon)}
                  </div>
                  <div>
                    <span className="text-[10px] bg-brand-blue/10 text-brand-blue px-2.5 py-1 rounded-full font-bold font-sans">
                      {selectedService.category === 'legal' 
                        ? (language === 'ar' ? 'الملف القانوني' : 'Legal Advisory') 
                        : (language === 'ar' ? 'الملف العقاري' : 'Real Estate')}
                    </span>
                    <h3 className="text-2xl font-bold text-brand-blue mt-1 font-sans">
                      {selectedService.title}
                    </h3>
                  </div>
                </div>

                <p className="text-gray-600 md:text-base leading-relaxed font-tajawal">
                  {selectedService.description}
                </p>

                {/* Scope list with elegant checks */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h4 className="font-bold text-brand-blue font-sans text-sm md:text-base">
                    {t('services.pointsHeader')}
                  </h4>
                  <ul className="space-y-2.5">
                    {selectedService.detailedPoints.map((point, index) => (
                      <li key={index} className={`flex items-start space-x-2.5 space-x-reverse text-sm text-gray-600 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        <CheckCircle2 className={`w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5 ${dir === 'rtl' ? 'ml-2.5' : 'mr-2.5'}`} />
                        <span className="font-tajawal leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`pt-6 flex ${dir === 'rtl' ? 'justify-end' : 'justify-start'} gap-3`}>
                  <button
                    onClick={() => setSelectedServiceId(null)}
                    className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium text-xs md:text-sm transition-all cursor-pointer"
                  >
                    {t('services.closeBtn')}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedServiceId(null);
                      const contactSection = document.getElementById('contact');
                      if (contactSection) {
                        contactSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="px-6 py-2.5 bg-brand-blue hover:bg-brand-gold hover:text-brand-dark text-white rounded-xl font-bold text-xs md:text-sm shadow-md transition-all cursor-pointer"
                  >
                    {t('services.selectServiceBtn')}
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </section>
  );
}
