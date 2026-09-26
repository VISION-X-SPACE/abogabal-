/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Scale, Building2, MapPin, Phone, Mail, ShieldAlert, Key, Linkedin } from 'lucide-react';
import { BRAND_CONFIG } from '../data';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (id: string) => {
    onNavigate(id);
  };

  return (
    <footer id="main-footer" className="bg-brand-dark text-white border-t border-brand-gold/20 pt-16 pb-8 text-right relative overflow-hidden">
      
      {/* Visual glowing geometric overlay */}
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-gold/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-12 border-b border-white/10">
          
          {/* Brand Signature Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center space-x-2.5 space-x-reverse cursor-pointer" onClick={() => handleLinkClick('hero')}>
              <div className="relative p-2 bg-brand-gold/15 rounded-xl border border-brand-gold/30">
                <Scale className="w-6 h-6 text-brand-gold" />
                <Building2 className="w-3.5 h-3.5 text-white absolute bottom-1 right-2" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-xl tracking-tight leading-none">
                  {BRAND_CONFIG.logoText}
                </span>
                <span className="text-[10px] text-brand-lightgold mt-0.5 font-tajawal">
                  للاستشارات القانونية العقارية
                </span>
              </div>
            </div>

            <p className="text-xs md:text-sm text-gray-400 font-tajawal leading-relaxed">
              {BRAND_CONFIG.vision}
            </p>

            <div className="inline-flex items-center space-x-1.5 space-x-reverse text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-bold">
              <Key className="w-3.5 h-3.5" />
              <span>ترخيص وزارة العدل وهيئة العقار نشط</span>
            </div>
          </div>

          {/* Quick Nav links */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-bold text-brand-gold uppercase tracking-wider font-sans">خريطة المنصة</h4>
            <ul className="space-y-2.5 text-xs md:text-sm text-gray-400 font-tajawal">
              <li>
                <button onClick={() => handleLinkClick('hero')} className="hover:text-white hover:underline transition-colors cursor-pointer">
                  الرئيسية
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('about')} className="hover:text-white hover:underline transition-colors cursor-pointer">
                  من نحن وفلسفتنا
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('services')} className="hover:text-white hover:underline transition-colors cursor-pointer">
                  استمارات الخدمات
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('calculator')} className="hover:text-white hover:underline transition-colors cursor-pointer">
                  حاسبة الكيانات القانونية
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('insights')} className="hover:text-white hover:underline transition-colors cursor-pointer">
                  أوراق وعقود المعرفة
                </button>
              </li>
            </ul>
          </div>

          {/* Our detailed Legal scope items */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-sm font-bold text-brand-gold uppercase tracking-wider font-sans">مجالات الاختصاص</h4>
            <ul className="space-y-2.5 text-xs md:text-sm text-gray-400 font-tajawal">
              <li>
                <button onClick={() => handleLinkClick('services')} className="hover:text-white transition-colors cursor-pointer">
                  تأسيس وحوكمة الشركات التقنية والناشئة
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('services')} className="hover:text-white transition-colors cursor-pointer">
                  التقصي العقاري النافي للجهالة وصحة الصكوك
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('services')} className="hover:text-white transition-colors cursor-pointer">
                  صياغة العقود الاستثمارية والتشغيلية الكبرى
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('services')} className="hover:text-white transition-colors cursor-pointer">
                  التحكيم التجاري وتسوية مذكرات التفاهم
                </button>
              </li>
            </ul>
          </div>

          {/* Main Headquarters and legal channels */}
          <div className="lg:col-span-3 space-y-4 font-tajawal text-xs md:text-sm text-gray-400">
            <h4 className="text-sm font-bold text-brand-gold uppercase tracking-wider font-sans">التواصل الرسمي</h4>
            <ul className="space-y-2.5">
              <li className="flex items-start space-x-2 space-x-reverse">
                <MapPin className="w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5" />
                <span>{BRAND_CONFIG.address}</span>
              </li>
              <li className="flex items-center space-x-2 space-x-reverse">
                <Phone className="w-5 h-5 text-brand-gold flex-shrink-0" />
                <span className="font-mono tracking-wider">{BRAND_CONFIG.phone}</span>
              </li>
              <li className="flex items-center space-x-2 space-x-reverse">
                <Mail className="w-5 h-5 text-brand-gold flex-shrink-0" />
                <span className="hover:text-white transition-colors">{BRAND_CONFIG.email}</span>
              </li>
              <li className="flex items-center space-x-2 space-x-reverse">
                <Linkedin className="w-5 h-5 text-brand-gold flex-shrink-0" />
                <a 
                  href={BRAND_CONFIG.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white hover:underline transition-all duration-200"
                >
                  حساب LinkedIn المهني
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Regulatory disclaimer statement */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] text-gray-500 font-tajawal gap-4">
          <div className="flex items-start space-x-2 space-x-reverse max-w-2xl text-justify md:text-right">
            <ShieldAlert className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>إخلاء مسؤولية تنظيمي:</strong> المعلومات والأوراق المنشورة في مكتبة المعرفة أو المخرجة من حاسبة الكيانات المبدئية تمثل مذكرات توجيهية وقائية عامة تابعة للأعراف المهنية بنظام الشركات السعودي وهيئة العقار، ولا يحسب تصفحها بمفرده كعقد تمثيل قانوني أو مرافعة قضائية معتمدة دون توقيع اتفاقية تقديم خدمات استشارية رسمية ومعمدة من مكتب المستشار الإقليمي أبو جبل للاستشارات.
            </p>
          </div>
          <div className="text-center md:text-left flex-shrink-0">
            <p>© {currentYear} شركة أبو جبل للاستشارات القانونية العقارية. جميع الحقوق محفوظة.</p>
            <p className="text-gray-600 mt-0.5">صُمم بحرفية معمارية وقانونية تامة للتمكين والاستدامة.</p>
          </div>
        </div>

      </div>
    </footer>
  );
}
