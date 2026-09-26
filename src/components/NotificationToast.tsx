import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function NotificationToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Omit<ToastMessage, 'id'>>;
      if (!customEvent.detail) return;
      
      const newToast: ToastMessage = {
        id: Math.random().toString(36).substring(2, 9),
        message: customEvent.detail.message,
        type: customEvent.detail.type || 'success'
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 5000);
    };

    window.addEventListener('app-toast', handleToastEvent);
    return () => window.removeEventListener('app-toast', handleToastEvent);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3 min-w-[280px] max-w-[380px] pointer-events-none font-tajawal text-right" dir="rtl">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: -40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border bg-white/95 backdrop-blur-md ${
              toast.type === 'success' 
              ? 'border-emerald-200/80 bg-emerald-50/95 text-emerald-950 shadow-emerald-500/5' 
              : toast.type === 'error'
              ? 'border-rose-200/80 bg-rose-50/95 text-rose-950 shadow-rose-500/5'
              : 'border-blue-200/80 bg-blue-50/95 text-blue-950 shadow-blue-500/5'
            }`}
          >
            {/* Elegant Green Checkmark with Path Length Drawing Animation */}
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' ? (
                <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300">
                  <motion.svg
                    className="w-3.5 h-3.5 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
                      d="M20 6L9 17l-5-5"
                    />
                  </motion.svg>
                </div>
              ) : (
                <div className={`relative flex items-center justify-center w-6 h-6 rounded-full ${toast.type === 'error' ? 'bg-rose-100 border border-rose-300 text-rose-600' : 'bg-blue-100 border border-blue-300 text-blue-600'}`}>
                  <Info className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <div className="flex-grow text-xs sm:text-sm font-semibold leading-relaxed">
              {toast.message}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-0.5 hover:bg-black/5 rounded-lg transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Global utility helper to trigger toast
export function triggerToast(message: string, type: 'success' | 'info' | 'error' = 'success') {
  const event = new CustomEvent('app-toast', { detail: { message, type } });
  window.dispatchEvent(event);
}
