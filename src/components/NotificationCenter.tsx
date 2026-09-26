import { useState, useEffect, useRef, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Check, 
  Trash2, 
  Info, 
  Calendar, 
  AlertCircle, 
  ShieldCheck, 
  Clock,
  CheckCheck
} from 'lucide-react';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification
} from '../lib/notificationStore';
import { AppNotification } from '../types';
import { useLanguage } from '../lib/LanguageContext';

export default function NotificationCenter() {
  const { language, dir } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    setNotifications(getNotifications());
  };

  useEffect(() => {
    loadNotifications();

    const handleUpdate = () => {
      loadNotifications();
    };

    window.addEventListener('app-notification-update', handleUpdate);
    return () => {
      window.removeEventListener('app-notification-update', handleUpdate);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    // Using standard EventListener for document click
    document.addEventListener('mousedown', handleClickOutside as any);
    return () => document.removeEventListener('mousedown', handleClickOutside as any);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkRead = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    markAsRead(id);
  };

  const handleDelete = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const formatNotificationTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) {
        return language === 'ar' ? 'قبل قليل' : 'Just now';
      }
      if (diffMins < 60) {
        return language === 'ar' ? `قبل ${diffMins} دقيقة` : `${diffMins}m ago`;
      }
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) {
        return language === 'ar' ? `قبل ${diffHours} ساعة` : `${diffHours}h ago`;
      }

      return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric'
      }) + ' ' + date.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'welcome':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'confirmation':
        return <Calendar className="w-4 h-4 text-brand-gold" />;
      case 'reminder':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'system':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationBg = (type: AppNotification['type'], isRead: boolean) => {
    if (isRead) return 'bg-white hover:bg-gray-50';
    switch (type) {
      case 'welcome':
        return 'bg-emerald-50/60 hover:bg-emerald-50 border-r-4 border-emerald-500';
      case 'confirmation':
        return 'bg-yellow-50/60 hover:bg-yellow-50 border-r-4 border-brand-gold';
      case 'reminder':
        return 'bg-amber-50/60 hover:bg-amber-50 border-r-4 border-amber-500';
      case 'system':
        return 'bg-blue-50/60 hover:bg-blue-50 border-r-4 border-blue-500';
      default:
        return 'bg-gray-50 hover:bg-gray-100 border-r-4 border-gray-400';
    }
  };

  return (
    <div ref={dropdownRef} className="relative z-50">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-brand-gold bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all cursor-pointer flex items-center justify-center"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <Bell className="w-4 h-4 text-brand-gold animate-bounce" />
        ) : (
          <Bell className="w-4 h-4" />
        )}

        {/* Pulsing Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`absolute top-12 ${dir === 'rtl' ? 'left-0 sm:-left-4' : 'right-0 sm:-right-4'} w-[320px] sm:w-[380px] bg-white text-gray-800 rounded-2xl shadow-2xl border border-gray-100 overflow-hidden text-right`}
            dir={dir}
          >
            {/* Header */}
            <div className="p-4 bg-brand-blue text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center space-x-1.5 space-x-reverse">
                <Bell className="w-4 h-4 text-brand-gold" />
                <h4 className="font-bold text-sm font-sans">
                  {language === 'ar' ? 'مركز التنبيهات والوعي' : 'Advisory Notification Center'}
                </h4>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-brand-lightgold hover:text-white flex items-center space-x-1 space-x-reverse cursor-pointer transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}</span>
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[340px] overflow-y-auto divide-y divide-gray-100 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <div className="p-3 bg-gray-50 rounded-full w-fit mx-auto text-gray-400">
                    <Bell className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-gray-500 font-tajawal font-medium">
                    {language === 'ar' ? 'لا توجد تنبيهات نشطة حالياً' : 'No active notifications yet.'}
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={(e) => !n.isRead && handleMarkRead(n.id, e)}
                    className={`p-4 transition-all duration-200 cursor-pointer relative group flex gap-3 ${getNotificationBg(n.type, n.isRead)}`}
                  >
                    {/* Visual Status Indicator Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`p-1.5 rounded-lg ${n.isRead ? 'bg-gray-100 text-gray-500' : 'bg-white border shadow-sm'}`}>
                        {getNotificationIcon(n.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-grow space-y-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h5 className={`text-xs font-bold font-sans truncate ${n.isRead ? 'text-gray-600' : 'text-brand-blue'}`}>
                          {n.title}
                        </h5>
                        <span className="text-[9px] text-gray-400 font-mono flex-shrink-0">
                          {formatNotificationTime(n.time)}
                        </span>
                      </div>
                      <p className={`text-[11px] leading-relaxed font-tajawal break-words ${n.isRead ? 'text-gray-400' : 'text-gray-600'}`}>
                        {n.message}
                      </p>
                    </div>

                    {/* Quick Action Overlay (Delete / Mark Read) */}
                    <div className="absolute top-2 left-2 flex items-center space-x-1 space-x-reverse opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 pl-1 rounded-md py-0.5">
                      {!n.isRead && (
                        <button
                          onClick={(e) => handleMarkRead(n.id, e)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title={language === 'ar' ? 'تعيين كمقروء' : 'Mark as read'}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(n.id, e)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title={language === 'ar' ? 'حذف التنبيه' : 'Delete notification'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-400 font-tajawal flex items-center justify-center space-x-1 space-x-reverse">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-gold" />
                <span>{language === 'ar' ? 'نظام الحماية المشفر والامتثال المعتمد' : 'Secured and Certified Advisory Protocol'}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
