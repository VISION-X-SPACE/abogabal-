import { useState } from 'react';
import { 
  FileCheck, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Sparkles, 
  Scale, 
  Building2, 
  ArrowLeftSquare 
} from 'lucide-react';
import { CALCULATOR_QUESTIONS } from '../data';
import { useLanguage } from '../lib/LanguageContext';
import ScrollReveal from './ScrollReveal';

interface CalculatorProps {
  onPreSelectService: (serviceName: string) => void;
}

export default function Calculator({ onPreSelectService }: CalculatorProps) {
  const { language, t, dir } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);

  const handleSelectOption = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const nextStep = () => {
    if (currentStep < CALCULATOR_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      calculateRecommendation();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const resetCalculator = () => {
    setAnswers({});
    setCurrentStep(0);
    setShowResult(false);
  };

  interface Score {
    llc: number;
    sole: number;
    simplifiedJointStock: number;
    partnership: number;
  }

  const [scores, setScores] = useState<Score>({ llc: 0, sole: 0, simplifiedJointStock: 0, partnership: 0 });

  const calculateRecommendation = () => {
    let llcScore = 0;
    let soleScore = 0;
    let sjsScore = 0;
    let partnershipScore = 0;

    CALCULATOR_QUESTIONS.forEach(question => {
      const selectedValue = answers[question.id];
      const selectedOption = question.options.find(opt => opt.value === selectedValue);
      if (selectedOption) {
        const points = selectedOption.recommendationPoints;
        llcScore += points.llc || 0;
        soleScore += points.sole || 0;
        sjsScore += points.simplifiedJointStock || 0;
        partnershipScore += points.partnership || 0;
      }
    });

    setScores({
      llc: llcScore,
      sole: soleScore,
      simplifiedJointStock: sjsScore,
      partnership: partnershipScore
    });
    setShowResult(true);
  };

  // Professional bilingual mapping of questions and descriptions
  const getTranslatedQuestion = () => {
    const rawQ = CALCULATOR_QUESTIONS[currentStep];
    if (language === 'ar') return rawQ;

    switch (rawQ.id) {
      case 'partners-count':
        return {
          id: 'partners-count',
          text: 'How many partners do you expect in your startup project?',
          description: 'The number of partners determines the spectrum of suitable legal entities and shareholder responsibilities.',
          options: [
            {
              label: 'Just myself (Solo founder)',
              value: 'solo',
              description: 'An entrepreneur setting up and running operations completely alone in the beginning.'
            },
            {
              label: '2 to 5 partners',
              value: 'few',
              description: 'A close-knit team contributing their efforts and capital equally or in set ratios.'
            },
            {
              label: 'More than 5 partners or looking for institutional investors',
              value: 'many',
              description: 'Broad partnerships accompanied by a desire to accommodate future rapid expansion.'
            }
          ]
        };
      case 'initial-capital':
        return {
          id: 'initial-capital',
          text: 'What is the size of the initial capital available for establishment?',
          description: 'Some entities impose formal requirements or operating expenses and auditors that might not suit a very limited capital.',
          options: [
            {
              label: 'Very limited (Less than SAR 20,000)',
              value: 'low',
              description: 'I want to minimize annual setup fees and operate with the lowest inevitable legal operating cost.'
            },
            {
              label: 'Medium (SAR 20,000 to SAR 150,000)',
              value: 'medium',
              description: 'A capital that allows paying initial costs and committing to simple governance rules and an auditor.'
            },
            {
              label: 'Large (More than SAR 150,000 and expandable)',
              value: 'high',
              description: 'Ready for advanced technical and legal requirements to configure a solid entity to attract funding and scale.'
            }
          ]
        };
      case 'liability-protection':
        return {
          id: 'liability-protection',
          text: 'How important is separating your personal assets from the company liabilities?',
          description: 'This fundamental legal difference is the safety valve for your personal assets in case the company faces distress or debt.',
          options: [
            {
              label: 'I want complete and absolute separation (Maximum personal asset protection)',
              value: 'absolute',
              description: 'My personal money, home, or vehicle must not be pursued for the company debts and liabilities.'
            },
            {
              label: 'I can accept unlimited personal liability in exchange for easier and cheaper setup',
              value: 'negotiable',
              description: 'My project is extremely low risk, and I do not expect massive debt in the medium term. Speed is key.'
            }
          ]
        };
      case 'funding-plans':
        return {
          id: 'funding-plans',
          text: 'What is your strategy for funding the project and bringing in future investors?',
          description: 'Investment funds and venture capitals require flexible mechanisms to distribute shares and modify corporate structure.',
          options: [
            {
              label: 'Planning to scale via venture capital funds, angel investors, and option pools',
              value: 'venture',
              description: 'We intend on raising multiple funding rounds, issuing preferred shares, and transferring equity with high flexibility.'
            },
            {
              label: 'Self-funding, familiar bank loans, or direct partners',
              value: 'bootstrap',
              description: 'Growth will be organic and complete control remains with the primary partners without complex stock trading.'
            }
          ]
        };
      default:
        return rawQ;
    }
  };

  const getBestResult = () => {
    const list = [
      { 
        key: 'simplifiedJointStock', 
        name: language === 'ar' ? 'شركة مساهمة مبسطة' : t('calc.simplifiedTitle'), 
        pct: scores.simplifiedJointStock, 
        desc: language === 'ar' ? 'الخيار الرقمي الأمثل للمشاريع الابتكارية ذات الشركاء المتعددين والبحث عن استثمارات جريئة.' : t('calc.simplifiedDesc')
      },
      { 
        key: 'llc', 
        name: language === 'ar' ? 'شركة ذات مسؤولية محدودة' : t('calc.llcTitle'), 
        pct: scores.llc, 
        desc: language === 'ar' ? 'الدرع الكلاسيكي الأكثر أماناً وحماية للذمة المالية والمفضل للشراكات التجارية الممثلة للجهود المشتركة.' : t('calc.llcDesc')
      },
      { 
        key: 'sole', 
        name: language === 'ar' ? 'مؤسسة فردية' : t('calc.soleTitle'), 
        pct: scores.sole, 
        desc: language === 'ar' ? 'سرعة قياسية وإجراءات تشغيلية في غاية البساطة ومنخفضة التكاليف لرواد الأعمال المنفردين الذين لا يواجهون مخاطر ديون عالية.' : t('calc.soleDesc')
      }
    ];

    return list.sort((a, b) => b.pct - a.pct)[0];
  };

  const getProgressPercent = () => {
    return Math.round(((currentStep) / CALCULATOR_QUESTIONS.length) * 100);
  };

  const topResult = getBestResult();
  const currentQuestion = getTranslatedQuestion();
  const isOptionSelected = answers[currentQuestion.id] !== undefined;

  return (
    <section id="calculator" className="py-24 bg-brand-dark text-white relative overflow-hidden">
      
      {/* Background radial gold glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-gold/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <ScrollReveal>
          {/* Section Heading */}
          <div className="text-center mb-12 space-y-3">
            <div className="inline-flex items-center space-x-1 space-x-reverse bg-brand-gold/15 border border-brand-gold/30 px-3 py-1 rounded-full text-brand-gold text-xs font-bold font-sans">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'نظام الشركات الجديد لعام ٢٠٢٦' : 'New Saudi Companies Law (2026 Compliant)'}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight font-sans">
              {t('calc.title')}
            </h2>
            <p className="text-sm md:text-base text-gray-300 font-tajawal max-w-xl mx-auto">
              {t('calc.desc')}
            </p>
            <div className="w-16 h-0.5 bg-brand-gold mx-auto rounded-full" />
          </div>
        </ScrollReveal>

        {/* Wizard Main Container */}
        <div className={`bg-brand-blue/40 border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-md ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
          
          {!showResult ? (
            /* WIZARD QUESTIONS MODE */
            <div className="space-y-6">
              
              {/* Steps Indicator Progress */}
              <div className="flex items-center justify-between text-xs text-gray-400 font-tajawal pb-4 border-b border-white/10">
                <span className="font-semibold text-brand-gold font-sans">
                  {language === 'ar' 
                    ? `السؤال ${currentStep + 1} من ${CALCULATOR_QUESTIONS.length}`
                    : `Question ${currentStep + 1} of ${CALCULATOR_QUESTIONS.length}`}
                </span>
                <span className="font-mono">{getProgressPercent()}% {language === 'ar' ? 'تم تعبئته' : 'Completed'}</span>
              </div>

              {/* Progress Line */}
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-brand-gold h-full transition-all duration-500 ease-out" 
                  style={{ width: `${getProgressPercent()}%` }}
                />
              </div>

              {/* Question text block */}
              <div className="space-y-2">
                <h3 className="text-xl md:text-2xl font-bold font-sans text-brand-lightgold leading-snug">
                  {currentQuestion.text}
                </h3>
                <p className="text-sm text-gray-400 font-tajawal">
                  {currentQuestion.description}
                </p>
              </div>

              {/* Option Cards */}
              <div className="grid grid-cols-1 gap-4 pt-2">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = answers[currentQuestion.id] === option.value;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectOption(currentQuestion.id, option.value)}
                      className={`p-5 rounded-2xl border text-right cursor-pointer transition-all duration-300 relative flex flex-col md:flex-row items-start md:items-center justify-between ${
                        isSelected 
                          ? 'bg-brand-gold/15 border-brand-gold text-white shadow-lg shadow-brand-gold/5 scale-[1.01]' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-200'
                      }`}
                    >
                      <div className={`space-y-1 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        <p className="font-bold text-sm md:text-base font-sans leading-snug">
                          {option.label}
                        </p>
                        <p className="text-xs text-gray-400 font-tajawal">
                          {option.description}
                        </p>
                      </div>
                      
                      {/* Check radio visual */}
                      <div className={`mt-3 md:mt-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'border-brand-gold bg-brand-gold' : 'border-white/20'
                      }`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-brand-dark" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Steps Controls buttons */}
              <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer ${
                    currentStep === 0 
                      ? 'opacity-40 cursor-not-allowed text-gray-500' 
                      : 'hover:bg-white/10 text-white'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>{language === 'ar' ? 'السابق' : 'Previous'}</span>
                </button>

                <button
                  onClick={nextStep}
                  disabled={!isOptionSelected}
                  className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer ${
                    isOptionSelected 
                      ? 'bg-brand-gold text-brand-dark hover:bg-yellow-500 shadow-md' 
                      : 'bg-white/10 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span>{currentStep === CALCULATOR_QUESTIONS.length - 1 ? (language === 'ar' ? 'النتيجة والتوصية' : 'View recommendation') : (language === 'ar' ? 'التالي' : 'Next')}</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : (
            /* WIZARD RESULTS DISPLAY */
            <div className="space-y-6 animate-scaleIn">
              
              <div className="text-center space-y-2 pb-6 border-b border-white/10">
                <div className="inline-block p-4 bg-brand-gold/10 rounded-full border border-brand-gold/20 mb-2">
                  <FileCheck className="w-10 h-10 text-brand-gold" />
                </div>
                <h3 className="text-2xl font-bold font-sans text-brand-lightgold">
                  {t('calc.yourResults')}
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-2">
                
                {/* Result recommendation */}
                <div className="lg:col-span-7 space-y-4">
                  <p className="text-xs font-bold text-brand-gold tracking-widest uppercase font-sans">
                    {t('calc.recommendedEntity')}
                  </p>
                  <h4 className="text-2xl md:text-3xl font-extrabold text-white font-sans leading-none flex items-center space-x-2 space-x-reverse">
                    <span>{topResult.name}</span>
                  </h4>
                  
                  <p className="text-sm md:text-base text-gray-300 leading-relaxed font-tajawal">
                    {topResult.desc}
                  </p>

                  <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3 font-tajawal text-xs sm:text-sm">
                    <p className="font-bold text-brand-lightgold font-sans">{t('calc.entityExplanation')}</p>
                    <ul className="space-y-2 text-gray-400 list-disc list-inside leading-relaxed">
                      {topResult.key === 'simplifiedJointStock' ? (
                        <>
                          <li>{language === 'ar' ? 'هيكل ممتاز لتوزيع خيارات الأسهم للموظفين والمساهمين الجدد.' : 'Excellent structure for distributing stock options to new employees and shareholders.'}</li>
                          <li>{language === 'ar' ? 'يعطي مرونة بالغة في تنظيم فئات الأسهم (أسهم ممتازة، عادية، إلخ).' : 'Gives high flexibility in structuring share categories (preferred, common, etc.).'}</li>
                        </>
                      ) : topResult.key === 'llc' ? (
                        <>
                          <li>{language === 'ar' ? 'تحديد دقيق للمسؤوليات المالية بقدر مساهمة كل شريك برأس المال.' : 'Accurate determination of financial liabilities limited to each partner’s contribution.'}</li>
                          <li>{language === 'ar' ? 'إجراءات تشغيلية مستقرة ومتماشية مع المتطلبات البلدية والتجارية الكلاسيكية.' : 'Stable operating procedures aligned with classic municipal and commercial requirements.'}</li>
                        </>
                      ) : (
                        <>
                          <li>{language === 'ar' ? 'تأسيس فوري وسهل دون تطلب رأس مال مرتفع أو مراجعة معقدة.' : 'Immediate and easy setup without demanding high capital or complex audits.'}</li>
                          <li>{language === 'ar' ? 'مناسب كخطوة تجريبية أولى للمشروعات الفردية المعفاة من المخاطر.' : 'Suitable as a first testing phase for individual risk-exempt projects.'}</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Score meters */}
                <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-brand-gold uppercase tracking-wider font-sans">
                      {t('calc.otherEntities')}
                    </p>

                    <div className="space-y-4">
                      
                      {/* LLC */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span>{language === 'ar' ? 'شركة ذات مسؤولية محدودة' : 'Limited Liability Co.'}</span>
                          <span className="font-mono text-brand-gold">{Math.min(100, Math.round(scores.llc * 1.5))}%</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-brand-gold h-full" style={{ width: `${Math.min(100, Math.round(scores.llc * 1.5))}%` }} />
                        </div>
                      </div>

                      {/* Simplified Joint Stock */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span>{language === 'ar' ? 'شركة مساهمة مبسطة' : 'Simplified Joint Stock'}</span>
                          <span className="font-mono text-brand-gold">{Math.min(100, Math.round(scores.simplifiedJointStock * 1.5))}%</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-brand-gold h-full" style={{ width: `${Math.min(100, Math.round(scores.simplifiedJointStock * 1.5))}%` }} />
                        </div>
                      </div>

                      {/* Sole */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span>{language === 'ar' ? 'مؤسسة فردية' : 'Sole Proprietorship'}</span>
                          <span className="font-mono text-brand-gold">{Math.min(100, Math.round(scores.sole * 1.5))}%</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-brand-gold h-full" style={{ width: `${Math.min(100, Math.round(scores.sole * 1.5))}%` }} />
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 text-[11px] text-gray-400 font-tajawal leading-relaxed">
                    {language === 'ar' 
                      ? '* تم احتساب النتائج ديناميكياً بما يتوافق مع مصفوفة الوعي الوقائي للشركة.'
                      : '* Fit indices calculated dynamically based on the company’s structural compliance database.'}
                  </div>
                </div>

              </div>

              {/* Result controls */}
              <div className="pt-6 border-t border-white/10 flex flex-wrap gap-3 justify-end">
                <button
                  onClick={resetCalculator}
                  className="px-5 py-3 border border-white/20 hover:border-white/40 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer text-gray-300 hover:text-white"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t('calc.startAgain')}</span>
                </button>

                <button
                  onClick={() => {
                    onPreSelectService(topResult.name);
                    const contactSection = document.getElementById('contact');
                    if (contactSection) {
                      contactSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="px-6 py-3 bg-brand-gold hover:bg-yellow-500 text-brand-dark rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer"
                >
                  <ArrowLeftSquare className="w-4 h-4" />
                  <span>{language === 'ar' ? 'احجز استشارة لتأسيس هذا الكيان' : 'Book Setup Consultation'}</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </section>
  );
}
