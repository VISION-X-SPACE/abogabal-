/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2, Scale, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatMessage {
  id?: number;
  role: 'user' | 'model';
  text: string;
  createdAt?: string;
}

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested pre-loaded prompts
  const PRESET_QUESTIONS = [
    "كيف أصوغ عقد إيجار عقاري في بريطانيا؟",
    "ما شروط صحة صك الملكية الاستثماري؟",
    "لدي نزاع مالي مع مطور عقاري، ما الحل؟",
  ];

  // Initialize unique session ID
  useEffect(() => {
    let sesId = sessionStorage.getItem('abujabal_chat_session');
    if (!sesId) {
      sesId = `session_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('abujabal_chat_session', sesId);
    }
    setSessionId(sesId);

    // Initial greeting in Arabic
    setMessages([
      {
        role: 'model',
        text: 'مرحباً بك في خدمة الدعم الفوري لمكتب أبو جبل للاستشارات القانونية العقارية. أنا مساعدك الرقمي المدعوم بالذكاء الاصطناعي لمعالجة استفسارات المشاريع العقارية والوقاية القانونية في بريطانيا والشرق الأوسط. كيف يمكنني مساعدتك اليوم؟'
      }
    ]);
  }, []);

  // Fetch chat history from DB if exists
  useEffect(() => {
    if (sessionId) {
      fetch(`/api/chat/history/${sessionId}`)
        .then(res => {
          if (res.ok) return res.json();
          return [];
        })
        .then(data => {
          if (data && data.length > 0) {
            setMessages(data);
          }
        })
        .catch(err => console.error("History fetch error:", err));
    }
  }, [sessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          message: textToSend,
          uid: null // Direct guest support
        })
      });

      if (!res.ok) {
        throw new Error();
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [
        ...prev, 
        { 
          role: 'model', 
          text: 'عذراً، أواجه صعوبة في الاتصال بالخادم الرئيسي في الوقت الحالي. برجاء التحقق من الإنترنت وإعادة المحاولة.' 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setHasNewMessage(false);
  };

  return (
    <div id="live-chat-widget-root" className="fixed bottom-6 right-6 z-50 font-tajawal">
      
      {/* Floating Chat Button */}
      <button
        onClick={toggleChat}
        className="w-14 h-14 bg-gradient-to-l from-brand-gold to-yellow-600 rounded-full flex items-center justify-center text-brand-dark shadow-xl hover:scale-105 active:scale-95 transition-all relative cursor-pointer group"
        aria-label="افتتاح المحادثة الفورية"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
        
        {/* Real-time status pulse indicating service is online */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
      </button>

      {/* Chat Windows Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-80 md:w-96 h-[510px] bg-brand-blue border border-brand-gold/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-right"
          >
            {/* Header */}
            <div className="bg-brand-blue p-4 border-b border-brand-gold/15 flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="p-2 bg-brand-gold/15 rounded-xl border border-brand-gold/20">
                  <Scale className="w-5 h-5 text-brand-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white font-sans leading-none">مستشار أبو جبل الفوري</h3>
                  <div className="flex items-center space-x-1 space-x-reverse mt-1 text-[10px] text-emerald-400">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    <span>متصل وبحالة ذكاء وقائي</span>
                  </div>
                </div>
              </div>
              
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#0a1420]">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col max-w-[85%] ${
                    msg.role === 'user' ? 'mr-auto items-start' : 'ml-auto items-end'
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand-gold text-brand-dark rounded-br-none text-left'
                        : 'bg-brand-blue/90 text-white border border-brand-gold/10 rounded-bl-none text-right'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex items-center space-x-2 space-x-reverse ml-auto bg-brand-blue/80 border border-brand-gold/10 p-3 rounded-2xl text-xs text-brand-lightgold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-gold" />
                  <span>المستشار القانوني يبحث قضيتك...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions / Preset legal prompts */}
            {messages.length === 1 && !loading && (
              <div className="p-3 bg-brand-blue/70 border-t border-brand-gold/10 space-y-2">
                <p className="text-[10px] text-brand-gold font-bold flex items-center space-x-1 space-x-reverse">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>اضغط لطرح أحد المستمسكات الشائعة:</span>
                </p>
                <div className="flex flex-col gap-1.5">
                  {PRESET_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="text-right text-[11px] text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-all truncate"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message input panel */}
            <div className="p-3 bg-brand-blue border-t border-brand-gold/10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(inputValue);
                }}
                className="flex items-center space-x-2 space-x-reverse"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="اكتب استشارتك العقارية بخصوص الصك الملكي..."
                  className="flex-1 bg-[#0a1420] border border-brand-gold/25 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-gold text-right"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || loading}
                  className="p-2.5 bg-brand-gold hover:bg-brand-gold/90 text-brand-dark rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
