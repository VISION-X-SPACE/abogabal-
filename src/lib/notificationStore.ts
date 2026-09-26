import { AppNotification } from '../types';

const STORAGE_KEY = 'abujabal_notifications';

export function getNotifications(): AppNotification[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    // Return default welcome notifications in Arabic and English
    const defaults: AppNotification[] = [
      {
        id: 'default-welcome-ar',
        title: 'مرحباً بك في مكتب أبو جبل للاستشارات ⚖️',
        message: 'نسعد بزيارتك لمنصتنا الرقمية الآمنة. نلتزم بتقديم المشورة القانونية الوقائية وحماية أعمالك وعقاراتك بأعلى درجات السرية والامتثال.',
        time: new Date(Date.now() - 60000 * 5).toISOString(), // 5 mins ago
        isRead: false,
        type: 'welcome'
      },
      {
        id: 'default-welcome-en',
        title: 'Welcome to Abu Jabal Advisory Platform ⚖️',
        message: 'We are pleased to welcome you to our secure digital platform. We commit to delivering preventative legal counsel and safeguarding your corporate and real estate assets.',
        time: new Date(Date.now() - 60000 * 5).toISOString(), // 5 mins ago
        isRead: false,
        type: 'welcome'
      },
      {
        id: 'default-system-ar',
        title: 'نظام غمد الفولاذ الوقائي نشط 🔒',
        message: 'تم تفعيل بروتوكول حماية وتشفير المستندات AES-256 تلقائياً لبوابة تبادل الصكوك والملفات وعقود التأسيس.',
        time: new Date(Date.now() - 60000 * 15).toISOString(), // 15 mins ago
        isRead: false,
        type: 'system'
      },
      {
        id: 'default-system-en',
        title: 'Preemptive Steel Shield Activated 🔒',
        message: 'AES-256 document protection and encryption protocols have been automatically enabled for all deed, contract, and document exchanges.',
        time: new Date(Date.now() - 60000 * 15).toISOString(), // 15 mins ago
        isRead: false,
        type: 'system'
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export function saveNotifications(notifications: AppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new CustomEvent('app-notification-update'));
}

export function addNotification(title: string, message: string, type: AppNotification['type']) {
  const notifications = getNotifications();
  const newNotification: AppNotification = {
    id: Math.random().toString(36).substring(2, 9),
    title,
    message,
    time: new Date().toISOString(),
    isRead: false,
    type
  };
  notifications.unshift(newNotification);
  saveNotifications(notifications);
}

export function markAsRead(id: string) {
  const notifications = getNotifications();
  const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
  saveNotifications(updated);
}

export function markAllAsRead() {
  const notifications = getNotifications();
  const updated = notifications.map(n => ({ ...n, isRead: true }));
  saveNotifications(updated);
}

export function deleteNotification(id: string) {
  const notifications = getNotifications();
  const filtered = notifications.filter(n => n.id !== id);
  saveNotifications(filtered);
}
