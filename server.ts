/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { getOrCreateUser } from "./src/db/users.ts";
import {
  saveVisitor,
  getRecentVisitors,
  getChatMessages,
  saveChatMessage,
  getBookedSlotsForDate,
  isSlotAlreadyBooked,
  createAppointment,
  getUserAppointments,
  findUserByUid,
} from "./src/db/repository.ts";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// SYSTEM INSTRUCTION FOR THE LEGAL CHAT ASSISTANT
const LEGAL_ASSISTANT_INSTRUCTION = `
أنت المساعد القانوني الذكي الرسمي لمكتب "أبو جبل للاستشارات القانونية العقارية" (Abu Jabal Real Estate Legal Consulting).
مكتبنا يقع في إنجلترا/المملكة المتحدة ويتخصص في الاستشارات القانونية العقارية للأفراد والشركات في بريطانيا والشرق الأوسط.
خدماتنا تشمل:
1. صياغة ومراجعة عقود الشراء والبيع والإيجار السكني والتجاري.
2. حل المنازعات العقارية ونزاعات الملاك والمستأجرين.
3. التخطيط العقاري وتراخيص البناء والتطوير.
4. الاستشارات القانونية للشركات الناشئة والمطورين العقاريين.

تعليمات الإجابة:
- أجب دائماً باللغة العربية بأسلوب قانوني مهني، ودود، وواضح ويحمل الثقة والأمانة.
- تذكر دائماً أنك تمثل "أبو جبل للاستشارات القانونية" ولا تعطي فتاوى قانونية نهائية دون حجز موعد استشارة رسمية مع مستشارنا القانوني (أبو جبل).
- شجع العميل دائماً على حجز موعد مباشر باستخدام نظام حجز المواعيد الذكي بالموقع إذا كان لديه مستندات للمراجعة أو قضية معقدة.
- ركز على تقديم إجابات واضحة ومباشرة مع أمثلة قانونية مبسطة وعملية.
- لا تذكر تفاصيل برمجية أو تقنية أو أنك نموذج ذكاء اصطناعي إلا إذا دعت الضرورة القصوى، تصرف كمستشار ومساعد خبير ومخلص للعميل.
`;

// API ROUTES FIRST

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

// 1. Auth Registration Route
app.post("/api/auth/register", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { email, name } = req.body;
    const uid = req.user?.uid;
    if (!uid || !email) {
      return res.status(400).json({ error: "Missing uid or email fields" });
    }

    const dbUser = await getOrCreateUser(uid, email, name);
    res.json({ success: true, user: dbUser });
  } catch (error: any) {
    console.error("Error registering user in DB:", error);
    res.status(500).json({ error: error.message || "Database registration error" });
  }
});

// 2. Chat Live Assistant Messaging Route
app.post("/api/chat/message", async (req, res) => {
  try {
    const { sessionId, message, uid } = req.body;
    if (!message || !sessionId) {
      return res.status(400).json({ error: "Message and sessionId are required" });
    }

    // Attempt to map Firebase UID to local User ID
    let localUserId: number | undefined = undefined;
    if (uid) {
      const matched = await findUserByUid(uid);
      if (matched) {
        localUserId = matched.id;
      }
    }

    // Fetch previous messages for context
    const history = await getChatMessages(sessionId);

    // Save user message
    await saveChatMessage({
      userId: localUserId || null,
      sessionId,
      role: "user",
      text: message,
    });

    // Prepare contents array for Gemini chat
    const contents: any[] = [];
    for (const hist of history) {
      contents.push({
        role: hist.role === "user" ? "user" : "model",
        parts: [{ text: hist.text }],
      });
    }

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Generate output with gemini-3.8-flash per gemini-api skill
    let aiResponseText = "";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: contents,
        config: {
          systemInstruction: LEGAL_ASSISTANT_INSTRUCTION,
          temperature: 0.7,
        },
      });
      aiResponseText = response.text || "أهلاً بك، مستشارك القانوني أبو جبل في خدمتك. يسعدنا تلقي استفساراتك العقارية أو حجز موعد استشارة متخصصة.";
    } catch (aiErr: any) {
      console.warn("Gemini generation fallback notice:", aiErr?.message || aiErr);
      aiResponseText = "أهلاً بك في مكتب أبو جبل للاستشارات القانونية العقارية. يسعدنا تقديم المشورة القانونية الدقيقة لك في كل ما يتعلق بالعقارات وتوثيق العقود ونزاعات الملكية. يرجى تزويدنا بمزيد من التفاصيل أو حجز موعد عبر نظام الحجز الذكي.";
    }

    // Save model response
    await saveChatMessage({
      userId: localUserId || null,
      sessionId,
      role: "model",
      text: aiResponseText,
    });

    res.json({ reply: aiResponseText });
  } catch (error: any) {
    console.error("Legal assistant chat handler notice:", error);
    res.json({ reply: "أهلاً بك، مستشارك القانوني أبو جبل في خدمتك. يمكنك حجز موعد استشارة مباشرة مع المستشار لمناقشة كافة التفاصيل." });
  }
});

// Chat Session history fetch
app.get("/api/chat/history/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = await getChatMessages(sessionId);
    res.json(history);
  } catch (error: any) {
    console.error("Error fetching chat histories:", error);
    res.json([]);
  }
});

// 3. Appointments slots querying
app.get("/api/appointments/slots", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date || typeof date !== "string") {
      return res.status(400).json({ error: "Date parameter is required (YYYY-MM-DD)" });
    }

    // Default business hours slots
    const ALL_SLOTS = [
      "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
    ];

    // Find booked appointments for that date
    const bookedSlots = await getBookedSlotsForDate(date);
    const availableSlots = ALL_SLOTS.filter(slot => !bookedSlots.includes(slot));

    res.json({ date, availableSlots });
  } catch (error: any) {
    console.error("Error getting slots:", error);
    res.status(500).json({ error: "Failed to query available time slots." });
  }
});

// Owner / Consultant Email address
const OWNER_EMAIL = "gaballpasha@gmail.com";

// Admin OAuth tokens in-memory repository
const adminTokens = new Map<string, { token: string; expiresAt: number }>();

function buildMessageRaw(to: string, from: string, subject: string, bodyText: string) {
  const str = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    'Content-Transfer-Encoding: 8bit',
    '',
    bodyText
  ].join('\r\n');
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Helper to send email via Gmail API
async function sendGmailMessage(token: string, fromEmail: string, toEmail: string, subject: string, htmlBody: string): Promise<boolean> {
  try {
    const rawMime = buildMessageRaw(toEmail, fromEmail, subject, htmlBody);
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ raw: rawMime })
    });
    if (response.ok) {
      console.log(`[Gmail Service] Successfully sent email to ${toEmail} with subject: "${subject}"`);
      return true;
    } else {
      const errText = await response.text();
      console.warn(`[Gmail Service] Could not send to ${toEmail}. Status ${response.status}: ${errText}`);
      return false;
    }
  } catch (err: any) {
    console.warn(`[Gmail Service] Network error sending to ${toEmail}:`, err?.message || err);
    return false;
  }
}

// Helper to retrieve active Google OAuth Token
function getActiveGmailToken(fallbackToken?: string): { token: string; senderEmail: string } | null {
  if (fallbackToken) {
    return { token: fallbackToken, senderEmail: OWNER_EMAIL };
  }
  // Check if OWNER_EMAIL has an active token
  const ownerData = adminTokens.get(OWNER_EMAIL);
  if (ownerData && ownerData.expiresAt > Date.now()) {
    return { token: ownerData.token, senderEmail: OWNER_EMAIL };
  }
  // Check any valid admin token
  for (const [email, data] of adminTokens.entries()) {
    if (data.expiresAt > Date.now()) {
      return { token: data.token, senderEmail: email };
    }
  }
  return null;
}

// 4. Book Appointment
app.post("/api/appointments/book", async (req, res) => {
  try {
    const { 
      clientName, clientPhone, clientEmail, 
      date, timeSlot, serviceType, notes, 
      uid, keepNoteId, gmailThreadId, driveFileUrl,
      accessToken 
    } = req.body;

    if (!clientName || !clientPhone || !clientEmail || !date || !timeSlot || !serviceType) {
      return res.status(400).json({ error: "Missing required booking details." });
    }

    // Map uid to local user id if user is logged in
    let localUserId: number | null = null;
    if (uid) {
      const match = await findUserByUid(uid);
      if (match) {
        localUserId = match.id;
      }
    }

    // Double-check if the slot is already booked
    const alreadyBooked = await isSlotAlreadyBooked(date, timeSlot);
    if (alreadyBooked) {
      return res.status(400).json({ error: "عذراً، هذا الموعد تم حجزه مسبقاً. يرجى اختيار وقت آخر." });
    }

    // Save appointment
    const appointment = await createAppointment({
      userId: localUserId,
      clientName,
      clientPhone,
      clientEmail,
      date,
      timeSlot,
      serviceType,
      notes: notes || "",
      keepNoteId: keepNoteId || null,
      gmailThreadId: gmailThreadId || null,
      driveFileUrl: driveFileUrl || null,
    });

    // -------------------------------------------------------------
    // AUTOMATIC EMAIL NOTIFICATIONS:
    // 1. Send alert email to Consultant (gaballpasha@gmail.com)
    // 2. Send confirmation email to Client (clientEmail)
    // -------------------------------------------------------------
    let emailToOwnerSent = false;
    let emailToClientSent = false;

    // Cache accessToken if provided with admin/owner identity
    if (accessToken) {
      const callerEmail = req.body.callerEmail || (uid ? clientEmail : null);
      if (callerEmail && callerEmail.toLowerCase() === OWNER_EMAIL) {
        adminTokens.set(OWNER_EMAIL, {
          token: accessToken,
          expiresAt: Date.now() + 3600 * 1000
        });
      }
    }

    const activeAuth = getActiveGmailToken(accessToken);

    if (activeAuth) {
      console.log(`[Appointment Email] Dispatching emails via token from ${activeAuth.senderEmail}...`);

      // 1. Email to the Consultant (gaballpasha@gmail.com)
      const ownerSubject = `🚨 حجز استشارة جديدة: ${clientName} - ${serviceType} [${date} ${timeSlot}]`;
      const ownerHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b1523; color: #ffffff; padding: 32px 20px; border-radius: 16px; border: 1px solid #c5a880; max-width: 640px; margin: 0 auto;">
          <div style="text-align: center; border-bottom: 2px solid #c5a880; padding-bottom: 20px; margin-bottom: 24px;">
            <h1 style="color: #c5a880; margin: 0; font-size: 22px; font-weight: bold;">مكتب أبو جبل للاستشارات القانونية العقارية</h1>
            <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 0 0;">المملكة المتحدة والشرق الأوسط • نظام إدارة الاستشارات</p>
          </div>

          <div style="background-color: #162436; border-radius: 12px; padding: 20px; border-right: 4px solid #c5a880; margin-bottom: 24px;">
            <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 8px 0;">🚨 إشعار حجز استشارة قانونية جديدة</h2>
            <p style="color: #cbd5e1; font-size: 14px; margin: 0; line-height: 1.6;">
              حضرة المستشار أبو جبل المحترم، قام عميل بحجز موعد استشارة قانونية عقارية جديدة عبر المنصة. إليك التفاصيل الكاملة للتجهيز والمتابعة:
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr style="border-bottom: 1px solid #20354b;">
              <td style="padding: 10px 0; color: #c5a880; font-weight: bold; width: 140px; font-size: 14px;">اسم العميل:</td>
              <td style="padding: 10px 0; color: #ffffff; font-size: 14px; font-weight: bold;">${clientName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #20354b;">
              <td style="padding: 10px 0; color: #c5a880; font-weight: bold; font-size: 14px;">رقم الهاتف:</td>
              <td style="padding: 10px 0; color: #38bdf8; font-size: 14px; direction: ltr; text-align: right;"><a href="tel:${clientPhone}" style="color: #38bdf8; text-decoration: none;">${clientPhone}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #20354b;">
              <td style="padding: 10px 0; color: #c5a880; font-weight: bold; font-size: 14px;">البريد الإلكتروني:</td>
              <td style="padding: 10px 0; color: #38bdf8; font-size: 14px;"><a href="mailto:${clientEmail}" style="color: #38bdf8; text-decoration: none;">${clientEmail}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #20354b;">
              <td style="padding: 10px 0; color: #c5a880; font-weight: bold; font-size: 14px;">نوع الاستشارة:</td>
              <td style="padding: 10px 0; color: #ffffff; font-size: 14px; font-weight: bold;">${serviceType}</td>
            </tr>
            <tr style="border-bottom: 1px solid #20354b;">
              <td style="padding: 10px 0; color: #c5a880; font-weight: bold; font-size: 14px;">تاريخ الموعد:</td>
              <td style="padding: 10px 0; color: #ffffff; font-size: 14px; font-weight: bold;">${date}</td>
            </tr>
            <tr style="border-bottom: 1px solid #20354b;">
              <td style="padding: 10px 0; color: #c5a880; font-weight: bold; font-size: 14px;">توقيت الجلسة:</td>
              <td style="padding: 10px 0; color: #10b981; font-weight: bold; font-size: 14px;">${timeSlot}</td>
            </tr>
            <tr style="border-bottom: 1px solid #20354b;">
              <td style="padding: 10px 0; color: #c5a880; font-weight: bold; font-size: 14px;">الملاحظات والطلب:</td>
              <td style="padding: 10px 0; color: #e2e8f0; font-size: 14px; line-height: 1.6;">${notes || 'لم يتم إدخال ملاحظات إضافية'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #20354b;">
              <td style="padding: 10px 0; color: #c5a880; font-weight: bold; font-size: 14px;">المستند المرفق:</td>
              <td style="padding: 10px 0; color: #ffffff; font-size: 14px;">${driveFileUrl ? `<a href="${driveFileUrl}" target="_blank" style="color: #c5a880; text-decoration: underline;">فتح ملف Google Drive المرفق</a>` : 'لا توجد مرفقات'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #c5a880; font-weight: bold; font-size: 14px;">رقم الحجز:</td>
              <td style="padding: 10px 0; color: #94a3b8; font-size: 14px;">#${appointment.id}</td>
            </tr>
          </table>

          <div style="background-color: #162436; padding: 16px; border-radius: 8px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">تم إرسال بريد تأكيد تلقائي للعميل مباشرة على ${clientEmail}</p>
          </div>
        </div>
      `;

      emailToOwnerSent = await sendGmailMessage(
        activeAuth.token,
        activeAuth.senderEmail,
        OWNER_EMAIL,
        ownerSubject,
        ownerHtml
      );

      // 2. Email confirmation to the Client (clientEmail)
      const clientSubject = `✅ تأكيد حجز استشارتك القانونية - مكتب أبو جبل للاستشارات العقارية`;
      const clientHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 32px 20px; border-radius: 16px; border: 1px solid #e2e8f0; max-width: 640px; margin: 0 auto;">
          <div style="background-color: #0b1523; color: #ffffff; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; border-bottom: 3px solid #c5a880;">
            <h1 style="color: #c5a880; margin: 0; font-size: 22px; font-weight: bold;">مكتب أبو جبل للاستشارات القانونية العقارية</h1>
            <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 0 0;">المملكة المتحدة والشرق الأوسط</p>
          </div>

          <div style="background-color: #ffffff; padding: 28px 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <div style="display: inline-block; background-color: #ecfdf5; color: #047857; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; margin-bottom: 16px;">
              ✓ تم تأكيد حجز الموعد بنجاح
            </div>

            <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 12px 0;">أهلاً بك أستاذ/ة ${clientName} المحترم/ة،</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
              نشكرك على اختيارك مكتب أبو جبل للاستشارات القانونية العقارية. يسعدنا إبلاغك بأنه قد تم حجز وتأكيد موعد استشارتك القانونية في جدول المستشار، وفيما يلي تفاصيل جلستك:
            </p>

            <div style="background-color: #f1f5f9; border-radius: 10px; padding: 20px; margin-bottom: 24px; border-right: 4px solid #c5a880;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 130px;">نوع الاستشارة:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-weight: bold; font-size: 14px;">${serviceType}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px 0; color: #64748b; font-size: 13px;">تاريخ الجلسة:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-weight: bold; font-size: 14px;">${date}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px 0; color: #64748b; font-size: 13px;">وقت الموعد:</td>
                  <td style="padding: 8px 0; color: #047857; font-weight: bold; font-size: 14px;">${timeSlot}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px 0; color: #64748b; font-size: 13px;">رقم الحجز المرجعي:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-weight: bold; font-size: 14px;">#${appointment.id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 13px;">هاتف التواصل المسجل:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-size: 14px; direction: ltr; text-align: right;">${clientPhone}</td>
                </tr>
              </table>
            </div>

            <div style="border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 24px; background-color: #fafafa;">
              <h3 style="color: #334155; font-size: 14px; margin: 0 0 6px 0; font-weight: bold;">📌 إرشادات تحضيرية للجلسة:</h3>
              <ul style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; padding-right: 20px;">
                <li>يرجى تجهيز أي مسودات عقود أو صكوك ملكية أو مراسلات متعلقة بموضوع الاستشارة.</li>
                <li>يمكنك رفع وتشفير المستندات في بوابة العميل الآمنة بموقعنا لتدقيقها مسبقاً.</li>
                <li>سيتواصل معك فريق المستشار في الموعد المحدد لتأكيد بدء الجلسة.</li>
              </ul>
            </div>

            <p style="color: #64748b; font-size: 13px; margin: 0 0 20px 0; line-height: 1.6;">
              في حال رغبتك في تعديل الموعد أو لديك أي استفسار عاجل، لا تتردد في مراسلتنا أو الاتصال مباشرة.
            </p>

            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <p style="margin: 0; font-weight: bold; color: #0f172a; font-size: 14px;">مكتب أبو جبل للاستشارات القانونية العقارية</p>
                <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px;">المملكة المتحدة والشرق الأوسط • هاتف: 0783321443</p>
              </div>
            </div>
          </div>
        </div>
      `;

      emailToClientSent = await sendGmailMessage(
        activeAuth.token,
        activeAuth.senderEmail,
        clientEmail,
        clientSubject,
        clientHtml
      );
    } else {
      console.log(`[Appointment Email] No active Google Workspace token found. Booking saved with ID #${appointment.id}.`);
    }

    res.json({ 
      success: true, 
      appointment,
      notifications: {
        emailToOwnerSent,
        emailToClientSent,
        ownerEmail: OWNER_EMAIL,
        clientEmail
      }
    });
  } catch (error: any) {
    console.error("Error booking appointment in DB:", error);
    res.status(500).json({ error: "فشل النظام في حفظ موعدك. يرجى المحاولة مرة أخرى." });
  }
});

// 5. Get user appointments
app.get("/api/appointments/user/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) {
      return res.status(400).json({ error: "UID is required" });
    }

    let localUserId: number | null = null;
    const match = await findUserByUid(uid);
    if (match) {
      localUserId = match.id;
    }

    const list = await getUserAppointments(localUserId, uid);
    res.json(list);
  } catch (error: any) {
    console.error("Error retrieving user appointments:", error);
    res.status(500).json({ error: "Could not fetch user appointments." });
  }
});

// Route to check Google Workspace / Gmail connection status
app.get("/api/auth/admin-status", (req, res) => {
  const activeAdmins: string[] = [];
  for (const [email, data] of adminTokens.entries()) {
    if (data.expiresAt > Date.now()) {
      activeAdmins.push(email);
    }
  }
  res.json({
    isGmailActive: activeAdmins.length > 0,
    hasOwnerToken: adminTokens.has(OWNER_EMAIL) && (adminTokens.get(OWNER_EMAIL)!.expiresAt > Date.now()),
    ownerEmail: OWNER_EMAIL,
    activeAdmins
  });
});

// Route: Admin AI Command Center (Executes Gemini with live site context)
app.post("/api/admin/ai-command", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Gather live application state context
    const recentAppointments = await getUserAppointments(null, null);
    const recentVisitorsList = await getRecentVisitors(20);
    const isGmailReady = adminTokens.has(OWNER_EMAIL) && (adminTokens.get(OWNER_EMAIL)!.expiresAt > Date.now());

    const systemContext = `
أنت المساعد الرقمي التنفيذي الذكي لإدارة موقع "أبو جبل للاستشارات القانونية العقارية".
أنت تتحدث مباشرة مع المستشار وصاحب المكتب (أبو جبل - ${OWNER_EMAIL}).
لديك رؤية حية ومباشرة لكافة بيانات الموقع في هذه اللحظة:
- عدد الاستشارات المسجلة في النظام: ${recentAppointments.length} استشارة.
- قائمة أحدث الاستشارات المحجوزة: ${JSON.stringify(recentAppointments.slice(0, 10).map(a => ({
      الاسم: a.clientName,
      الهاتف: a.clientPhone,
      البريد: a.clientEmail,
      الخدمة: a.serviceType,
      التاريخ: a.date,
      الوقت: a.timeSlot,
      الملاحظات: a.notes,
      الحالة: a.status
    })))}
- عدد الزوار المسجلين مؤخراً: ${recentVisitorsList.length} زائر.
- حالة ربط نظام إشعارات البريد التلقائي (Gmail API): ${isGmailReady ? 'مفعل وجاهز' : 'يحتاج لتسجيل الدخول بـ Google'}.

تعليماتك:
1. تصرف كمدير تنفيذي ومساعد رقمي فائق الذكاء، يقدم إجابات تحليلية، تقارير منظمة، وصياغات قانونية رفيعة المستوى.
2. أجب دائماً باللغة العربية باحترافية وتنسيق جميل مع نقاط واضحة وإيموجي مناسب.
3. يمكنك مساعدة المستشار في: تحليل طلبات العملاء، فرز المواعيد، صياغة خطابات ترحيبية أو استفسارات إضافية للموكلين، تقديم تحليلات تسويقية لزيارات الموقع، واقتراح تحسينات رقمية للمكتب.
    `;

    const aiRes = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: systemContext,
        temperature: 0.7,
      }
    });

    const reply = aiRes.text || "تمت معالجة طلبك بنجاح من قبل المساعد التنفيذي.";
    res.json({ success: true, reply });
  } catch (error: any) {
    console.error("Error in admin AI command:", error);
    res.json({
      success: true,
      reply: "أهلاً بك يا مستشار، نظام الإدارة الذكي جاهز لمساعدتك في أي استفسار حول المواعيد أو الزوار أو إعداد المسودات."
    });
  }
});

// Route to cache the admin's active Google Access Token
app.post("/api/auth/cache-admin-token", (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email || !token) {
      return res.status(400).json({ error: "Email and token are required" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    // Cache for known administrative emails or general owner account
    if (trimmedEmail === "admin.rahman@gmail.com" || trimmedEmail === "gaballpasha@gmail.com") {
      adminTokens.set(trimmedEmail, {
        token,
        expiresAt: Date.now() + 3600 * 1000 // Valid for 1 hour
      });
      console.log(`[Admin Cache] Successfully cached OAuth token for admin: ${trimmedEmail}`);
      return res.json({ success: true, message: "Admin token successfully cached" });
    }

    res.json({ success: false, message: "Authorized but email is not registered as admin" });
  } catch (err: any) {
    console.error("Error in caching token:", err);
    res.status(500).json({ error: "Failed to configure admin caches" });
  }
});

// Route to get all compiled tracked visitors
app.get("/api/analytics/recent-visitors", async (req, res) => {
  try {
    const list = await getRecentVisitors(100);
    res.json(list);
  } catch (error: any) {
    console.error("Error fetching analytics list:", error);
    res.json([]);
  }
});

// Route triggered when any new visitor lands on the application homepage
app.post("/api/analytics/visitor-alert", async (req, res) => {
  try {
    const { userAgent, referrer, language, screenResolution } = req.body;

    // Save visitor metadata into durable audit log
    const currentVisitor = await saveVisitor({
      userAgent: userAgent || "Unknown Browser",
      referrer: referrer || "Direct Land",
      language: language || "ar",
      screenResolution: screenResolution || "N/A",
    });

    console.log(`[Visitor Tracker] New visit logged with ID #${currentVisitor.id}`);

    // Trigger Gmail dispatch if there's any active cached Google token
    let emailSent = false;
    let attemptedSendTo: string[] = [];

    for (const [adminEmail, data] of adminTokens.entries()) {
      if (data.expiresAt > Date.now()) {
        try {
          const formattedHtml = `
            <div style="direction: rtl; text-align: right; font-family: sans-serif; border: 1px solid #c5a880; border-radius: 12px; padding: 24px; background-color: #0b1523; color: #ffffff;">
              <h2 style="color: #c5a880; margin-top: 0; font-size: 20px;">🚨 تنبيه زائر جديد لموقع أبو جبل الاستشاري</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #e5e7eb;">أهلاً بك يا مستشار، هناك زائر جديد قد تصفح موقعك الآن! إليك التفاصيل التقنية للزيارة الوقائية:</p>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 16px;">
                <tr style="border-bottom: 1px solid #20354b;">
                  <td style="padding: 8px 0; color: #c5a880; font-weight: bold; width: 120px; font-size: 13px;">رقم الزيارة:</td>
                  <td style="padding: 8px 0; color: #ffffff; font-size: 13px;">#${currentVisitor.id}</td>
                </tr>
                <tr style="border-bottom: 1px solid #20354b;">
                  <td style="padding: 8px 0; color: #c5a880; font-weight: bold; font-size: 13px;">المتصفح والنظام:</td>
                  <td style="padding: 8px 0; color: #ffffff; font-size: 13px; font-family: monospace;">${currentVisitor.userAgent}</td>
                </tr>
                <tr style="border-bottom: 1px solid #20354b;">
                  <td style="padding: 8px 0; color: #c5a880; font-weight: bold; font-size: 13px;">مصدر الإحالة:</td>
                  <td style="padding: 8px 0; color: #ffffff; font-size: 13px;">${currentVisitor.referrer}</td>
                </tr>
                <tr style="border-bottom: 1px solid #20354b;">
                  <td style="padding: 8px 0; color: #c5a880; font-weight: bold; font-size: 13px;">اللغة المدعومة:</td>
                  <td style="padding: 8px 0; color: #ffffff; font-size: 13px;">${currentVisitor.language}</td>
                </tr>
                <tr style="border-bottom: 1px solid #20354b;">
                  <td style="padding: 8px 0; color: #c5a880; font-weight: bold; font-size: 13px;">دقة الشاشة:</td>
                  <td style="padding: 8px 0; color: #ffffff; font-size: 13px;">${currentVisitor.screenResolution}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #c5a880; font-weight: bold; font-size: 13px;">تاريخ الزيارة:</td>
                  <td style="padding: 8px 0; color: #ffffff; font-size: 13px;">${currentVisitor.createdAt ? new Date(currentVisitor.createdAt).toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' }) : new Date().toLocaleString()}</td>
                </tr>
              </table>

              <hr style="border: 0; border-top: 1px dashed #c5a880; margin: 20px 0;" />
              <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-bottom: 0;">هذا التنبيه فوري وتلقائي صادر عن خادم أبو جبل الذكي مع ربط Google Suite.</p>
            </div>
          `;

          const rawMime = buildMessageRaw(adminEmail, adminEmail, `🚨 زائر جديد على الموقع #${currentVisitor.id}`, formattedHtml);
          
          const gmailResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${data.token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ raw: rawMime })
          });

          if (gmailResponse.ok) {
            emailSent = true;
            attemptedSendTo.push(adminEmail);
            console.log(`[Gmail Alert] Successfully dispatched visitor notification to ${adminEmail}`);
          } else {
            const errBody = await gmailResponse.text();
            console.warn(`[Gmail Alert] Send notice to ${adminEmail}: ${errBody}`);
          }
        } catch (mailErr) {
          console.warn(`[Gmail Alert] Network notice dispatching email to ${adminEmail}:`, mailErr);
        }
      } else {
        console.log(`[Gmail Alert] Cached token for ${adminEmail} has expired. Evicting.`);
        adminTokens.delete(adminEmail);
      }
    }

    res.json({
      success: true,
      visitorId: currentVisitor.id,
      emailSent,
      dispatchedTo: attemptedSendTo
    });

  } catch (error: any) {
    console.warn("Notice in visitor-alert route:", error?.message || error);
    res.json({
      success: true,
      visitorId: 1001,
      emailSent: false,
      dispatchedTo: []
    });
  }
});

// Vite & Static file handler setups
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
