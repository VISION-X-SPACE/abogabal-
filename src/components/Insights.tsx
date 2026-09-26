/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  BookOpen, 
  User, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  ChevronLeft, 
  Bookmark,
  Share2,
  X
} from 'lucide-react';
import { ARTICLES_DATA } from '../data';
import { Article } from '../types';
import { triggerToast } from './NotificationToast';

export default function Insights() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  const categories = [
    { key: 'all', label: 'كافة المقالات والدراسات' },
    { key: 'تطوير عقاري', label: 'تطوير عقاري وأصول' },
    { key: 'شركات ناشئة', label: 'حوكمة وتأسيس الشركات' },
    { key: 'قوانين وأنظمة', label: 'تحليلات الأنظمة واللوائح' }
  ];

  const filteredArticles = selectedCategory === 'all' 
    ? ARTICLES_DATA 
    : ARTICLES_DATA.filter(art => art.category === selectedCategory);

  const handleShare = (title: string) => {
    // Elegant toast or clip check
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${title} - أبو جبل للاستشارات القانونية`);
      triggerToast('تم نسخ عنوان المقال وتفاصيله لمشاركتها مع فريقك بنجاح! 📋', 'success');
    }
  };

  return (
    <section id="insights" className="py-24 bg-brand-blue/5 border-t border-brand-blue/15 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <p className="text-xs font-bold text-brand-gold tracking-widest uppercase font-sans">
            المنصة المعرفية والوعي القانوني العقاري
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-brand-blue">
            أوراق قانونية ودراسات عقارية تفصيلية
          </h2>
          <p className="text-sm md:text-base text-gray-500 font-tajawal max-w-xl mx-auto">
            مساحة تخصصية تهدف لنشر الوعي الوقائي وصيانة الاستثمارات لرواد الأعمال والمستثمرين، لتمكين اتخاذ القرار بوعي رصين وأمان.
          </p>
          <div className="w-16 h-0.5 bg-brand-gold mx-auto rounded-full" />
        </div>

        {/* Filter Categories Tabs */}
        <div className="flex flex-wrap justify-center mb-12 gap-3" id="insights-filter-tabs">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer border ${
                selectedCategory === cat.key
                  ? 'bg-brand-blue text-white border-brand-blue shadow-md'
                  : 'bg-white border-gray-200 text-brand-blue hover:border-brand-gold hover:text-brand-gold bg-white hover:bg-gray-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Articles Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {filteredArticles.map((article) => (
            <article 
              key={article.id}
              onClick={() => setReadingArticle(article)}
              className="bg-white rounded-3xl border border-gray-150 shadow-sm hover:shadow-lg hover:border-brand-gold/30 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer p-6 group"
            >
              
              <div className="space-y-4 text-right">
                
                {/* Meta header */}
                <div className="flex justify-between items-center text-xs">
                  <span className="bg-brand-gold/10 text-brand-gold px-3 py-1 rounded-full font-bold font-tajawal">
                    {article.category}
                  </span>
                  <div className="flex items-center space-x-1.5 space-x-reverse text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-tajawal">{article.readTime}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-brand-blue font-sans group-hover:text-brand-gold transition-colors leading-snug">
                  {article.title}
                </h3>
                
                <p className="text-gray-500 text-xs md:text-sm line-clamp-3 leading-relaxed font-tajawal">
                  {article.introduction}
                </p>

              </div>

              {/* Author & Bottom CTA */}
              <div className="pt-6 border-t border-gray-100 mt-6 flex justify-between items-center">
                
                <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-400">
                  <User className="w-3.5 h-3.5 text-brand-gold" />
                  <span className="font-tajawal font-medium">{article.author.split(' - ')[0]}</span>
                </div>

                <button 
                  className="flex items-center space-x-1 space-x-reverse text-brand-gold group-hover:text-brand-blue font-bold text-xs font-sans transition-colors"
                  aria-label="قراءة المقال كاملاً"
                >
                  <span>اقرأ المقال</span>
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </button>

              </div>

            </article>
          ))}
        </div>

        {/* FULL ARTICLE MODAL VIEW DRAWER */}
        {readingArticle && (
          <div className="fixed inset-0 bg-brand-dark/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div 
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-10 relative border border-brand-gold/20 shadow-2xl animate-scaleIn text-right space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Floating Top Controls Header inside reader panel */}
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 sticky top-0 bg-white z-10">
                <button
                  onClick={() => setReadingArticle(null)}
                  className="flex items-center space-x-1.5 space-x-reverse px-4 py-2 bg-gray-150 hover:bg-brand-gold hover:text-brand-dark text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>العودة لغرفة المقالات</span>
                </button>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <button 
                    onClick={() => handleShare(readingArticle.title)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-all cursor-pointer"
                    title="مشاركة المقال"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setReadingArticle(null)}
                    className="p-2 bg-gray-100 hover:bg-brand-gold hover:text-brand-dark text-gray-600 rounded-full transition-all cursor-pointer"
                    title="إغلاق"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Editorial Header */}
              <div className="space-y-4">
                
                <div className="flex items-center space-x-3 space-x-reverse text-xs font-bold">
                  <span className="bg-brand-gold text-brand-dark px-3 py-1 rounded-full font-tajawal">
                    {readingArticle.category}
                  </span>
                  <div className="flex items-center space-x-1.5 space-x-reverse text-gray-400 font-tajawal">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>نُشِر في {readingArticle.date}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 space-x-reverse text-gray-400 font-tajawal">
                    <Clock className="w-3.5 h-3.5" />
                    <span>مخصص في: {readingArticle.readTime}</span>
                  </div>
                </div>

                <h1 className="text-2xl md:text-3.5xl font-extrabold text-brand-blue font-sans leading-snug">
                  {readingArticle.title}
                </h1>

                {/* Author profile banner */}
                <div className="flex items-center space-x-3 space-x-reverse p-4 bg-brand-blue/5 rounded-2xl border border-brand-blue/10">
                  <div className="p-2.5 bg-brand-gold text-brand-dark rounded-xl">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold font-sans text-sm text-brand-blue leading-none">
                      كُتِب بواسطة: {readingArticle.author.split(' - ')[0]}
                    </p>
                    <p className="text-xs text-brand-gold font-tajawal mt-1 font-semibold">
                      {readingArticle.author.split(' - ')[1]}
                    </p>
                  </div>
                </div>

              </div>

              {/* Detailed Text Articles Segment (Strictly NO TABLES in compliance with user request) */}
              <div className="space-y-6 pt-4 border-t border-gray-100 font-tajawal leading-relaxed text-gray-700 md:text-lg">
                
                {/* Introduction styling */}
                <p className="font-bold text-brand-blue text-lg md:text-xl border-r-4 border-brand-gold pr-4 leading-relaxed font-tajawal">
                  {readingArticle.introduction}
                </p>

                {/* Paragraph elements */}
                {readingArticle.paragraphs.map((p, index) => (
                  <p key={index} className="text-gray-600 text-sm md:text-base text-justify whitespace-pre-line leading-loose">
                    {p}
                  </p>
                ))}

              </div>

              {/* Reading footer signature */}
              <div className="pt-8 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-tajawal flex-wrap gap-4">
                <span>© حقوق النشر محفوظة لمؤسسة {readingArticle.author.split(' - ')[0]}، {new Date().getFullYear()}</span>
                <span className="font-bold text-brand-gold">مستوفى للشروط والاستحقاق الوقائي العام</span>
              </div>

            </div>
          </div>
        )}

      </div>
    </section>
  );
}
