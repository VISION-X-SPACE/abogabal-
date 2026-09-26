import { useState, FormEvent, useEffect } from 'react';
import { 
  Calendar as CalIcon, 
  Clock, 
  Mail, 
  Phone, 
  User, 
  Building, 
  MessageSquare, 
  MapPin, 
  ArrowLeft,
  Briefcase,
  Linkedin,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Mic,
  MicOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerToast } from './NotificationToast';
import { BRAND_CONFIG } from '../data';
import { ConsultationRequest } from '../types';
import { useLanguage } from '../lib/LanguageContext';
import ScrollReveal from './ScrollReveal';
import { addNotification } from '../lib/notificationStore';

interface ContactFormProps {
  preselectedService: string;
}

export default function ContactForm({ preselectedService }: ContactFormProps) {
  const { language, t, dir } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState<ConsultationRequest>({
    name: '',
    phone: '',
    email: '',
    companyName: '',
    serviceType: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '11:00 - 12:00',
    message: ''
  });

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Voice Dictation / Speech Recognition implementation
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      
      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          triggerToast(
            language === 'ar' 
              ? 'يرجى السماح بالوصول إلى الميكروفون من إعدادات المتصفح لرفع الصكوك والملخصات الوقائية.' 
              : 'Please allow microphone access in your browser settings to dictate your preventative briefs.',
            'error'
          );
        } else {
          triggerToast(
            language === 'ar'
              ? 'حدث خطأ أثناء محاولة التعرف على الصوت.'
              : 'An error occurred during speech recognition.',
            'error'
          );
        }
      };

      rec.onresult = (event: any) => {
        const resultIndex = event.resultIndex;
        const transcriptText = event.results[resultIndex][0].transcript;
        
        setFormData((prev) => {
          const separator = prev.message ? ' ' : '';
          return {
            ...prev,
            message: prev.message + separator + transcriptText
          };
        });

        triggerToast(
          language === 'ar'
            ? 'تمت إضافة النص الصوتي للمستشار بنجاح!'
            : 'Voice description appended successfully!',
          'success'
        );
      };

      setRecognition(rec);
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognition) {
      triggerToast(
        language === 'ar'
          ? 'المتصفح الحالي لا يدعم خاصية الإدخال الصوتي.'
          : 'Your browser does not support voice input features.',
        'error'
      );
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      try {
        recognition.start();
        triggerToast(
          language === 'ar'
            ? 'جاري الاستماع... تحدث الآن لوصف احتياجاتك.'
            : 'Listening... speak now to describe your needs.',
          'success'
        );
      } catch (e) {
        console.error(e);
        recognition.stop();
      }
    }
  };

  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const englishMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const arabicWeekdays = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  const englishWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    if (preselectedService) {
      setFormData(prev => ({ 
        ...prev, 
        serviceType: preselectedService,
        message: language === 'ar' 
          ? `أرغب في الحصول على استشارة مخصصة ووقائية بشأن: ${preselectedService}.`
          : `I would like to receive a customized legal consultation regarding: ${preselectedService}.`
      }));
    }
  }, [preselectedService, language]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.email) {
      triggerToast(
        language === 'ar'
          ? 'يرجى تعبئة الحقول الأساسية: الاسم، رقم الجوال، والبريد الإلكتروني للعمل.'
          : 'Please fill out the primary fields: Name, Phone, and Work Email.',
        'error'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientName: formData.name,
          clientPhone: formData.phone,
          clientEmail: formData.email,
          date: formData.date,
          timeSlot: formData.timeSlot.split(' - ')[0],
          serviceType: formData.serviceType || (language === 'ar' ? 'استشارة وقائية عقارية عامة' : 'General Legal Advisory'),
          notes: formData.message + (formData.companyName ? `\n(الشركة: ${formData.companyName})` : ''),
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "خطأ أثناء تسجيل الاستشارة");
      }

      const resData = await res.json();
      console.log("[ContactForm] Appointment booked:", resData);

      setSubmitted(true);

      // Register confirmation and reminder notifications in the Notification System
      if (language === 'ar') {
        addNotification(
          'تأكيد موعد الاستشارة الوقائية 📅',
          `تم حجز استشارتك لـ (${formData.name}) بنجاح. تم إرسال إشعار فوري للمستشار ورسالة تأكيد لبريدك الإلكتروني (${formData.email}). التاريخ: ${formData.date}، الوقت: ${formData.timeSlot}.`,
          'confirmation'
        );
        addNotification(
          'تذكير هام بخصوص استشارتك ⚖️',
          'يرجى إيداع صكوك الملكية ومسودات العقود ذات الصلة باستشارتك في البوابة الآمنة لتسهيل المراجعة الوقائية قبل تاريخ الجلسة.',
          'reminder'
        );
      } else {
        addNotification(
          'Preemptive Consultation Confirmed 📅',
          `Your consultation for (${formData.name}) has been booked. An alert was sent to the consultant and confirmation to (${formData.email}). Date: ${formData.date}, Time: ${formData.timeSlot}.`,
          'confirmation'
        );
        addNotification(
          'Important Consultation Reminder ⚖️',
          'Please deposit any relevant land deed, contract draft, or documents in your Secure Client Portal to allow for preemptive legal review before your session.',
          'reminder'
        );
      }

      triggerToast(
        language === 'ar'
          ? 'تم حجز الاستشارة بنجاح وإرسال إشعار للمستشار ورسالة تأكيد لبريدك الإلكتروني! ✉️'
          : 'Consultation booked successfully! Alert sent to the consultant and confirmation to your email! ✉️',
        'success'
      );
    } catch (err: any) {
      console.error("Booking error:", err);
      triggerToast(
        err.message || (language === 'ar' ? 'حدث خطأ أثناء حجز الموعد. يرجى المحاولة ثانية.' : 'Failed to book appointment. Please try again.'),
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      name: '',
      phone: '',
      email: '',
      companyName: '',
      serviceType: '',
      date: new Date().toISOString().split('T')[0],
      timeSlot: '11:00 - 12:00',
      message: ''
    });
  };

  // Saudi/Egyptian legal services options translated
  const servicesChoices = language === 'ar' ? [
    { val: 'تأسيس شركة مساهمة مبسطة', label: 'تأسيس الكيان: شركة مساهمة مبسطة' },
    { val: 'تأسيس شركة ذات مسؤولية محدودة', label: 'تأسيس الكيان: شركة ذات مسؤولية محدودة' },
    { val: 'صياغة العقود التجارية ومراجعتها', label: 'صياغة العقود والاتفاقيات التجارية' },
    { val: 'فحص صكوك الملكية والتقصي العقاري', label: 'التقصي العقاري وفحص صكوك التملك' },
    { val: 'دراسات الجدوى العقارية وحوكمة الأصول', label: 'حوكمة الأصول وإدارة المحافظ العقارية' },
    { val: 'حماية الملكية الفكرية وتراخيص الاستثمار', label: 'الملكية الفكرية والعلامات التجارية للشركات' },
    { val: 'تسوية النزاعات والتحكيم التجاري العقاري', label: 'تحكيم تجاري وتسوية ودية للنزاعات' }
  ] : [
    { val: 'تأسيس شركة مساهمة مبسطة', label: 'Incorporation: Simplified Joint Stock Co.' },
    { val: 'تأسيس شركة ذات مسؤولية محدودة', label: 'Incorporation: Limited Liability Company' },
    { val: 'صياغة العقود التجارية ومراجعتها', label: 'Drafting & Review of Commercial Contracts' },
    { val: 'فحص صكوك الملكية والتقصي العقاري', label: 'Due Diligence & Real Estate Title Inspections' },
    { val: 'دراسات الجدوى العقارية وحوكمة الأصول', label: 'Asset Governance & Real Estate Portfolios' },
    { val: 'حماية الملكية الفكرية وتراخيص الاستثمار', label: 'IP & Trademark protection for start-ups' },
    { val: 'تسوية النزاعات والتحكيم التجاري العقاري', label: 'Commercial Arbitration & Amicable Settlements' }
  ];

  // Calendar Calculation Helper functions
  const getDaysInMonth = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDayIndex, totalDays };
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const { firstDayIndex, totalDays } = getDaysInMonth(currentMonth);
  const monthLabel = language === 'ar'
    ? `${arabicMonths[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
    : `${englishMonths[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  // Time Slots calculations and dynamic "Available/ممتلئ" states based on date
  const selectedDateStr = formData.date;
  const getSlotsForDate = (date: string) => {
    // Deterministic mock slots based on date string characters
    const charSum = date.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return [
      { 
        value: '09:00 - 10:00', 
        label: language === 'ar' ? '٠٩:٠٠ ص - ١٠:٠٠ ص' : '09:00 AM - 10:00 AM', 
        category: language === 'ar' ? 'الجلسة الصباحية الأولى' : 'First Morning Session', 
        isAvailable: charSum % 3 !== 0 
      },
      { 
        value: '11:00 - 12:00', 
        label: language === 'ar' ? '١١:٠٠ ص - ١٢:٠٠ م' : '11:00 AM - 12:00 PM', 
        category: language === 'ar' ? 'الجلسة الصباحية الثانية' : 'Second Morning Session', 
        isAvailable: charSum % 4 !== 0 
      },
      { 
        value: '13:00 - 14:00', 
        label: language === 'ar' ? '٠١:٠٠ م - ٠٢:٠٠ م' : '01:00 PM - 02:00 PM', 
        category: language === 'ar' ? 'الجلسة المسائية الأولى' : 'First Evening Session', 
        isAvailable: charSum % 5 !== 0 
      },
      { 
        value: '16:00 - 17:00', 
        label: language === 'ar' ? '٠٤:٠٠ م - ٠٥:٠٠ م' : '04:00 PM - 05:00 PM', 
        category: language === 'ar' ? 'جلسة المراجعة والتحصين' : 'Preemptive Review Session', 
        isAvailable: true 
      }
    ];
  };

  const activeSlots = getSlotsForDate(selectedDateStr);

  return (
    <section id="contact" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <ScrollReveal>
          {/* Section Heading */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <p className="text-xs font-bold text-brand-gold tracking-widest uppercase font-sans">
              {t('contact.tag')}
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-brand-blue font-sans">
              {t('contact.title')}
            </h2>
            <p className="text-sm md:text-base text-gray-500 font-tajawal max-w-xl mx-auto">
              {t('contact.desc')}
            </p>
            <div className="w-16 h-0.5 bg-brand-gold mx-auto rounded-full" />
          </div>
        </ScrollReveal>

        <AnimatePresence mode="wait">
          {!submitted ? (
            /* BOOKING FORM MODE */
            <motion.div
              key="booking-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch"
            >
              
              {/* Left Column: Office Contacts Info */}
              <div className="lg:col-span-5 bg-brand-blue text-white rounded-3xl p-8 flex flex-col justify-between space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-brand-gold/10 rounded-full blur-[90px] pointer-events-none" />
                
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold font-sans text-brand-lightgold">{t('contact.contactInfo')}</h3>
                  <p className="text-sm text-gray-300 font-tajawal leading-relaxed">
                    {language === 'ar'
                      ? 'تفضل بزيارتنا في مقرنا الرئيسي، أو اختر الاستشارة عن بُعد (عبر بروتوكول اتصال مشفر بالكامل) كخيار افتراضي متكامل لسرعة التسيير.'
                      : 'Visit us at our primary corporate headquarters or select remote advisory (via full encrypted communication protocols) for rapid, seamless onboarding.'}
                  </p>

                  <div className="space-y-4 pt-4 font-tajawal text-sm">
                    
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <MapPin className="w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5" />
                      <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                        <p className="font-bold">{t('contact.addressTitle')}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {language === 'ar' ? BRAND_CONFIG.address : '90th Street, Fifth Settlement, New Cairo'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 space-x-reverse">
                      <Phone className="w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5" />
                      <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                        <p className="font-bold">{language === 'ar' ? 'الخط الاستشاري المباشر:' : 'Direct Helpline:'}</p>
                        <p className="text-xs text-gray-400 mt-1 bg-white/10 px-2.5 py-1 rounded inline-block font-mono tracking-wider text-white">
                          {BRAND_CONFIG.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 space-x-reverse">
                      <Mail className="w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5" />
                      <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                        <p className="font-bold">{language === 'ar' ? 'المراسلات القانونية المعززة:' : 'Secure Legal Inquiries:'}</p>
                        <p className="text-xs text-gray-400 mt-1 hover:text-brand-gold transition-colors">{BRAND_CONFIG.email}</p>
                      </div>
                    </div>

                    {BRAND_CONFIG.linkedin && (
                      <div className="flex items-start space-x-3 space-x-reverse">
                        <Linkedin className="w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5" />
                        <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                          <p className="font-bold">{language === 'ar' ? 'حساب LinkedIn المهني:' : 'Corporate LinkedIn Profile:'}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            <a href={BRAND_CONFIG.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-brand-gold underline transition-colors">
                              {language === 'ar' ? 'مستشار أبو جبل' : 'Mr. Abu Jabal'}
                            </a>
                          </p>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Working hours signature */}
                <div className="pt-6 border-t border-white/10 text-xs text-gray-400 font-tajawal leading-relaxed">
                  <p className="font-bold text-white mb-1">{t('contact.workHoursTitle')}</p>
                  <p>{t('contact.workHoursDesc')}</p>
                  <p className="mt-1 text-[10px] text-gray-500">
                    {language === 'ar' 
                      ? 'يغلق المكتب يومي الجمعة والسبت للإعداد والمراجعة القانونية الداخلية.'
                      : 'The headquarters remains closed on Friday and Saturday for internal audits and research.'}
                  </p>
                </div>

              </div>

              {/* Right Column: Interaction Field Form Inputs */}
              <form onSubmit={handleSubmit} className={`lg:col-span-7 bg-brand-blue/5 rounded-3xl p-6 md:p-8 border border-brand-blue/10 space-y-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Full name input */}
                  <div className="space-y-1.5">
                    <label htmlFor="name-input" className="text-xs font-bold text-brand-blue flex items-center space-x-1 space-x-reverse">
                      <User className="w-3.5 h-3.5 text-brand-gold" />
                      <span>{t('contact.name')}</span>
                    </label>
                    <input
                      id="name-input"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder={language === 'ar' ? 'الأستاذ / الأستاذة...' : 'Mr. / Ms....'}
                      className="w-full bg-white border border-gray-200 focus:border-brand-gold rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold"
                    />
                  </div>

                  {/* Phone contact input */}
                  <div className="space-y-1.5">
                    <label htmlFor="phone-input" className="text-xs font-bold text-brand-blue flex items-center space-x-1 space-x-reverse">
                      <Phone className="w-3.5 h-3.5 text-brand-gold" />
                      <span>{t('contact.phone')}</span>
                    </label>
                    <input
                      id="phone-input"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="05xxxxxxxx"
                      className="w-full bg-white border border-gray-200 focus:border-brand-gold rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold"
                    />
                  </div>

                  {/* Email address */}
                  <div className="space-y-1.5">
                    <label htmlFor="email-input" className="text-xs font-bold text-brand-blue flex items-center space-x-1 space-x-reverse">
                      <Mail className="w-3.5 h-3.5 text-brand-gold" />
                      <span>{t('contact.email')}</span>
                    </label>
                    <input
                      id="email-input"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="corporate@company.com"
                      className="w-full bg-white border border-gray-200 focus:border-brand-gold rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold"
                    />
                  </div>

                  {/* Company name option */}
                  <div className="space-y-1.5">
                    <label htmlFor="company-input" className="text-xs font-bold text-brand-blue flex items-center space-x-1 space-x-reverse">
                      <Building className="w-3.5 h-3.5 text-brand-gold" />
                      <span>{t('contact.companyName')}</span>
                    </label>
                    <input
                      id="company-input"
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      placeholder={language === 'ar' ? 'شركة... المحدودة / ريادة...' : 'Company Ltd. / Startup...'}
                      className="w-full bg-white border border-gray-200 focus:border-brand-gold rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold"
                    />
                  </div>

                  {/* Service choice type dropdown */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="service-type" className="text-xs font-bold text-brand-blue flex items-center space-x-1 space-x-reverse">
                      <Briefcase className="w-3.5 h-3.5 text-brand-gold" />
                      <span>{t('contact.serviceType')}</span>
                    </label>
                    <select
                      id="service-type"
                      value={formData.serviceType}
                      onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                      className="w-full bg-white border border-gray-200 focus:border-brand-gold rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold cursor-pointer"
                    >
                      <option value="">{language === 'ar' ? '-- اختر ملف الاستشارة المطلوبة --' : '-- Select Advisory Area --'}</option>
                      {servicesChoices.map((choice, cIdx) => (
                        <option key={cIdx} value={choice.val}>{choice.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* INTERACTIVE CALENDAR SCHEDULER BLOCK */}
                  <div className="md:col-span-2 space-y-3 pt-4 border-t border-gray-200/50">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <CalIcon className="w-4 h-4 text-brand-gold" />
                      <h4 className="text-xs font-bold text-brand-blue font-sans">
                        {t('contact.calendarTitle')}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      
                      {/* Interactive Month/Date Picker Calendar Grid (7 columns) */}
                      <div className="md:col-span-7 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
                        
                        {/* Month Selector header */}
                        <div className="flex items-center justify-between pb-2 border-b border-gray-50">
                          <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 transition-all cursor-pointer"
                            title={t('contact.prevMonth')}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          
                          <span className="text-xs font-bold text-brand-blue font-sans">{monthLabel}</span>
                          
                          <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 transition-all cursor-pointer"
                            title={t('contact.nextMonth')}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Weekday Labels row */}
                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400">
                          {(language === 'ar' ? arabicWeekdays : englishWeekdays).map((day, idx) => (
                            <div key={idx} className="py-1">{day}</div>
                          ))}
                        </div>

                        {/* Monthly Days grid cells */}
                        <div className="grid grid-cols-7 gap-1 text-center">
                          {/* Render empty cells until the first day of month starts */}
                          {Array.from({ length: firstDayIndex }).map((_, emptyIdx) => (
                            <div key={`empty-${emptyIdx}`} className="py-2" />
                          ))}

                          {/* Render actual days buttons */}
                          {Array.from({ length: totalDays }).map((_, i) => {
                            const dayNum = i + 1;
                            const yearVal = currentMonth.getFullYear();
                            const monthVal = String(currentMonth.getMonth() + 1).padStart(2, '0');
                            const dayVal = String(dayNum).padStart(2, '0');
                            const loopDateStr = `${yearVal}-${monthVal}-${dayVal}`;

                            // Check past
                            const todayStr = new Date().toISOString().split('T')[0];
                            const isPast = loopDateStr < todayStr;

                            // Check Saudi Weekend (Friday=5, Saturday=6)
                            const dateObj = new Date(yearVal, currentMonth.getMonth(), dayNum);
                            const dayOfWeek = dateObj.getDay();
                            const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

                            const isSelected = formData.date === loopDateStr;

                            return (
                              <button
                                key={`day-${dayNum}`}
                                type="button"
                                disabled={isPast || isWeekend}
                                onClick={() => setFormData({ ...formData, date: loopDateStr })}
                                className={`py-1.5 text-xs font-bold rounded-lg transition-all relative flex flex-col items-center justify-center ${
                                  isPast 
                                    ? 'text-gray-200 cursor-not-allowed line-through' 
                                    : isWeekend 
                                      ? 'text-red-300 bg-red-50/20 cursor-not-allowed hover:bg-red-50/30' 
                                      : isSelected 
                                        ? 'bg-brand-blue text-white shadow-md border border-brand-gold' 
                                        : 'bg-white hover:bg-brand-gold/15 text-gray-700'
                                }`}
                                title={isWeekend ? (language === 'ar' ? 'عطلة نهاية الأسبوع' : 'Weekend Holiday') : ''}
                              >
                                <span>{dayNum}</span>
                                {isSelected && (
                                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-brand-gold" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Weekend Indicator Help text */}
                        <div className="text-[10px] text-gray-400 font-tajawal flex items-center space-x-1.5 space-x-reverse">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                          <span>
                            {language === 'ar'
                              ? '* أيام الجمعة والسبت باللون الأحمر هي عطلة نهاية الأسبوع ولا تصح الجدولة فيها.'
                              : '* Fridays & Saturdays colored in light red represent weekend holidays.'}
                          </span>
                        </div>

                      </div>

                      {/* Time Slots availability selection */}
                      <div className="md:col-span-5 bg-brand-blue/5 border border-brand-blue/10 rounded-2xl p-4 space-y-3">
                        <p className="text-[11px] font-bold text-brand-blue font-sans">
                          {t('contact.bookedSlots')} <span className="text-brand-gold font-mono">{formData.date}</span>
                        </p>

                        <div className="space-y-2">
                          {activeSlots.map((slot, sIdx) => {
                            const isSelected = formData.timeSlot === slot.value;
                            return (
                              <button
                                key={sIdx}
                                type="button"
                                disabled={!slot.isAvailable}
                                onClick={() => setFormData({ ...formData, timeSlot: slot.value })}
                                className={`w-full p-3 rounded-xl border text-right transition-all text-xs flex items-center justify-between cursor-pointer ${
                                  !slot.isAvailable
                                    ? 'bg-gray-100/50 border-gray-150 text-gray-400 cursor-not-allowed opacity-60'
                                    : isSelected
                                      ? 'bg-brand-blue text-white border-brand-gold shadow-md font-bold'
                                      : 'bg-white border-gray-200 hover:border-brand-gold text-gray-700'
                                }`}
                              >
                                <div className={`flex flex-col ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                  <span className="font-bold font-sans">{slot.label}</span>
                                  <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-brand-lightgold' : 'text-gray-400'}`}>{slot.category}</span>
                                </div>

                                <div className="text-[9px] font-bold">
                                  {slot.isAvailable ? (
                                    <span className={isSelected ? 'text-brand-gold' : 'text-emerald-600'}>
                                      {language === 'ar' ? '● متاح' : '● Open'}
                                    </span>
                                  ) : (
                                    <span className="text-red-500">
                                      {language === 'ar' ? '● ممتلئ' : '● Booked'}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <p className="text-[10px] text-gray-500 font-tajawal leading-snug">
                          {t('contact.slotsNotice')}
                        </p>

                      </div>

                    </div>
                  </div>

                  {/* Message description box with Voice Dictation */}
                  <div className="space-y-1.5 md:col-span-2 relative">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label htmlFor="inquiry-message" className="text-xs font-bold text-brand-blue flex items-center space-x-1 space-x-reverse">
                        <MessageSquare className="w-3.5 h-3.5 text-brand-gold" />
                        <span>{t('contact.message')}</span>
                      </label>
                      
                      {/* Voice Dictation Trigger Button */}
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`inline-flex items-center space-x-1.5 space-x-reverse text-xs font-bold px-2.5 py-1 rounded-lg transition-all duration-300 cursor-pointer ${
                          isListening
                            ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
                            : 'bg-brand-blue/5 text-brand-blue border border-brand-blue/10 hover:bg-brand-blue hover:text-white hover:border-brand-blue'
                        }`}
                        title={
                          language === 'ar'
                            ? isListening ? 'إيقاف الاستماع' : 'استخدم الإدخال الصوتي'
                            : isListening ? 'Stop listening' : 'Use voice input'
                        }
                      >
                        {isListening ? (
                          <>
                            <MicOff className="w-3.5 h-3.5 text-red-500" />
                            <span className="font-tajawal">{language === 'ar' ? 'إيقاف الاستماع' : 'Stop Listening'}</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5 text-brand-gold" />
                            <span className="font-tajawal">{language === 'ar' ? 'إملاء صوتي (تحدث)' : 'Voice Input (Speak)'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <textarea
                        id="inquiry-message"
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        placeholder={
                          language === 'ar'
                            ? 'يرجى ذكر الالتزامات الجوهرية، الأطراف، صكوك ملكية الأراضي، أو أي تداخلات تخبرنا بها لتهيئة الجلسة بدقة...'
                            : 'Please specify key obligations, land title deed numbers, boundary descriptions, or startup structural briefs for a meticulous diagnostic meeting...'
                        }
                        className={`w-full bg-white border border-gray-200 focus:border-brand-gold rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold transition-all duration-200 ${
                          isListening ? 'ring-2 ring-red-400/30 border-red-400 bg-red-50/5' : ''
                        }`}
                      />
                      {isListening && (
                        <div className="absolute bottom-3 left-3 sm:left-auto sm:right-3 flex items-center space-x-1.5 space-x-reverse bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                          <span className="text-[10px] text-red-700 font-bold font-tajawal">
                            {language === 'ar' ? 'المايك نشط - تحدث الآن' : 'Microphone Live - Speak Now'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-10 py-4 bg-brand-blue hover:bg-brand-gold hover:text-brand-dark text-white font-bold rounded-xl transition-all shadow-lg text-sm md:text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 space-x-reverse"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{language === 'ar' ? 'جاري حجز الموعد وإرسال الإشعارات...' : 'Booking session & sending emails...'}</span>
                      </>
                    ) : (
                      <span>{t('contact.submitBtn')}</span>
                    )}
                  </button>
                </div>

              </form>

            </motion.div>
          ) : (
            /* SUCCESS SUBMISSION SCREEN RECEIPT */
            <motion.div
              key="success-receipt"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 120, damping: 14 }}
              className="max-w-xl mx-auto bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center space-y-6"
            >
              
              <div className="flex justify-center flex-col items-center">
                <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-emerald-100 border-2 border-emerald-300">
                  <motion.svg
                    className="w-12 h-12 text-emerald-600 z-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.75, ease: "easeOut", delay: 0.15 }}
                      d="M20 6L9 17l-5-5"
                    />
                  </motion.svg>
                  {/* Outer breathing ring ripple */}
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0.8 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-emerald-400/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-emerald-900 font-sans">
                  {language === 'ar' ? 'تم تعميد حجز الاستشارة بنجاح' : 'Consultation Successfully Booked'}
                </h3>
                <p className="text-sm text-emerald-800 font-tajawal leading-relaxed">
                  {language === 'ar' ? (
                    <>أهلاً بك الأستاذ/ة <strong>{formData.name}</strong>. تم تسجيل موعد استشارتك في جدول المستشار، وتم إرسال رسالة تأكيد رسمية إلى بريدك الإلكتروني.</>
                  ) : (
                    <>Welcome <strong>{formData.name}</strong>. Your consultation has been scheduled with the partner, and a confirmation email has been sent to you.</>
                  )}
                </p>
              </div>

              {/* Automatic Email Dispatch Indicator */}
              <div className="p-3.5 bg-brand-gold/15 border border-brand-gold/40 rounded-xl text-xs text-brand-dark text-right flex items-center space-x-2.5 space-x-reverse">
                <span className="text-lg">✉️</span>
                <p className="font-tajawal m-0 leading-relaxed">
                  {language === 'ar'
                    ? `تم إرسال إشعار فوري لبريد المستشار (gaballpasha@gmail.com) ورسالة تأكيد رسمية لبريدك الإلكتروني (${formData.email}).`
                    : `An instant notification was sent to the consultant (gaballpasha@gmail.com) and confirmation to your email (${formData.email}).`}
                </p>
              </div>

              {/* Generated receipt summary table visual */}
              <div className="bg-white rounded-2xl p-5 text-right border border-emerald-150 space-y-3 font-tajawal text-xs sm:text-sm text-emerald-950">
                <div className={`flex justify-between border-b pb-2 border-emerald-50 ${dir === 'rtl' ? 'flex-row' : 'flex-row-reverse'}`}>
                  <span className="font-bold">{language === 'ar' ? 'كود المراجعة السري:' : 'Secure Code:'}</span>
                  <span className="font-mono font-bold text-brand-gold">AJL-{Math.floor(1000 + Math.random() * 9000)}</span>
                </div>
                <div className={`flex justify-between border-b pb-2 border-emerald-50 ${dir === 'rtl' ? 'flex-row' : 'flex-row-reverse'}`}>
                  <span className="font-bold">{language === 'ar' ? 'تاريخ وتوقيت الجلسة:' : 'Session Date & Time:'}</span>
                  <span>{formData.date} - {formData.timeSlot.split(' - ')[0]}</span>
                </div>
                <div className={`flex justify-between border-b pb-2 border-emerald-50 ${dir === 'rtl' ? 'flex-row' : 'flex-row-reverse'}`}>
                  <span className="font-bold">{language === 'ar' ? 'الملف الاستشاري:' : 'Advisory Area:'}</span>
                  <span className="text-brand-blue font-bold">{formData.serviceType || (language === 'ar' ? 'استشارة عامة مفصلة' : 'General Advisory')}</span>
                </div>
                {formData.companyName && (
                  <div className={`flex justify-between ${dir === 'rtl' ? 'flex-row' : 'flex-row-reverse'}`}>
                    <span className="font-bold">{language === 'ar' ? 'جهة الكيان التجاري:' : 'Company Entity:'}</span>
                    <span>{formData.companyName}</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-emerald-100/40 rounded-xl text-xs text-emerald-800 text-right leading-relaxed font-tajawal">
                <p className="font-bold mb-1">{language === 'ar' ? 'الخطوات التالية للمكتب:' : 'Next Steps & Compliance:'}</p>
                <ul className="list-disc list-inside space-y-1 leading-snug">
                  {language === 'ar' ? (
                    <>
                      <li>سيتصل بك مستشارنا القانوني على الجوال {formData.phone} خلال ساعة واحدة لتأكيد الربط الإلكتروني.</li>
                      <li>يرجى إرسال أي وثائق مساعدة عبر بوابة العميل الآمنة بالمنصة قبل وقت الجلسة.</li>
                    </>
                  ) : (
                    <>
                      <li>Our legal partner will contact you at {formData.phone} within one hour to confirm the online secure link.</li>
                      <li>Kindly upload any supporting deeds or documents via the Secure Client Portal prior to your session.</li>
                    </>
                  )}
                </ul>
              </div>

              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer inline-flex items-center space-x-1.5 space-x-reverse"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'ar' ? 'تسجيل استفسار أو قضية أخرى' : 'Register Another Inquiry'}</span>
              </button>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
