import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

// Define deep professional translation structure
const translations: Record<Language, Record<string, any>> = {
  ar: {
    brand: {
      name: 'أبو جبل للاستشارات القانونية العقارية',
      logoText: 'أبو جبل',
      subtext: 'للاستشارات القانونية العقارية',
      vision: 'نبني الأساس القانوني الراسخ، ونحمي الاستثمارات العقارية والتجارية لرواد الأعمال والمستثمرين لتمكين الغد بوعي رصين وأمان مطلق.',
    },
    nav: {
      hero: 'الرئيسية',
      about: 'من نحن',
      services: 'خدماتنا',
      calculator: 'حاسبة الشركات',
      insights: 'قسم الوعي',
      contact: 'اتصل بنا',
      portal: 'البوابة الآمنة',
      requestCall: 'طلب اتصال',
      directContact: 'اتصل بنا مباشرة',
      portalTitleMobile: 'دخول البوابة الآمنة للعملاء'
    },
    hero: {
      tag1: 'علاقة وطيدة • أمان مطلق',
      tag2: 'أصول آمنة • عوائد مستقيمة',
      tag3: 'ريادة آمنة • نمو متسارع',
      title1: 'بناء الأساس الآمن والتمكين القانوني لأعمالكم',
      subtitle1: 'الدمج الفريد بين عمق الفقه القانوني واحترافية التقييم العقاري',
      desc1: 'نقدّم حلولاً متكاملة تبدأ بحماية ذمتكم المالية عبر تأسيس وتأطير الشركات، وصولاً إلى فحص وحوكمة أصولكم العقارية ومحافظكم الاستثمارية الكبرى.',
      highlight1: 'الريادة والنزاهة',
      title2: 'حوكمة الأصول وفحص صكوك الملكية العقارية',
      subtitle2: 'حمايتك من مخاطر التداخل وصياغة عقود التطوير الاستثماري الكبرى',
      desc2: 'التقصي النافي للجهالة (Due Diligence) للتأكد من سلامة صكوك الأراضي وخلو المشاريع العقارية من التداخل والالتزامات الضريبية الطارئة.',
      highlight2: 'التقصي الدقيق',
      title3: 'حاضنة التأسيس وحماية الشركات الناشئة والشركاء',
      subtitle3: 'هيكلة متقدمة تستقطب المستثمرين وتصون الملكيات الفكرية للأعمال',
      desc3: 'نصحب مؤسسي الشركات ورواد الأعمال في صياغة اتفاقيات المساهمين وتفعيل الكيانات الحديثة كشركة المساهمة المبسطة التي تدعم تطورات التمويل.',
      highlight3: 'تسريع الأعمال',
      btnConsult: 'احجز موعد استشارتك الآن',
      btnCalc: 'حاسبة الكيان القانوني للمشاريع',
      visionTitle: 'رؤيتنا الاستراتيجية',
      seekConsult: 'اطلب المشورة'
    },
    about: {
      tag: 'فلسفة التميز والقيمة المضافة',
      mainTitle: 'نحن لا ننهي النزاعات فقط، بل نمنع حدوثها من الأساس',
      subTitle: 'الدمج الاستراتيجي بين عمق الفكر القانوني وجدوى الأصول العقارية',
      desc1: 'تأسست شركة أبو جبل للاستشارات القانونية العقارية على عقيدة واضحة: الاستثمار والاقتصاد لا ينفصلان أبداً عن الأنظمة القانونية الحاكمة لهما. فالصفقة الاستثمارية الممتازة أو المشروع الجديد قد ينهار في غياب صياغة عقدية مرنة أو لوائح حوكمة حامية.',
      desc2: 'نلتزم بحماية مصالح وكلائنا من الشركات العائلية والمشاريع التقنية والمطورين العقاريين بمختلف فئاتهم. نغطي كافة المسائل بدءاً من تأسيس الكيان القانوني المناسب وهيكلة أسهمه وصناعة حوكمة مجالس الإدارة، وصولاً إلى فحص صكوك التملك والتقصي العقاري النافي للجهالة، وصياغة عقود التشغيل والصيانة للمشاريع الحيوية الكبرى.',
      quote: '"الحماية القانونية ليست قيداً يكبّل حركتك، بل هي حزام الأمان الذي يسمح لك بالقيادة نحو القمة بأقصى سرعة ممكنة."',
      founder: '— الأستاذ عبد الله أبو جبل (المؤسس والشريك التنفيذي)',
      pillar1Title: 'التناغم التعاقدي والعقاري',
      pillar1Desc: 'بما أن الاستثمار العقاري هو العمود القبلي لمعظم المحافظ والتركات، لا يمكن فصله عن العقود واللوائح. نتميز بتوفير الخبرتين معًا.',
      pillar2Title: 'التحوط الوقائي المحكم',
      pillar2Desc: 'نؤمن أن صياغة عقد رصين ومفحوص اليوم، يمنع الدخول في دوامات قضائية واحتكاك تجاري يستهلك الوقت لأعوام دهرية لاحقاً.',
      pillar3Title: 'تمكين رواد الأعمال',
      pillar3Desc: 'حماية براءات الاختراع والابتكارات للشركات الناشئة في ظل تنظيمات وزارة الاستثمار والهيئات المعنية بدعم وتمكين الشركاء.'
    },
    services: {
      tag: 'مصفوفة التغطية وحفظ الحقوق',
      title: 'باقة الاستشارات المتكاملة للأعمال والعقارات',
      legalCat: 'الشركات والاستشارات الوقائية',
      reCat: 'الحوكمة والمحافظ العقارية',
      all: 'الكل',
      pointsHeader: 'أبرز محاور الخدمة والمساندة:',
      selectServiceBtn: 'احجز استشارة لهذه الخدمة',
      closeBtn: 'إغلاق التفاصيل'
    },
    calc: {
      tag: 'محاكي الوعي الوقائي',
      title: 'حاسبة الكيان القانوني للمشاريع والشركات الناشئة',
      desc: 'أجب على الأسئلة التفاعلية المنسقة أدناه لنقدم لك تحليلاً قانونياً أولياً لأفضل نموذج تجاري وشرعي يقي استثماراتك المخاطر ويحفظ التزامات الشركاء.',
      questionOf: 'السؤال {{current}} من {{total}}',
      yourResults: 'تحليلك وتوصيتنا القانونية الفورية',
      recommendedEntity: 'الكيان القانوني الموصى به لعملك هو:',
      entityExplanation: 'شرح ودواعي التوصية حسب معطياتك:',
      scoreRatio: 'نسبة التلاؤم والمطابقة:',
      otherEntities: 'نسب ملاءمة الهياكل القانونية البديلة:',
      startAgain: 'إعادة محاكاة الفحص القانوني',
      soleTitle: 'المؤسسة الفردية (Sole Proprietorship)',
      soleDesc: 'نموذج رخيص وسريع التأسيس ممتاز للمشروعات الفردية شديدة الصغر، ولكن تذكر أن ذمتك المالية مكشوفة بالكامل لقاء الديون والتعويضات.',
      llcTitle: 'الشركة ذات المسؤولية المحدودة (LLC)',
      llcDesc: 'الهيكل الكلاسيكي الأكثر أماناً للمشروعات الصغيرة والمتوسطة. يحمي ذمتك المالية بالكامل وتتحمل الشركة بمفرها التزاماتها المالية.',
      simplifiedTitle: 'شركة المساهمة المبسطة (Simplified Joint Stock)',
      simplifiedDesc: 'النموذج الأفضل على الإطلاق لرواد الأعمال الطموحين الذين يسعون لجذب تمويل وصناديق رأس مال جريء ومستثمرين ملائكيين.',
      partnershipTitle: 'الشركة التضامنية (General Partnership)',
      partnershipDesc: 'تعتمد على الثقة المتبادلة بين شريكين أو أكثر، ولكن تضامن الشركاء يعني مسؤوليتهم الشخصية والتضامنية عن التزامات الشركة.'
    },
    portal: {
      tag: 'نظام حماية البيانات المشفر',
      title: 'بوابة العميل الرقمية المؤمنة للتواصل وتبادل الوثائق',
      desc: 'بوابة فريدة متوافقة مع متطلبات الامتثال السحابية العالية. نقوم هنا بتبادل الملفات، الصكوك، ومذكرات العقود بتشفير تام للوثائق وحفظها على خوادمنا السحابية المشفرة.',
      statusUnauth: 'الرجاء تسجيل الدخول بـ Google لتبادل الوثائق بأمان',
      loginBtn: 'تسجيل الدخول بـ Google للامتثال الأمني',
      welcome: 'مرحباً، المستشار الوقائي يرحب بك',
      activeAccount: 'حساب ممتثل ومصرح للتراسل العقاري والقانوني',
      logoutBtn: 'تسجيل الخروج الآمن',
      foldersTitle: 'الملفات المؤمنة المشفرة المتداولة حالياً:',
      uploadZone: 'اسحب وأفلت الصكوك والعقود هنا لتدقيقها فوراً أو تصفح ملفاتك',
      uploadBtn: 'أو حدد الملفات من جهازك يدوياً',
      googleDriveBtn: 'تكامل Google Drive',
      secureStorageNotice: 'تنبيه امتثال: جميع المرفقات تخضع لتشفير AES-256 وتتحقق تلقائياً من خلوها من البرمجيات الضارة قبل الحفظ.',
      encryptionKey: 'مفتاح التشفير النشط:',
      noFiles: 'لا توجد مستندات مرفوعة حالياً. اسحب أول مستند لبدء الفحص والتدقيق.',
      fileName: 'اسم المستند',
      fileSize: 'الحجم',
      fileDate: 'تاريخ الإيداع',
      fileStatus: 'الحالة الأمنية',
      status_encrypting: 'جاري التشفير والامتثال...',
      status_encrypted: 'مؤمن ومشفر',
      status_under_review: 'قيد المراجعة الفنية',
      status_processed: 'مكتمل ومعتمد',
      notesPlaceholder: 'أضف ملاحظات أو توجيهات مستعجلة للمستشار حول الصك أو العقد المرفق...',
      saveNotes: 'حفظ الملاحظة',
      addCustomFileBtn: 'أو أضف مستند اختبار يدوي للتدقيق'
    },
    insights: {
      tag: 'منصة نشر المعرفة الوقائية والتوعية القانونية',
      title: 'الركن التوعوي: مقالات فنية تمنع الخسائر وتحمي التوسعات',
      all: 'كل الموضوعات المعرفية',
      btnShare: 'نسخ لمشاركته مع فريقك 📋',
      searchPlaceholder: 'ابحث في الموسوعة المعرفية...',
      readMore: 'قراءة المقال كاملاً'
    },
    contact: {
      tag: 'قنوات التواصل المباشر وجدول اللقاءات',
      title: 'ابدأ تحصين استثماراتك وعقاراتك اليوم',
      desc: 'احجز موعد استشارتك مع مستشارينا، أو اترك استفسارك وسنعاود الاتصال بك خلال ٢٤ ساعة عمل كأقصى تقدير.',
      name: 'اسم رائد الأعمال أو المستثمر *',
      phone: 'رقم الجوال النشط (مع رمز الدولة) *',
      email: 'البريد الإلكتروني للعمل *',
      companyName: 'اسم المنشأة أو الشركة العقارية (اختياري)',
      serviceType: 'نوع الاستشارة المطلوبة *',
      message: 'وصف مقتضب وتفاصيل الاستفسار والطلب...',
      submitBtn: 'إرسال طلب الاستشارة والتوثيق المجدول',
      contactInfo: 'معلومات الحضور والتواصل المباشر',
      addressTitle: 'العنوان الجغرافي للمقر الرئيس:',
      workHoursTitle: 'ساعات العمل والمساندة:',
      workHoursDesc: 'الأحد - الخميس (٩:٠٠ صباحاً - ٥:٠٠ مساءً)',
      successSubmit: 'تم إرسال طلبك بنجاح! سنتواصل معك قريباً.',
      calendarTitle: 'مؤشر حجز المواعيد والتحقق الآلي من الفترات الشاغرة:',
      selectDate: '١. اختر تاريخ الاستشارة المتاحة:',
      selectSlot: '٢. حدد الفترة الشاغرة المؤكدة:',
      bookedSlots: 'الأوقات الشاغرة والممتلئة ليوم:',
      slotsNotice: 'تنبيه: جميع مواعيد الاستشارات تخضع لدراسة أولية لملخص القضية قبل التأكيد الهاتفي.',
      prevMonth: 'الشهر السابق',
      nextMonth: 'الشهر التالي',
    },
    footer: {
      disclaimerTitle: 'إخلاء المسؤولية الممتثل والمهني:',
      disclaimerDesc: 'البيانات المنشورة، الحسابات التفاعلية، ومحاكاة حاسبة الكيانات القانونية تقدم لأغراض توعوية وإرشادية عامة ولا ترقى لمرتبة الاستشارة القانونية النهائية الصادرة في مذكرة رسمية مخصصة. للحصول على مشورة حاسمة ومكتوبة تترتب عليها آثار قانونية، يرجى حجز موعد رسمي ودخول البوابة الآمنة لإيداع المستندات وصكوك الملكية.',
      rights: 'جميع الحقوق محفوظة © ٢٠٢٦ أبو جبل للاستشارات القانونية العقارية.',
      legalCredits: 'مرخص وممتثل للأنظمة واللوائح والقرارات القضائية السائدة بالمملكة العربية السعودية.'
    },
    liveChat: {
      welcome: 'أهلاً بك في مكتب الأستاذ أبو جبل! كيف يمكن لمستشارنا الوقائي مساعدتك اليوم؟',
      placeholder: 'اكتب رسالتك للمستشار المناوب...',
      send: 'إرسال',
      title: 'المساعد القانوني الآلي',
      status: 'نشط للاستشارة الفورية'
    }
  },
  en: {
    brand: {
      name: 'Abu Jabal Legal & Real Estate Consulting',
      logoText: 'Abu Jabal',
      subtext: 'Real Estate & Legal Advisory',
      vision: 'We build the rock-solid legal foundation and safeguard commercial and real estate investments for entrepreneurs and investors to empower tomorrow with prudent awareness and absolute security.',
    },
    nav: {
      hero: 'Home',
      about: 'About Us',
      services: 'Services',
      calculator: 'Corporate Calculator',
      insights: 'Insights',
      contact: 'Contact',
      portal: 'Secure Portal',
      requestCall: 'Request Call',
      directContact: 'Contact Directly',
      portalTitleMobile: 'Access Secure Client Portal'
    },
    hero: {
      tag1: 'Solid Relationship • Absolute Security',
      tag2: 'Secured Assets • Straight Returns',
      tag3: 'Safe Entrepreneurship • Fast Growth',
      title1: 'Building the Secure Foundation and Legal Empowerment for Your Businesses',
      subtitle1: 'A unique fusion of deep legal jurisprudence and professional real estate evaluation',
      desc1: 'We provide comprehensive solutions that begin with safeguarding your personal wealth through company incorporation and corporate structuring, to inspecting and governing your major real estate assets and investment portfolios.',
      highlight1: 'Leadership & Integrity',
      title2: 'Asset Governance & Real Estate Title Inspections',
      subtitle2: 'Protecting you from boundary overlaps and drafting major real estate development agreements',
      desc2: 'Rigorous due diligence checks to verify land title deeds, ensuring real estate developments are free from boundary overlaps and unforeseen tax liabilities.',
      highlight2: 'Prudent Due Diligence',
      title3: 'The Incorporation Incubator & Startup Protection',
      subtitle3: 'Advanced structuring that attracts investors and safeguards business intellectual property',
      desc3: 'We guide founders and entrepreneurs in drafting shareholders agreements and establishing modern corporate structures such as the Simplified Joint Stock company to support successive funding rounds.',
      highlight3: 'Business Acceleration',
      btnConsult: 'Book Your Consultation Now',
      btnCalc: 'Corporate Legal Entity Calculator',
      visionTitle: 'Our Strategic Vision',
      seekConsult: 'Request Advisory'
    },
    about: {
      tag: 'Philosophy of Excellence & Added Value',
      mainTitle: 'We do not just resolve disputes; we prevent them from arising in the first place',
      subTitle: 'Strategic integration between deep legal insight and real estate asset viability',
      desc1: 'Abu Jabal Legal & Real Estate Consulting was founded on a clear core belief: investment and economics are completely inseparable from the governing legal frameworks. An exceptional investment deal or a startup project can collapse in the absence of resilient contractual drafting or protective governance frameworks.',
      desc2: 'We are committed to safeguarding the interests of our clients, including family offices, technology startups, and real estate developers of all tiers. We handle everything from choosing the optimal legal entity, structuring share divisions, and designing board governance, to examining property titles, conducting due diligence, and drafting operations & maintenance agreements for major developments.',
      quote: '"Legal protection is not a chain that restricts your movement; it is the seatbelt that allows you to drive towards the summit at the highest speed possible."',
      founder: '— Mr. Abdullah Abu Jabal (Founder and Managing Partner)',
      pillar1Title: 'Contractual & Real Estate Harmony',
      pillar1Desc: 'Since real estate is the backbone of most portfolios and estates, it cannot be separated from contracts and regulations. We uniquely deliver both expertises together.',
      pillar2Title: 'Preemptive Legal Mitigation',
      pillar2Desc: 'We believe that drafting a solid, well-reviewed contract today prevents falling into judicial vortexes and commercial friction that consume years of precious time later.',
      pillar3Title: 'Empowering Entrepreneurs',
      pillar3Desc: 'Safeguarding patents and innovations for startups in compliance with the Ministry of Investment regulations and authorities supporting partnerships.'
    },
    services: {
      tag: 'Coverage Framework & Rights Protection',
      title: 'Comprehensive Consultation Packages for Businesses & Properties',
      legalCat: 'Corporate & Preemptive Advisory',
      reCat: 'Real Estate Governance & Portfolios',
      all: 'All',
      pointsHeader: 'Key service deliverables and support:',
      selectServiceBtn: 'Book Consultation for This Service',
      closeBtn: 'Close Details'
    },
    calc: {
      tag: 'Preemptive Mitigation Simulator',
      title: 'Startup & Enterprise Legal Entity Calculator',
      desc: 'Answer the interactive questions below to receive an instant legal analysis of the best commercial structure to shield your investments from risks and preserve partners commitments.',
      questionOf: 'Question {{current}} of {{total}}',
      yourResults: 'Your Instant Legal Assessment & Recommendation',
      recommendedEntity: 'The recommended legal entity for your business is:',
      entityExplanation: 'Reason and triggers for this recommendation based on your inputs:',
      scoreRatio: 'Match & Fit Ratio:',
      otherEntities: 'Alternative Legal Structure Match Levels:',
      startAgain: 'Restart Simulation',
      soleTitle: 'Sole Proprietorship',
      soleDesc: 'An affordable, quick-to-establish model excellent for ultra-small individual projects. However, keep in mind your personal assets are fully exposed to debts and damages.',
      llcTitle: 'Limited Liability Company (LLC)',
      llcDesc: 'The classic, safest structure for small to medium enterprises. It fully protects your personal wealth, and the company alone bears its liabilities.',
      simplifiedTitle: 'Simplified Joint Stock Company',
      simplifiedDesc: 'The single best model for ambitious entrepreneurs seeking VC funding, angel investments, and structured equity incentive pools (ESOPs).',
      partnershipTitle: 'General Partnership',
      partnershipDesc: 'Relies on mutual trust between two or more partners, but means partners have unlimited, personal, and joint liability for the partnership obligations.'
    },
    portal: {
      tag: 'Encrypted Data Protection System',
      title: 'Secure Digital Client Portal for Document Exchange & Messaging',
      desc: 'A premium, high-compliance portal. Safely upload and exchange titles, contracts, and briefs with full AES-256 end-to-end encryption on our high-security servers.',
      statusUnauth: 'Please log in with Google to safely exchange documents',
      loginBtn: 'Log In with Google for Security Compliance',
      welcome: 'Welcome, our Preemptive Consultant welcomes you',
      activeAccount: 'Account compliant and authorized for real estate & legal transmission',
      logoutBtn: 'Secure Logout',
      foldersTitle: 'Currently Active Secure Documents:',
      uploadZone: 'Drag and drop deeds and contracts here to inspect them immediately, or browse your files',
      uploadBtn: 'Or browse files manually',
      googleDriveBtn: 'Google Drive Integration',
      secureStorageNotice: 'Compliance Alert: All attachments undergo AES-256 encryption and automatic antimalware screening before saving.',
      encryptionKey: 'Active Encryption Key:',
      noFiles: 'No documents uploaded yet. Drag your first document to begin review.',
      fileName: 'Document Name',
      fileSize: 'Size',
      fileDate: 'Upload Date',
      fileStatus: 'Security Status',
      status_encrypting: 'Encrypting & Validating...',
      status_encrypted: 'Secured & Encrypted',
      status_under_review: 'Under Legal Review',
      status_processed: 'Reviewed & Approved',
      notesPlaceholder: 'Add urgent notes or directives for the consultant regarding the uploaded deed or agreement...',
      saveNotes: 'Save Note',
      addCustomFileBtn: 'Or Add Dummy Test File for Legal Review'
    },
    insights: {
      tag: 'Legal Knowledge Dissemination Platform',
      title: 'The Educational Hub: Insights that Prevent Loss & Safeguard Scale',
      all: 'All Educational Topics',
      btnShare: 'Copy to Share with Your Team 📋',
      searchPlaceholder: 'Search the legal knowledge hub...',
      readMore: 'Read Full Article'
    },
    contact: {
      tag: 'Direct Channels & Scheduled Advisory Sessions',
      title: 'Begin Fortifying Your Investments & Assets Today',
      desc: 'Book your advisory session with our consultants, or submit an inquiry, and we will get back to you within 24 business hours.',
      name: 'Founder or Investor Name *',
      phone: 'Active Mobile Number (including Country Code) *',
      email: 'Corporate Work Email *',
      companyName: 'Company or Real Estate Entity Name (Optional)',
      serviceType: 'Advisory Service Category *',
      message: 'Brief description and advisory requirements...',
      submitBtn: 'Submit Request & Secure Appointment',
      contactInfo: 'Office Presence & Contact Coordinates',
      addressTitle: 'Corporate Headquarters Address:',
      workHoursTitle: 'Working Hours:',
      workHoursDesc: 'Sunday - Thursday (9:00 AM - 5:00 PM)',
      successSubmit: 'Your request has been submitted! We will contact you soon.',
      calendarTitle: 'Advisory Scheduler & Real-time Slot Availability Indicator:',
      selectDate: '1. Select an Available Consultation Date:',
      selectSlot: '2. Choose an Open Consultation Time Slot:',
      bookedSlots: 'Open & booked slots for:',
      slotsNotice: 'Note: All consultation times are subject to a preliminary review of the brief prior to telephone confirmation.',
      prevMonth: 'Previous Month',
      nextMonth: 'Next Month',
    },
    footer: {
      disclaimerTitle: 'Professional Compliance Disclaimer:',
      disclaimerDesc: 'The materials, dynamic calculations, and legal calculator simulations published on this platform are for general educational and guide purposes only and do not constitute a final binding legal opinion. For formal, binding legal counsel on specific matters, please book an appointment and deposit the relevant documents and titles through our secure client portal.',
      rights: 'All rights reserved © 2026 Abu Jabal Legal & Real Estate Consulting.',
      legalCredits: 'Licensed and fully compliant with the prevailing regulations, laws, and judicial decrees of the Kingdom of Saudi Arabia.'
    },
    liveChat: {
      welcome: 'Welcome to the office of Mr. Abu Jabal! How can our preemptive advisor assist you today?',
      placeholder: 'Type your message to the on-duty advisor...',
      send: 'Send',
      title: 'Automated Legal Assistant',
      status: 'Active for Instant Advisory'
    }
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('abujabal_lang');
    return (saved as Language) || 'ar';
  });

  useEffect(() => {
    localStorage.setItem('abujabal_lang', language);
    // Update HTML dir and lang attributes dynamically
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let current: any = translations[language];
    for (const k of keys) {
      if (current && current[k] !== undefined) {
        current = current[k];
      } else {
        // Fallback to 'ar' if key is missing in chosen language
        let arCurrent: any = translations['ar'];
        for (const ak of keys) {
          if (arCurrent && arCurrent[ak] !== undefined) {
            arCurrent = arCurrent[ak];
          } else {
            arCurrent = key;
            break;
          }
        }
        return arCurrent;
      }
    }
    return typeof current === 'string' ? current : key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      <div dir={dir} className={language === 'en' ? 'font-sans' : 'font-tajawal'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
