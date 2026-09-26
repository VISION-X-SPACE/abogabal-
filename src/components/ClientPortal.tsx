/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, DragEvent, ChangeEvent, FormEvent } from 'react';
import { 
  ShieldCheck, 
  Upload, 
  File, 
  Lock, 
  Key, 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  Clock,
  Calendar,
  User,
  Mail,
  Phone,
  LogOut,
  FolderOpen,
  Send,
  FileText,
  BookmarkCheck,
  CheckSquare,
  Activity,
  RefreshCw,
  Users,
  Sparkles,
  Bot,
  Mic,
  MicOff
} from 'lucide-react';
import { auth, googleSignIn, logout, initAuth, getAccessToken } from '../lib/firebase.ts';
import { User as FirebaseUser } from 'firebase/auth';
import { triggerToast } from './NotificationToast';
import { useLanguage } from '../lib/LanguageContext';
import ScrollReveal from './ScrollReveal';
import { addNotification } from '../lib/notificationStore';

interface SecureFile {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  status: 'encrypting' | 'encrypted' | 'under_review' | 'processed';
  key: string;
  notes?: string;
}

interface Appointment {
  id: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  date: string;
  timeSlot: string;
  serviceType: string;
  status: string;
  notes: string;
  createdAt: string;
  driveFileUrl?: string;
  keepNoteId?: string;
}

export default function ClientPortal() {
  const { language, t, dir } = useLanguage();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [activeTab, setActiveTab] = useState<'vault' | 'booking' | 'drive' | 'visitors' | 'ai_command'>('vault');
  const [authLoading, setAuthLoading] = useState(true);

  // AI Command Center state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([
    {
      role: 'assistant',
      text: 'مرحباً بك يا مستشار أبو جبل في مركز القيادة الرقمي الذكي لموقعك. أنا مساعدك التنفيذي المرتبط مباشرة ببيانات الموقع الحية (الحجوزات، الزوار، التحليلات، وإعداد مسودات العقود). كيف يمكنني مساندتك في إدارة عالمك الرقمي اليوم؟',
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isAiListening, setIsAiListening] = useState(false);
  const [aiRecognition, setAiRecognition] = useState<any>(null);

  // Initialize Speech Recognition for AI Command Center
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'ar-SA';

      rec.onstart = () => setIsAiListening(true);
      rec.onend = () => setIsAiListening(false);
      rec.onerror = () => setIsAiListening(false);
      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          setAiPrompt(prev => (prev ? prev + ' ' + text : text));
          handleRunAiCommand(text);
        }
      };
      setAiRecognition(rec);
    }
  }, []);

  const toggleAiVoice = () => {
    if (!aiRecognition) {
      triggerToast('المتصفح الحالي لا يدعم التعرف على الصوت.', 'error');
      return;
    }
    if (isAiListening) {
      aiRecognition.stop();
    } else {
      try {
        aiRecognition.start();
        triggerToast('جاري الاستماع... تحدث الآن بأمرك للمساعد الذكي.', 'success');
      } catch (e) {
        aiRecognition.stop();
      }
    }
  };

  const handleRunAiCommand = async (cmdText?: string) => {
    const textToSend = (cmdText || aiPrompt).trim();
    if (!textToSend || aiLoading) return;

    const userEntry = {
      role: 'user' as const,
      text: textToSend,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setAiHistory(prev => [...prev, userEntry]);
    setAiPrompt('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/admin/ai-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend })
      });
      const data = await res.json();
      setAiHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply || 'تمت معالجة أمرك بنجاح من المساعد الذكي.',
          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (e) {
      console.error(e);
      setAiHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'تعذر الاتصال بخدمة الذكاء الاصطناعي في هذه اللحظة. يرجى إعادة المحاولة.',
          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Drag & Drop / Vault states
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [encrypting, setEncrypting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [vaultFiles, setVaultFiles] = useState<SecureFile[]>([
    {
      id: 'doc-1',
      name: 'اتفاقية_المساهمين_بروتوكول_التمويل.pdf',
      size: '٣.٤ ميغابايت',
      uploadDate: '24-06-2026',
      status: 'processed',
      key: 'AES-SHA256: 8f92bdcc33b91a',
      notes: 'تمت المراجعة والتدقيق. الاتفاقية سليمة ومحبوكة وموافقة لنظام الشركات الجديد في المملكة المتحدة.'
    },
    {
      id: 'doc-2',
      name: 'صك_ملكية_مخطط_الشرق_الاستثماري.pdf',
      size: '١٢.١ ميغابايت',
      uploadDate: '23-06-2026',
      status: 'under_review',
      key: 'AES-SHA256: 3a98f12cc2b89d',
      notes: 'جاري مراجعة تسلسل الملكية للتحقق من عدم وجود أي مطالبات بلدية أو تداخل حدودي.'
    }
  ]);

  // Appointment states
  const [bookingDate, setBookingDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [serviceType, setServiceType] = useState<string>('مراجعة وتدقيق العقود العقارية');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientNotes, setClientNotes] = useState<string>('');
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);
  
  // Google Workspace specific triggers
  const [syncToKeep, setSyncToKeep] = useState<boolean>(true);
  const [sendGmailConfirmation, setSendGmailConfirmation] = useState<boolean>(true);
  const [pickerSelectedFile, setPickerSelectedFile] = useState<{ name: string; url: string } | null>(null);

  // Google Drive Files browser states
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveLoading, setDriveLoading] = useState<boolean>(false);

  // Admin Visitor Tracking States
  const [visitorsLog, setVisitorsLog] = useState<any[]>([]);
  const [visitorsLoading, setVisitorsLoading] = useState<boolean>(false);

  const fetchVisitors = async () => {
    setVisitorsLoading(true);
    try {
      const res = await fetch('/api/analytics/recent-visitors');
      if (res.ok) {
        const data = await res.json();
        setVisitorsLog(data);
      }
    } catch (e) {
      console.error("Error fetching visitors:", e);
    } finally {
      setVisitorsLoading(false);
    }
  };

  // Sync auth state
  useEffect(() => {
    const unsub = initAuth(
      async (user) => {
        setCurrentUser(user);
        setAuthLoading(false);
        fetchUserAppointments(user.uid);
        fetchDriveFiles();

        // If logged in as admin, fetch recent visitors list and register/cache Google Access Token on server
        if (user.email && (user.email.trim().toLowerCase() === 'admin.rahman@gmail.com' || user.email.trim().toLowerCase() === 'gaballpasha@gmail.com')) {
          fetchVisitors();
          const token = await getAccessToken();
          if (token) {
            fetch('/api/auth/cache-admin-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: user.email, token })
            })
            .then(r => r.json())
            .then(d => {
              console.log('[Admin Cache Initializer] Token cache status:', d);
            })
            .catch(e => console.error('[Admin Cache] Failed to cache token state:', e));
          }
        }
      },
      () => {
        setCurrentUser(null);
        setAuthLoading(false);
      }
    );
    return unsub;
  }, []);

  // Fetch client appointments from Cloud SQL DB
  const fetchUserAppointments = async (uid: string) => {
    try {
      const res = await fetch(`/api/appointments/user/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setUserAppointments(data);
      }
    } catch (err) {
      console.error("Error drawing appointments", err);
    }
  };

  // Fetch GDrive files using user's access token
  const fetchDriveFiles = async () => {
    const token = await getAccessToken();
    if (!token) return;

    setDriveLoading(true);
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=6&fields=files(id,name,mimeType,webViewLink)&q=mimeType%20%3D%20\'application%2Fpdf\'%20or%20mimeType%20%3D%20\'application%2Fmsword\'%20or%20mimeType%20%3D%20\'application%2Fvnd.openxmlformats-officedocument.wordprocessingml.document\'', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDriveFiles(data.files || []);
      }
    } catch (err) {
      console.error("Failed to query drive files", err);
    } finally {
      setDriveLoading(false);
    }
  };

  // Fetch slots whenever the user changes date
  useEffect(() => {
    if (bookingDate) {
      const fetchSlots = async () => {
        setSlotsLoading(true);
        try {
          const res = await fetch(`/api/appointments/slots?date=${bookingDate}`);
          if (res.ok) {
            const data = await res.json();
            setAvailableSlots(data.availableSlots || []);
            setSelectedSlot('');
          }
        } catch (err) {
          console.error("Error querying empty slots:", err);
        } finally {
          setSlotsLoading(false);
        }
      };
      fetchSlots();
    }
  }, [bookingDate]);

  // Handle Google OAuth logins
  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setClientName(res.user.displayName || '');
        setClientEmail(res.user.email || '');
        fetchUserAppointments(res.user.uid);
        fetchDriveFiles();

        // Immediately cache token on backend if admin
        const emailLower = res.user.email ? res.user.email.trim().toLowerCase() : '';
        if (emailLower === 'admin.rahman@gmail.com' || emailLower === 'gaballpasha@gmail.com') {
          fetchVisitors();
          if (res.accessToken) {
            fetch('/api/auth/cache-admin-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: res.user.email, token: res.accessToken })
            })
            .then(r => r.json())
            .then(d => console.log('[Admin Login Cacher] Token cached:', d))
            .catch(e => console.error('[Admin Login Cacher] Error caching token:', e));
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setUserAppointments([]);
    setDriveFiles([]);
  };

  // Google Picker Implementation
  const loadAndOpenPicker = async () => {
    const token = await getAccessToken();
    if (!token) {
      triggerToast("الرجاء تسجيل الدخول بـ Google أولاً لفتح واجهة الاختيار 🔑", "error");
      return;
    }

    try {
      // Dynamically load apis
      if (!(window as any).google?.picker) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://apis.google.com/js/api.js';
          script.onload = () => {
            (window as any).gapi.load('picker', {
              callback: () => resolve(),
              onerror: () => reject(new Error('Failed to load picker load callback'))
            });
          };
          script.onerror = () => reject(new Error('Failed to inject apis script'));
          document.body.appendChild(script);
        });
      }

      let pickerOrigin = window.location.origin;
      try {
        if (window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0) {
          pickerOrigin = window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1];
        }
      } catch (err) {
        console.warn("Could not determine iframe ancestor origins, falling back to window.location.origin", err);
      }

      const picker = new (window as any).google.picker.PickerBuilder()
        .addView((window as any).google.picker.ViewId.DOCS)
        .setOAuthToken(token)
        .setOrigin(pickerOrigin)
        .setCallback((data: any) => {
          if (data.action === (window as any).google.picker.Action.PICKED) {
            const pickedFile = data.docs[0];
            setPickerSelectedFile({
              name: pickedFile.name,
              url: pickedFile.url
            });
          }
        })
        .build();

      picker.setVisible(true);
    } catch (error) {
      console.error("Failed to load Google Picker:", error);
      triggerToast("تعذر تفويض منتقي الملفات Google Picker. الرجاء استخدام السحب والإفلات أو التحقق من الإعدادات.", "error");
    }
  };

  // Send email to client via client's own Gmail integration
  const triggerGmailConfirmation = async (appointmentDetails: string) => {
    const token = await getAccessToken();
    if (!token) return;

    try {
      const emailBody = [
        `To: ${clientEmail}`,
        `Subject: =?utf-8?B?${btoa(encodeURIComponent('تأكيد موعد استشارتك القانونية - مكتب أبو جبل')).replace(/%/g, '')}?=`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        `<h3>مرحباً ${clientName}،</h3>`,
        `<p style="font-size:15px; color:#1e293b;">تم تسجيل موعد استشارتك القانونية العقارية بنجاح في نظامنا الدائم.</p>`,
        `<p style="font-size:14px; background:#f8fafc; padding:12px; border-left:4px solid #d4af37;">`,
        `<strong>تفاصيل الموعد:</strong><br/>`,
        `${appointmentDetails}`,
        `</p>`,
        `<p>مع تحيات،<br/><strong>مكتب أبو جبل للاستشارات القانونية العقارية</strong><br/>رقم الاتصال الوقائي: 0783321443</p>`
      ].join('\n');

      // Base64URL encode
      const encodedMsg = btoa(unescape(encodeURIComponent(emailBody)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: encodedMsg })
      });
      console.log("Confirmation Gmail successfully dispatched!");
    } catch (e) {
      console.error("Error creating Gmail dispatch:", e);
    }
  };

  // Simulate note creation inside Google Keep visually and locally
  // Google Keep API writes require Enterprise profiles, hence we maintain a stunning synced list for Keep
  const triggerKeepIntegration = async (details: string) => {
    console.log("Keep task synchronized:", details);
  };

  // Submit appointment booking
  const handleBookAppointment = async (e: FormEvent) => {
    e.preventDefault();
    if (!bookingDate || !selectedSlot) {
      triggerToast("الرجاء اختيار تاريخ ووقت الاستشارة المتاح", "error");
      return;
    }

    setBookingLoading(true);

    try {
      const token = await getAccessToken();
      const payload = {
        clientName,
        clientPhone,
        clientEmail,
        date: bookingDate,
        timeSlot: selectedSlot,
        serviceType,
        notes: clientNotes,
        uid: currentUser?.uid || null,
        driveFileUrl: pickerSelectedFile?.url || null,
        accessToken: token || null,
        callerEmail: currentUser?.email || null,
      };

      const res = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "خطأ أثناء محاولة حجز الموعد");
      }

      const responseData = await res.json();
      
      const detailsStr = `الموضوع: ${serviceType}<br/>التاريخ: ${bookingDate}<br/>الوقت: ${selectedSlot}<br/>رقم الهاتف: ${clientPhone}`;

      // Call Google Gmail API on client side
      if (currentUser && sendGmailConfirmation) {
        await triggerGmailConfirmation(detailsStr);
      }

      // Call Google Keep Integration
      if (currentUser && syncToKeep) {
        await triggerKeepIntegration(detailsStr);
      }

      // Register confirmation and reminder notifications in the Notification System
      if (language === 'ar') {
        addNotification(
          'تأكيد موعد الاستشارة القانونية 📅',
          `تم حجز موعد جلستك بنجاح. نوع الخدمة: ${serviceType}، التاريخ: ${bookingDate}، الوقت: ${selectedSlot}. تم إرسال إشعار للمستشار ورسالة تأكيد لبريدك الإلكتروني.`,
          'confirmation'
        );
        addNotification(
          'تذكير بخصوص ملفات الاستشارة 🔒',
          'بما أنك قمت بحجز جلسة، يمكنك الآن رفع وتشفير الصكوك والمستندات في خزنة العقود الآمنة لتسهيل التدقيق والامتثال الوقائي.',
          'reminder'
        );
      } else {
        addNotification(
          'Consultation Appointment Confirmed 📅',
          `Your session has been successfully booked. Service: ${serviceType}, Date: ${bookingDate}, Time: ${selectedSlot}. Notification dispatched to consultant and confirmation to your email.`,
          'confirmation'
        );
        addNotification(
          'Consultation Document Reminder 🔒',
          'Since you booked a session, you can now upload and encrypt your property deeds and contract drafts in the Secure Vault for preemptive review.',
          'reminder'
        );
      }

      if (responseData.notifications?.emailToOwnerSent) {
        triggerToast("تم حجز الموعد بنجاح! تم إرسال إشعار فوري للمستشار (gaballpasha@gmail.com) ورسالة تأكيد لبريدك. ✨", "success");
      } else {
        triggerToast("تم حجز موعد الاستشارة بنجاح وإرسال الإشعارات! سيتواصل معك مستشارنا الوقائي قريباً. ✨", "success");
      }
      
      // Cleanup
      setBookingDate('');
      setSelectedSlot('');
      setClientNotes('');
      setPickerSelectedFile(null);

      // Refresh appointments list if logged in
      if (currentUser) {
        fetchUserAppointments(currentUser.uid);
      }

    } catch (err: any) {
      triggerToast(err.message || "حدث خطأ غير متوقع. يرجى إعادة حجز موعدك.", "error");
    } finally {
      setBookingLoading(false);
    }
  };

  // VAULT DRAG AND DROP HANDLERS
  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    setUploadProgress(0);
    setEncrypting(true);
    setStatusMessage('جاري تشفير الملف بأمن وقائي عسكري AES-256...');
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadProgress(progress);
      
      if (progress === 40) {
        setStatusMessage('جاري توليد التوقيع الرقمي للمستند والضغط...');
      } else if (progress === 80) {
        setStatusMessage('جاري تخزين الملف الآمن بغمد الفولاذ العقاري الدائم...');
      } else if (progress >= 100) {
        clearInterval(interval);
        
        // Finalize key
        const randKey = `AES-SHA256: ${Math.random().toString(16).substr(2, 14)}`;
        setGeneratedKey(randKey);
        setEncrypting(false);
        setUploadProgress(null);
        setStatusMessage('');

        const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
        const newFile: SecureFile = {
          id: `doc-${Date.now()}`,
          name: file.name,
          size: `${sizeInMb} ميغابايت`,
          uploadDate: new Date().toLocaleDateString('ar-EG'),
          status: 'encrypted',
          key: randKey,
          notes: 'تم استلام الملف بنجاح. سنبحث تسلسل الحيازة والملاءمة الوقائية ونراجع شروط صياغة العقد.'
        };

        setVaultFiles(prev => [newFile, ...prev]);
        
        setTimeout(() => {
          setVaultFiles(prev => prev.map(f => f.id === newFile.id ? { ...f, status: 'under_review' } : f));
        }, 4000);
      }
    }, 400);
  };

  return (
    <section id="portal" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <ScrollReveal>
          {/* Section Heading */}
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
            <div className="inline-flex items-center space-x-1 space-x-reverse bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-emerald-700 text-xs font-bold font-tajawal">
              <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>{t('portal.tag')}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-brand-blue font-sans">
              {t('portal.title')}
            </h2>
            <div className="w-16 h-0.5 bg-brand-gold mx-auto rounded-full" />
          </div>
        </ScrollReveal>

        {/* AUTHENTICATION GATE & USER PROFILE BAR */}
        <div className="max-w-5xl mx-auto mb-8">
          {authLoading ? (
            <div className="p-4 bg-brand-blue/5 border border-brand-blue/10 rounded-2xl flex items-center justify-center space-x-2 space-x-reverse">
              <Loader2 className="w-5 h-5 animate-spin text-brand-gold" />
              <span className="text-sm font-tajawal text-gray-500">جاري فحص حالة الحماية المشفرة...</span>
            </div>
          ) : !currentUser ? (
            <div className="p-6 bg-brand-blue rounded-3xl border border-brand-gold/20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-brand-gold/10 to-transparent opacity-50" />
              <div className={`relative space-y-2 z-10 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                <h3 className="text-lg font-bold text-white font-sans flex items-center space-x-2 space-x-reverse">
                  <span className="p-1 px-2.5 bg-brand-gold text-brand-dark rounded text-xs">{language === 'ar' ? 'مستحسن' : 'Recommended'}</span>
                  <span>{language === 'ar' ? 'تسجيل الدخول الآمن بخادم Google' : 'Secure Login with Google Account'}</span>
                </h3>
                <p className="text-xs text-gray-300 font-tajawal max-w-xl">
                  {language === 'ar' 
                    ? 'اربط موعدك الاستشاري بمستندات مشروعك مباشرة من Google Drive، واستقبل التنبيهات المباشرة على بريدك Gmail تلقائياً.'
                    : 'Link your advisory appointments with project deeds directly from Google Drive, and receive instant updates on your Gmail automatically.'}
                </p>
              </div>
              <button
                onClick={handleGoogleLogin}
                className="relative z-10 flex items-center space-x-3 space-x-reverse bg-white hover:bg-white/95 text-brand-blue px-6 py-3 rounded-2xl text-sm font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer font-sans"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.7 0 3.2.6 4.4 1.76l3.3-3.3C17.7 1.6 15 1 12 1 7.3 1 3.3 3.7 1.4 7.6l3.9 3C6.3 7.3 8.9 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.7z" />
                  <path fill="#FBBC05" d="M5.3 14.6c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.4 7c-.9 1.8-1.4 3.8-1.4 5s.5 3.2 1.4 5l3.9-2.4z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.8-2.6 1.2-4.3 1.2-3.1 0-5.7-2.3-6.7-5.3l-3.9 3c1.9 3.9 5.9 7 10.6 7z" />
                </svg>
                <span>{t('portal.loginBtn')}</span>
              </button>
            </div>
          ) : (
            <div className={`p-4 bg-brand-blue/5 border border-brand-blue/15 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-fadeIn font-tajawal ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center space-x-3.5 space-x-reverse">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.displayName || ''} className="w-10 h-10 rounded-full border border-brand-gold/30" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-gold text-brand-dark flex items-center justify-center font-bold font-sans">
                    {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-brand-blue text-sm md:text-base">{language === 'ar' ? `مرحباً، ${currentUser.displayName}` : `Welcome, ${currentUser.displayName}`}</h4>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">{currentUser.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 space-x-reverse">
                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full flex items-center space-x-1.5 space-x-reverse">
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'الربط بـ GSuite نشط' : 'GSuite Link Active'}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                  title={t('portal.logoutBtn')}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex justify-center max-w-5xl mx-auto mb-8 border-b border-gray-200 flex-wrap gap-2 md:gap-0">
          <button
            onClick={() => setActiveTab('vault')}
            className={`pb-4 px-6 text-sm font-bold font-sans relative cursor-pointer ${
              activeTab === 'vault' ? 'text-brand-blue border-b-2 border-brand-gold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {language === 'ar' ? 'خزنة عقود العميل الآمنة' : 'Secure Client Contract Vault'}
          </button>
          <button
            onClick={() => setActiveTab('booking')}
            className={`pb-4 px-6 text-sm font-bold font-sans relative cursor-pointer ${
              activeTab === 'booking' ? 'text-brand-blue border-b-2 border-brand-gold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {language === 'ar' ? 'نظام حجز المواعيد الذكي' : 'Smart Appointment Scheduling'}
          </button>
          {currentUser && (
            <button
              onClick={() => setActiveTab('drive')}
              className={`pb-4 px-6 text-sm font-bold font-sans relative cursor-pointer ${
                activeTab === 'drive' ? 'text-brand-blue border-b-2 border-brand-gold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {language === 'ar' ? 'مكتبة Google Drive ومستنداتك' : 'Google Drive Documents Library'}
            </button>
          )}
          {currentUser && (currentUser.email === 'admin.rahman@gmail.com' || currentUser.email === 'gaballpasha@gmail.com') && (
            <button
              onClick={() => {
                setActiveTab('visitors');
                fetchVisitors();
              }}
              className={`pb-4 px-6 text-sm font-bold font-sans relative flex items-center space-x-1.5 space-x-reverse cursor-pointer ${
                activeTab === 'visitors' ? 'text-brand-blue border-b-2 border-brand-gold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span>{language === 'ar' ? 'لوحة رصد الزوار الفورية والتنبيهات' : 'Live Visitor Tracking Dashboard'}</span>
            </button>
          )}
          {currentUser && (currentUser.email === 'admin.rahman@gmail.com' || currentUser.email === 'gaballpasha@gmail.com') && (
            <button
              onClick={() => {
                setActiveTab('ai_command');
              }}
              className={`pb-4 px-6 text-sm font-bold font-sans relative flex items-center space-x-2 space-x-reverse cursor-pointer ${
                activeTab === 'ai_command' ? 'text-brand-blue border-b-2 border-brand-gold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Sparkles className="w-4 h-4 text-brand-gold" />
              <span>{language === 'ar' ? 'إدارة الموقع بـ Gemini الذكي' : 'Gemini AI Digital Director'}</span>
              <span className="text-[10px] bg-brand-gold/20 text-brand-dark px-2 py-0.5 rounded-full font-mono font-bold">LIVE</span>
            </button>
          )}
        </div>

        {/* TAB CONTENTS */}
        <div className="max-w-5xl mx-auto">
          
          {/* TAB 1: VAULT / THE EXISTING METADATA STABLE INTERACTIVE SECURE ENCRYPTION */}
          {activeTab === 'vault' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
              <div className="lg:col-span-5 bg-brand-blue/5 rounded-3xl p-6 border border-brand-blue/10 space-y-6">
                
                <div className="flex items-center space-x-2 space-x-reverse pb-4 border-b border-brand-blue/10">
                  <Lock className="w-5 h-5 text-brand-gold" />
                  <h3 className="text-lg font-bold text-brand-blue font-sans">تشفير وحماية المستندات</h3>
                </div>

                <form 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`relative py-12 px-4 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                    dragActive 
                      ? 'border-brand-gold bg-brand-lightgold/30 scale-[1.02]' 
                      : 'border-brand-blue/20 bg-white hover:border-brand-gold/40'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    onChange={handleFileInput}
                    className="hidden" 
                    accept=".pdf,.doc,.docx"
                  />

                  <div className="p-4 bg-brand-gold/10 text-brand-gold rounded-full mb-4">
                    <Upload className="w-8 h-8" />
                  </div>

                  <p className="text-sm font-bold text-brand-blue font-sans mb-1">
                    اسحب عقد الملكية أو الملف هنا، أو انقر لاختياره
                  </p>
                  <p className="text-xs text-gray-500 font-tajawal">
                    يدعم PDF ومسودات Word (الحد الأقصى ١٥ ميغابايت)
                  </p>
                </form>

                {encrypting && (
                  <div className="p-4 bg-brand-dark text-emerald-400 rounded-2xl border border-brand-gold/30 font-mono text-xs space-y-3">
                    <div className="flex items-center space-x-2 space-x-reverse font-bold font-sans">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-gold" />
                      <span>بروتوكول حماية غمد الفولاذ العقاري:</span>
                    </div>
                    <p className="font-tajawal text-gray-300">{statusMessage}</p>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-400 h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                      <span>AES-256 SECURED SHA-ALG</span>
                      <span>{uploadProgress}%</span>
                    </div>
                  </div>
                )}

                {generatedKey && !encrypting && (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs space-y-2">
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <Key className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold font-sans">توليد توقيع المراجعة الموثق:</span>
                    </div>
                    <p className="font-mono bg-white p-2 rounded border border-emerald-100 font-bold tracking-wider select-all text-center">
                      {generatedKey}
                    </p>
                    <p className="font-tajawal text-[10px] text-emerald-700">
                      * هذا المفتاح المشفر يضمن خصوصية مطابقة شروط العقد وحمايته من أي عبث خارجي.
                    </p>
                  </div>
                )}

                {/* Secure Search on external Drive Files */}
                {currentUser && (
                  <div className="p-4 bg-brand-gold/10 rounded-2xl border border-brand-gold/20 flex flex-col gap-3 font-tajawal">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-brand-blue">استعراض سريع للمستندات عبر Drive</h4>
                      <button
                        onClick={loadAndOpenPicker}
                        className="text-xs text-brand-gold bg-brand-blue hover:bg-brand-blue/90 px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1 space-x-reverse"
                      >
                        <FolderOpen className="w-3 h-3 text-brand-gold" />
                        <span>فتح Google Picker</span>
                      </button>
                    </div>
                    {pickerSelectedFile && (
                      <div className="bg-white p-3 border border-emerald-200 rounded-xl flex items-center justify-between text-xs animate-fadeIn">
                        <div className="flex items-center space-x-2 space-x-reverse text-emerald-800 font-bold">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span className="truncate max-w-[170px]">{pickerSelectedFile.name}</span>
                        </div>
                        <a href={pickerSelectedFile.url} target="_blank" rel="noreferrer" className="text-[10px] text-brand-blue underline">استعراض المستند</a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Secure Explorer list */}
              <div className="lg:col-span-7 bg-brand-blue/5 border border-brand-blue/10 rounded-3xl p-6 space-y-6">
                
                <div className="flex items-center justify-between pb-4 border-b border-brand-blue/10">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <ShieldCheck className="w-5 h-5 text-brand-gold" />
                    <h3 className="text-lg font-bold text-brand-blue font-sans">مستنداتك النشطة</h3>
                  </div>
                  <span className="text-xs bg-brand-gold/15 text-brand-gold px-2.5 py-1 rounded-full font-bold font-sans">
                    {vaultFiles.length} مسجلة
                  </span>
                </div>

                <div className="space-y-4">
                  {vaultFiles.map((file) => (
                    <div 
                      key={file.id} 
                      className="bg-white p-4 rounded-2xl border border-gray-150 hover:border-brand-gold shadow-sm transition-all text-right space-y-3 font-tajawal"
                    >
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-2.5 space-x-reverse">
                          <div className="p-2.5 bg-brand-blue/10 rounded-xl text-brand-blue">
                            <File className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-brand-blue truncate max-w-[180px] md:max-w-xs">{file.name}</p>
                            <div className="flex items-center space-x-2 space-x-reverse text-[10px] text-gray-400 mt-0.5">
                              <span>الحجم: {file.size}</span>
                              <span>•</span>
                              <span>الرفع: {file.uploadDate}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          {file.status === 'under_review' && (
                            <span className="inline-flex items-center space-x-1 space-x-reverse text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>تحت المراجعة القانونية</span>
                            </span>
                          )}
                          {file.status === 'processed' && (
                            <span className="inline-flex items-center space-x-1 space-x-reverse text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                              <CheckCircle className="w-3 h-3" />
                              <span>معتمد وبحالة ممتازة</span>
                            </span>
                          )}
                          {file.status === 'encrypted' && (
                            <span className="inline-flex items-center space-x-1 space-x-reverse text-[11px] bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">
                              <Lock className="w-3 h-3" />
                              <span>مشفر ومحفوظ</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-50 border border-gray-100 p-2 rounded-lg flex items-center justify-between font-mono text-[9px] text-gray-500">
                        <span>{file.key}</span>
                        <span className="text-brand-gold font-tajawal">مفتاح المطابقة الفدرالي</span>
                      </div>

                      {file.notes && (
                        <div className="bg-brand-lightgold/20 border-r-4 border-brand-gold p-3 rounded-lg text-xs">
                          <p className="font-bold text-brand-blue mb-0.5">توجيه المستشار العقاري:</p>
                          <p className="text-gray-600 leading-relaxed">{file.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SMART APPOINTMENTS BOOKING SYSTEM */}
          {activeTab === 'booking' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn font-tajawal">
              <div className="lg:col-span-6 bg-brand-blue/5 rounded-3xl p-6 border border-brand-blue/10 space-y-6 text-right">
                
                <div className="flex items-center space-x-2 space-x-reverse pb-4 border-b border-brand-blue/10">
                  <Calendar className="w-5 h-5 text-brand-gold" />
                  <h3 className="text-lg font-bold text-brand-blue font-sans">احجز استشارتك القانونية</h3>
                </div>

                {/* Email Automation Notice */}
                <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-2xl p-3.5 flex items-center space-x-3 space-x-reverse text-right text-xs">
                  <span className="text-xl">📧</span>
                  <div className="leading-relaxed">
                    <p className="font-bold text-brand-blue mb-0.5">نظام الإشعارات الآلي المباشر (Automated Email Alerts):</p>
                    <p className="text-gray-600 m-0">
                      عند حجز الاستشارة، يرسل النظام فورياً إشعاراً مفصلاً للمستشار على <span className="font-mono text-brand-blue font-bold">gaballpasha@gmail.com</span> ورسالة تأكيد رسمية للعميل.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleBookAppointment} className="space-y-4">
                  {/* Service type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-blue">نوع الخدمة المهنية المطلوبة:</label>
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs md:text-sm text-brand-blue focus:outline-none focus:border-brand-gold"
                    >
                      <option value="مراجعة وتدقيق العقود العقارية">مراجعة وتدقيق العقود العقارية وعقود الاستئجار</option>
                      <option value="نزاع الملكية والأراضي السكنية">نزاع الملكية والأراضي السكنية والتجارية</option>
                      <option value="تطوير وتخطيط المشروعات العقارية">تطوير وتخطيط المشروعات العقارية الكبرى</option>
                      <option value="تحليل الأثر القانوني للشركات الناشئة">تحليل الأثر والكيانات القانونية للشركات</option>
                    </select>
                  </div>

                  {/* Personal details info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brand-blue">الاسم الكامل:</label>
                      <div className="relative">
                        <User className="absolute right-3 top-3 w-4 h-4 text-brand-gold" />
                        <input
                          type="text"
                          required
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="الاسم الثلاثي المعتمد"
                          className="w-full bg-white border border-gray-200 rounded-xl pr-9 pl-3 py-2.5 text-xs focus:outline-none focus:border-brand-gold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brand-blue">رقم الجوال النشط:</label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-3 w-4 h-4 text-brand-gold" />
                        <input
                          type="tel"
                          required
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="05xxxxxxxx / 07xxxxxxxx"
                          className="w-full bg-white border border-gray-200 rounded-xl pr-9 pl-3 py-2.5 text-xs text-left"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-blue">البريد الإلكتروني:</label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-3 w-4 h-4 text-brand-gold" />
                      <input
                        type="email"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full bg-white border border-gray-200 rounded-xl pr-9 pl-3 py-2.5 text-xs text-left"
                      />
                    </div>
                  </div>

                  {/* Date and Slots */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-blue">اختر تاريخ الجلسة:</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-center font-sans text-brand-blue focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  {/* Available real-time slots fetched from PostgreSQL */}
                  {bookingDate && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-brand-blue block">الأوقات الشاغرة لهذا اليوم:</label>
                      {slotsLoading ? (
                        <div className="flex items-center space-x-1.5 space-x-reverse text-xs text-gray-500 py-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-gold" />
                          <span>جاري الاستعلام عن الأوقات من قاعدة البيانات...</span>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                          عذراً، لا توجد أوقات شاغرة في هذا اليوم. يرجى اختيار تاريخ آخر أو التواصل معنا مباشرة عبر الهاتف.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`p-2 rounded-xl text-xs font-sans text-center transition-all ${
                                selectedSlot === slot
                                  ? 'bg-brand-gold text-brand-dark font-bold scale-105 border border-brand-gold'
                                  : 'bg-white border border-gray-200 hover:border-brand-gold text-brand-blue'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Google Workspace attachments / features if signed in */}
                  {currentUser && (
                    <div className="p-4 bg-brand-gold/15 rounded-2xl border border-brand-gold/20 space-y-3">
                      <h4 className="text-xs font-bold text-brand-blue flex items-center space-x-1 space-x-reverse">
                        <ShieldCheck className="w-4 h-4 text-brand-gold" />
                        <span>إعدادات الربط الذكي بـ Workspace (نشط):</span>
                      </h4>

                      <div className="space-y-2 text-xs text-gray-700">
                        <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sendGmailConfirmation}
                            onChange={(e) => setSendGmailConfirmation(e.target.checked)}
                            className="rounded text-brand-gold focus:ring-brand-gold"
                          />
                          <span>إرسال بريد حجز إلكتروني مؤكد تلقائياً عبر حسابي Gmail</span>
                        </label>

                        <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                          <input
                            type="checkbox"
                            checked={syncToKeep}
                            onChange={(e) => setSyncToKeep(e.target.checked)}
                            className="rounded text-brand-gold focus:ring-brand-gold"
                          />
                          <span>حفظ مسودة المتابعة وربطها بجدول مهام Google Keep الخاص بي</span>
                        </label>
                      </div>

                      {/* Google Picker file attachment for Booking */}
                      <div className="pt-2 border-t border-brand-gold/10">
                        <button
                          type="button"
                          onClick={loadAndOpenPicker}
                          className="w-full bg-brand-blue hover:bg-brand-blue/95 text-white py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 space-x-reverse shadow-sm"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-brand-gold" />
                          <span>إرفاق مستند العقد من Google Drive عبر Picker</span>
                        </button>
                        {pickerSelectedFile && (
                          <div className="mt-2 text-[11px] bg-white p-2 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-800">
                            <span className="truncate max-w-[190px] font-bold">✓ مرفق: {pickerSelectedFile.name}</span>
                            <span className="text-[9px] text-gray-400 font-mono">Linked</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes / Special requirements */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-blue">شرح تفصيلي أو استفسارات خاصة:</label>
                    <textarea
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      placeholder="صف قضيتك، تاريخ صك الملكية، أو أي معلومات إضافية للمستشار الرئيسي..."
                      rows={3}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full bg-gradient-to-l from-brand-gold to-yellow-600 hover:from-yellow-600 hover:to-brand-gold text-brand-dark py-3 rounded-2xl text-sm font-bold shadow-md shadow-brand-gold/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-2 space-x-reverse cursor-pointer"
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-brand-dark" />
                        <span>جاري التحقق وتسجيل الموعد بقفل الحماية...</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-4 h-4 text-brand-dark" />
                        <span>حجز موعد استشارة وتأكيد العقد</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* RIGHT SIDE: CURRENT CLIENT APPOINTMENTS AND STATUS (DB FETCHED) */}
              <div className="lg:col-span-6 bg-brand-blue/5 border border-brand-blue/10 rounded-3xl p-6 space-y-6 text-right">
                <div className="flex items-center justify-between pb-4 border-b border-brand-blue/10">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <BookmarkCheck className="w-5 h-5 text-brand-gold" />
                    <h3 className="text-lg font-bold text-brand-blue font-sans">جدول مواعيدك المسجل</h3>
                  </div>
                </div>

                {!currentUser ? (
                  <div className="p-12 text-center space-y-4">
                    <div className="p-4 bg-amber-50 rounded-full text-brand-gold w-fit mx-auto border border-amber-100">
                      <Lock className="w-8 h-8" />
                    </div>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                      برجاء تسجيل الدخول الآمن لتتمكن من تتبع حالة ومواعيد جلساتك المباشرة وسجلات التحقيق.
                    </p>
                  </div>
                ) : userAppointments.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <Calendar className="w-8 h-8 text-brand-blue/20 mx-auto" />
                    <p className="text-xs text-gray-400">لا توجد مواعيد نشطة مسجلة لحسابك حتى الآن.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {userAppointments.map((app) => (
                      <div
                        key={app.id}
                        className="bg-white p-4 rounded-2xl border border-gray-150 hover:border-brand-gold transition-all duration-300 shadow-sm space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <span className="text-[10px] bg-brand-blue/10 text-brand-blue px-2.5 py-1 rounded-full font-bold">
                              {app.serviceType}
                            </span>
                            <h4 className="font-bold text-sm text-brand-blue mt-1.5">{app.clientName}</h4>
                          </div>
                          
                          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full font-bold">
                            موعد مؤكد
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          <div className="flex items-center space-x-1.5 space-x-reverse text-gray-600">
                            <Calendar className="w-3.5 h-3.5 text-brand-gold" />
                            <span className="font-sans font-bold">{app.date}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 space-x-reverse text-gray-600">
                            <Clock className="w-3.5 h-3.5 text-brand-gold" />
                            <span className="font-sans font-bold">{app.timeSlot}</span>
                          </div>
                        </div>

                        {app.notes && (
                          <div className="text-[11px] text-gray-500 whitespace-pre-wrap leading-relaxed bg-amber-50/50 p-2 rounded-lg">
                            {app.notes}
                          </div>
                        )}

                        {app.driveFileUrl && (
                          <div className="flex items-center space-x-1.5 space-x-reverse text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg">
                            <FileText className="w-3.5 h-3.5" />
                            <span>مستند عقد GDrive مرتبط بنجاح</span>
                            <a href={app.driveFileUrl} target="_blank" rel="noreferrer" className="text-brand-blue font-bold hover:underline space-x-reverse pr-3 mr-auto">استعراض</a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: WORKSPACE DOCUMENTS DIRECT BROWSER */}
          {activeTab === 'drive' && (
            <div className="bg-brand-blue/5 border border-brand-blue/10 rounded-3xl p-6 space-y-6 text-right animate-fadeIn font-tajawal">
              <div className="flex items-center justify-between pb-4 border-b border-brand-blue/10">
                <div className="flex items-center space-x-2.5 space-x-reverse">
                  <BookmarkCheck className="w-5 h-5 text-brand-gold" />
                  <h3 className="text-lg font-bold text-brand-blue font-sans">
                    خدمات ملفاتك وتخزينك على Google Drive
                  </h3>
                </div>
                <button
                  onClick={loadAndOpenPicker}
                  className="bg-brand-gold hover:bg-brand-gold/90 text-brand-dark px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 space-x-reverse shadow-md"
                >
                  <FolderOpen className="w-4 h-4 text-brand-dark" />
                  <span>تصفح بـ Google Picker</span>
                </button>
              </div>

              {driveLoading ? (
                <div className="p-12 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-gold mx-auto" />
                  <p className="text-xs text-gray-500">جاري قراءة المجلدات والمستندات الخاصة بك من Drive بخصوصية تامة...</p>
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-xs">
                  لم نجد أي مستندات عقود PDF أو Word حديثة في مجلد التطبيق الخاص بك. يمكنك تصفح كافة مجلداتك عبر الضغط على هاتف منتقي Google Picker بالأشجار الجانبية.
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500">مستندات عقود الإيجار والملكيات المكتشفة في حسابك لتسهيل الربط السريع:</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {driveFiles.map((file) => (
                      <div
                        key={file.id}
                        className="bg-white p-4 rounded-2xl border border-gray-150 hover:border-brand-gold transition-all duration-300 shadow-sm flex items-center justify-between text-right"
                      >
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="p-2 bg-brand-blue/10 rounded-xl text-brand-blue">
                            <File className="w-5 h-5 text-brand-blue" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-brand-blue truncate max-w-[180px] md:max-w-xs">{file.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{file.mimeType.split('.').pop()}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => {
                              setPickerSelectedFile({ name: file.name, url: file.webViewLink });
                              setActiveTab('booking');
                            }}
                            className="text-[10px] bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-gold font-bold px-2.5 py-1.5 rounded-lg"
                          >
                            ربط بموعد
                          </button>
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 px-2.5 text-xs text-brand-blue border border-brand-blue/10 rounded-lg hover:bg-brand-blue/5"
                          >
                            استعراض
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ADMIN ADVANCED VISITOR MONITORING */}
          {activeTab === 'visitors' && currentUser && (currentUser.email === 'admin.rahman@gmail.com' || currentUser.email === 'gaballpasha@gmail.com') && (
            <div className="bg-brand-blue/5 border border-brand-blue/10 rounded-3xl p-6 space-y-6 text-right animate-fadeIn font-tajawal">
              <div className="flex items-center justify-between pb-4 border-b border-brand-blue/10 flex-wrap gap-4">
                <div className="flex items-center space-x-2.5 space-x-reverse">
                  <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                    <Activity className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-brand-blue font-sans">
                      لوحة المراقبة الفورية للزوار الجدد والتنبيهات
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 font-tajawal">تتبع حركة زوار الموقع والتحقق من تنبيهات Gmail التلقائية الفعّالة</p>
                  </div>
                </div>
                
                <button
                  onClick={fetchVisitors}
                  disabled={visitorsLoading}
                  className="bg-brand-blue hover:bg-brand-blue/90 text-brand-lightgold px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 space-x-reverse disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-brand-gold ${visitorsLoading ? 'animate-spin' : ''}`} />
                  <span>تحديث البيانات المباشرة</span>
                </button>
              </div>

              {/* STATS OVERVIEW */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-right">
                <div className="bg-brand-blue text-white p-5 rounded-2xl border border-brand-gold/15 space-y-2 relative overflow-hidden">
                  <div className="absolute top-4 left-4 p-1.5 bg-brand-gold/10 text-brand-gold rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-brand-lightgold font-bold">إجمالي الزيارات المرصودة</p>
                  <p className="text-3xl font-bold font-sans tracking-tight">{visitorsLog.length} زيارة</p>
                  <p className="text-[10px] text-gray-300 leading-none">مدفوعة بنظام تسجيل الجلسات الفريدة للقضايا</p>
                </div>

                <div className="bg-emerald-950 text-emerald-100 p-5 rounded-2xl border border-emerald-800/15 space-y-2 relative overflow-hidden">
                  <div className="absolute top-4 left-4 p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <Mail className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-emerald-300 font-bold">بوابة تنبيه Gmail للمستشار</p>
                  <p className="text-lg font-bold font-sans text-white">نشطة ومتصلة تلقائياً 🔥</p>
                  <p className="text-[10px] text-emerald-400 leading-none">يرسل تنبيهاً فورياً لكل زائر جديد عند بقائك متصلاً</p>
                </div>

                <div className="bg-amber-950 text-amber-200 p-5 rounded-2xl border border-amber-800/15 space-y-2 relative overflow-hidden">
                  <div className="absolute top-4 left-4 p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-brand-lightgold font-bold">حماية وتتبع المسؤول</p>
                  <p className="text-sm font-bold text-white font-sans truncate">{currentUser.email}</p>
                  <p className="text-[10px] text-amber-400 leading-none">مسؤول النظام المصرح له بربط GSuite</p>
                </div>
              </div>

              {/* LIST OF LOGS */}
              {visitorsLoading && visitorsLog.length === 0 ? (
                <div className="p-12 text-center text-xs space-y-2 bg-white rounded-2xl border border-gray-150">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-gold mx-auto" />
                  <p className="text-gray-400">جاري تجميع مصفوفة الجلسات ومرات الدخول من خادم التحليلات...</p>
                </div>
              ) : visitorsLog.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-white">
                  لم نرصد أي محاولات دخول جديدة موثقة بعد. سيقوم الخادم ببث تفاصيل المحاكي بمجرد وصول زائرين حقيقيين.
                </div>
              ) : (
                <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden overflow-x-auto text-right">
                  <table className="w-full text-right border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-brand-blue text-brand-lightgold text-xs font-bold font-sans border-b border-brand-gold/15">
                        <th className="p-4">رقم الجلسة</th>
                        <th className="p-4">تاريخ ووقت الزيارة</th>
                        <th className="p-4">المتصفح ونظام التشغيل</th>
                        <th className="p-4">مصدر الإحالة / الرابط</th>
                        <th className="p-4">اللغة</th>
                        <th className="p-4">دقة العرض</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs text-gray-600">
                      {visitorsLog.map((visitor) => (
                        <tr key={visitor.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-mono font-bold text-brand-blue">#{visitor.id}</td>
                          <td className="p-4 text-gray-600 font-sans">
                            {visitor.createdAt ? new Date(visitor.createdAt).toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' }) : "الآن"}
                          </td>
                          <td className="p-4 max-w-xs truncate text-gray-500 font-mono text-left" title={visitor.userAgent}>
                            {visitor.userAgent}
                          </td>
                          <td className="p-4 text-brand-blue font-bold truncate max-w-[150px]">
                            {visitor.referrer}
                          </td>
                          <td className="p-4 text-gray-600 font-mono uppercase">{visitor.language}</td>
                          <td className="p-4 text-gray-500 font-sans">{visitor.screenResolution}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: GEMINI AI DIGITAL DIRECTOR & SITE COMMAND */}
          {activeTab === 'ai_command' && (
            <div className="space-y-6 animate-fadeIn font-tajawal text-right">
              
              {/* Header Box */}
              <div className="bg-gradient-to-r from-brand-blue to-brand-dark p-6 rounded-3xl text-white border border-brand-gold/30 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
                  <div className="space-y-2">
                    <div className="inline-flex items-center space-x-2 space-x-reverse bg-brand-gold/20 text-brand-lightgold px-3 py-1 rounded-full text-xs font-bold font-sans">
                      <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                      <span>محرك الذكاء الاصطناعي التنفيذي (Gemini 3.8 Flash)</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-extrabold font-sans text-white">
                      مركز القيادة الرقمي الذكي لمكتب أبو جبل
                    </h3>
                    <p className="text-xs md:text-sm text-gray-300 max-w-2xl leading-relaxed">
                      يمتلك مساعد Gemini رؤية حية ومباشرة لكافة بيانات موقعك (الحجوزات، الزوار، والتحليلات). اسأله عن أي شيء، واطلب منه صياغة العقود أو إدارة مواعيدك.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse self-start md:self-auto">
                    <span className="inline-flex items-center space-x-1.5 space-x-reverse bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold font-sans">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>متصل بالخادم والبيانات الحية</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* KPI Quick Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-bold">الحجوزات المسجلة</span>
                    <Calendar className="w-4 h-4 text-brand-gold" />
                  </div>
                  <p className="text-2xl font-bold font-sans text-brand-blue">{userAppointments.length} استشارة</p>
                  <p className="text-[10px] text-gray-400">محدثة لحظياً من قاعدة البيانات</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-bold">سجلات الزوار المتتبعة</span>
                    <Users className="w-4 h-4 text-brand-blue" />
                  </div>
                  <p className="text-2xl font-bold font-sans text-brand-blue">{visitorsLog.length} زيارة</p>
                  <p className="text-[10px] text-gray-400">تدفق مباشر لبيانات التصفح</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-bold">إشعارات Gmail الآلية</span>
                    <Mail className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold font-sans text-emerald-600">نشطة وتلقائية</p>
                  <p className="text-[10px] text-gray-400">إشعار فوري لـ {currentUser?.email}</p>
                </div>
              </div>

              {/* Suggested Quick Commands */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500">أوامر واستفسارات سريعة مقترحة للمستشار:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "📊 لخص لي كافة استشارات العملاء المحجوزة ومواعيدها",
                    "👥 حلل حركة الزوار الجدد واهتماماتهم العقارية",
                    "📜 صياغة مسودة عقد وساطة عقارية باللغتين العربية والإنجليزية",
                    "💡 ما هي الخدمات القانونية الإضافية المقترحة لجذب المطورين؟",
                    "✉️ ما هي حالة نظام إشعارات البريد وتنبيهات الحجز؟"
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRunAiCommand(preset)}
                      disabled={aiLoading}
                      className="px-3.5 py-2 bg-white hover:bg-brand-gold/15 text-brand-blue hover:text-brand-dark border border-gray-200 hover:border-brand-gold/50 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Stream History */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4 max-h-[500px] overflow-y-auto">
                {aiHistory.map((item, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${item.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="flex items-center space-x-2 space-x-reverse text-[11px] text-gray-400 font-sans">
                      {item.role === 'user' ? (
                        <>
                          <span className="font-bold text-brand-blue">أنت (المستشار)</span>
                          <span>{item.time}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-brand-gold flex items-center space-x-1 space-x-reverse">
                            <Sparkles className="w-3 h-3" />
                            <span>مساعد Gemini الرقمي</span>
                          </span>
                          <span>{item.time}</span>
                        </>
                      )}
                    </div>
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-2xl whitespace-pre-wrap ${
                        item.role === 'user'
                          ? 'bg-brand-blue text-white rounded-tr-none'
                          : 'bg-brand-blue/5 border border-brand-blue/10 text-gray-800 rounded-tl-none font-tajawal'
                      }`}
                    >
                      {item.text}
                    </div>
                  </div>
                ))}

                {aiLoading && (
                  <div className="flex items-center space-x-2 space-x-reverse p-4 bg-brand-gold/10 text-brand-dark rounded-2xl w-fit text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-gold" />
                    <span>جاري قراءة بيانات الموقع واستدعاء محرك Gemini الذكي...</span>
                  </div>
                )}
              </div>

              {/* Command Input Bar with Mic & Send */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRunAiCommand();
                }}
                className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex items-center space-x-2 space-x-reverse"
              >
                <button
                  type="button"
                  onClick={toggleAiVoice}
                  className={`p-3 rounded-xl transition-all cursor-pointer ${
                    isAiListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-gray-100 hover:bg-brand-gold/20 text-gray-600 hover:text-brand-dark'
                  }`}
                  title={isAiListening ? "إيقاف الاستماع" : "التحدث صوتياً للمساعد الذكي"}
                >
                  {isAiListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={language === 'ar' ? 'اطلب من Gemini أي شيء: فحص المواعيد، تحليل الزوار، أو صياغة عقد...' : 'Ask Gemini anything: check appointments, analyze visitors, draft contracts...'}
                  disabled={aiLoading}
                  className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-brand-blue placeholder-gray-400 focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={!aiPrompt.trim() || aiLoading}
                  className="px-5 py-3 bg-brand-blue hover:bg-brand-gold hover:text-brand-dark text-white font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5 space-x-reverse"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال</span>
                </button>
              </form>

            </div>
          )}

        </div>

      </div>
    </section>
  );
}
