/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, pool } from './index.ts';
import { users, appointments, chatMessages, visitors } from './schema.ts';
import { eq, and, desc } from 'drizzle-orm';

export interface UserRecord {
  id: number;
  uid: string;
  email: string;
  name?: string | null;
  createdAt?: Date | null;
}

export interface VisitorRecord {
  id: number;
  userAgent?: string | null;
  referrer?: string | null;
  language?: string | null;
  screenResolution?: string | null;
  createdAt: Date;
}

export interface ChatMessageRecord {
  id: number;
  userId?: number | null;
  sessionId: string;
  role: string;
  text: string;
  createdAt: Date;
}

export interface AppointmentRecord {
  id: number;
  userId?: number | null;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  date: string;
  timeSlot: string;
  serviceType: string;
  status: string;
  notes?: string | null;
  keepNoteId?: string | null;
  gmailThreadId?: string | null;
  driveFileUrl?: string | null;
  createdAt: Date;
}

// In-Memory Fallback Stores for resilient zero-downtime operation
let visitorSeq = 1000;
let messageSeq = 5000;
let appointmentSeq = 200;
let userSeq = 50;

const memoryVisitors: VisitorRecord[] = [];
const memoryChatMessages: ChatMessageRecord[] = [];
const memoryAppointments: AppointmentRecord[] = [
  // Initial seed appointment for testing if needed
];
const memoryUsers = new Map<string, UserRecord>();

// Database availability tracker with silent fallback
let isDbAvailable = false;
let lastDbCheck = 0;
let dbCheckInProgress: Promise<boolean> | null = null;

export async function checkDbAvailability(): Promise<boolean> {
  if (Date.now() - lastDbCheck < 60000) {
    return isDbAvailable;
  }
  if (dbCheckInProgress) {
    return dbCheckInProgress;
  }

  dbCheckInProgress = (async () => {
    lastDbCheck = Date.now();
    try {
      if (!pool) {
        isDbAvailable = false;
        return false;
      }
      const res = await pool.query('SELECT 1');
      isDbAvailable = !!(res && res.rows);
    } catch {
      isDbAvailable = false;
    } finally {
      dbCheckInProgress = null;
    }
    return isDbAvailable;
  })();

  return dbCheckInProgress;
}

// Initial background ping check
checkDbAvailability().catch(() => {});

function isDbCooldownActive(): boolean {
  return !isDbAvailable;
}

function handleDbFailure(_err: any, _operationName: string) {
  isDbAvailable = false;
  lastDbCheck = Date.now();
}

// ----------------------
// VISITORS
// ----------------------
export async function saveVisitor(data: {
  userAgent?: string;
  referrer?: string;
  language?: string;
  screenResolution?: string;
}): Promise<VisitorRecord> {
  if (!isDbCooldownActive()) {
    try {
      const saved = await db.insert(visitors).values({
        userAgent: data.userAgent || "Unknown Browser",
        referrer: data.referrer || "Direct Land",
        language: data.language || "ar",
        screenResolution: data.screenResolution || "N/A",
      }).returning();

      if (saved && saved[0]) {
        return {
          id: saved[0].id,
          userAgent: saved[0].userAgent,
          referrer: saved[0].referrer,
          language: saved[0].language,
          screenResolution: saved[0].screenResolution || "N/A",
          createdAt: saved[0].createdAt || new Date(),
        };
      }
    } catch (err: any) {
      handleDbFailure(err, "saveVisitor");
    }
  }

  // Resilient In-Memory Fallback
  const record: VisitorRecord = {
    id: ++visitorSeq,
    userAgent: data.userAgent || "Unknown Browser",
    referrer: data.referrer || "Direct Land",
    language: data.language || "ar",
    screenResolution: data.screenResolution || "N/A",
    createdAt: new Date(),
  };
  memoryVisitors.unshift(record);
  return record;
}

export async function getRecentVisitors(limit = 100): Promise<VisitorRecord[]> {
  if (!isDbCooldownActive()) {
    try {
      const list = await db
        .select()
        .from(visitors)
        .orderBy(desc(visitors.createdAt))
        .limit(limit);
      return list.map(v => ({
        id: v.id,
        userAgent: v.userAgent,
        referrer: v.referrer,
        language: v.language,
        screenResolution: v.screenResolution,
        createdAt: v.createdAt || new Date(),
      }));
    } catch (err: any) {
      handleDbFailure(err, "getRecentVisitors");
    }
  }

  return memoryVisitors.slice(0, limit);
}

// ----------------------
// CHAT MESSAGES
// ----------------------
export async function getChatMessages(sessionId: string): Promise<ChatMessageRecord[]> {
  if (!isDbCooldownActive()) {
    try {
      const history = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, sessionId))
        .orderBy(chatMessages.createdAt);

      return history.map(m => ({
        id: m.id,
        userId: m.userId,
        sessionId: m.sessionId,
        role: m.role,
        text: m.text,
        createdAt: m.createdAt || new Date(),
      }));
    } catch (err: any) {
      handleDbFailure(err, "getChatMessages");
    }
  }

  return memoryChatMessages
    .filter(m => m.sessionId === sessionId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function saveChatMessage(msg: {
  userId?: number | null;
  sessionId: string;
  role: string;
  text: string;
}): Promise<ChatMessageRecord> {
  if (!isDbCooldownActive()) {
    try {
      const saved = await db.insert(chatMessages).values({
        userId: msg.userId ?? null,
        sessionId: msg.sessionId,
        role: msg.role,
        text: msg.text,
      }).returning();

      if (saved && saved[0]) {
        return {
          id: saved[0].id,
          userId: saved[0].userId,
          sessionId: saved[0].sessionId,
          role: saved[0].role,
          text: saved[0].text,
          createdAt: saved[0].createdAt || new Date(),
        };
      }
    } catch (err: any) {
      handleDbFailure(err, "saveChatMessage");
    }
  }

  const record: ChatMessageRecord = {
    id: ++messageSeq,
    userId: msg.userId ?? null,
    sessionId: msg.sessionId,
    role: msg.role,
    text: msg.text,
    createdAt: new Date(),
  };
  memoryChatMessages.push(record);
  return record;
}

// ----------------------
// APPOINTMENTS
// ----------------------
export async function getBookedSlotsForDate(date: string): Promise<string[]> {
  if (!isDbCooldownActive()) {
    try {
      const booked = await db
        .select({ timeSlot: appointments.timeSlot })
        .from(appointments)
        .where(and(eq(appointments.date, date), eq(appointments.status, "booked")));

      return booked.map(b => b.timeSlot);
    } catch (err: any) {
      handleDbFailure(err, "getBookedSlotsForDate");
    }
  }

  return memoryAppointments
    .filter(a => a.date === date && a.status === "booked")
    .map(a => a.timeSlot);
}

export async function isSlotAlreadyBooked(date: string, timeSlot: string): Promise<boolean> {
  if (!isDbCooldownActive()) {
    try {
      const alreadyBooked = await db
        .select()
        .from(appointments)
        .where(and(
          eq(appointments.date, date),
          eq(appointments.timeSlot, timeSlot),
          eq(appointments.status, "booked")
        ));

      if (alreadyBooked.length > 0) return true;
    } catch (err: any) {
      handleDbFailure(err, "isSlotAlreadyBooked");
    }
  }

  return memoryAppointments.some(
    a => a.date === date && a.timeSlot === timeSlot && a.status === "booked"
  );
}

export async function createAppointment(data: {
  userId?: number | null;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  date: string;
  timeSlot: string;
  serviceType: string;
  notes?: string | null;
  keepNoteId?: string | null;
  gmailThreadId?: string | null;
  driveFileUrl?: string | null;
}): Promise<AppointmentRecord> {
  if (!isDbCooldownActive()) {
    try {
      const insertion = await db.insert(appointments).values({
        userId: data.userId ?? null,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail,
        date: data.date,
        timeSlot: data.timeSlot,
        serviceType: data.serviceType,
        notes: data.notes || "",
        keepNoteId: data.keepNoteId || null,
        gmailThreadId: data.gmailThreadId || null,
        driveFileUrl: data.driveFileUrl || null,
      }).returning();

      if (insertion && insertion[0]) {
        return {
          id: insertion[0].id,
          userId: insertion[0].userId,
          clientName: insertion[0].clientName,
          clientPhone: insertion[0].clientPhone,
          clientEmail: insertion[0].clientEmail,
          date: insertion[0].date,
          timeSlot: insertion[0].timeSlot,
          serviceType: insertion[0].serviceType,
          status: insertion[0].status,
          notes: insertion[0].notes,
          keepNoteId: insertion[0].keepNoteId,
          gmailThreadId: insertion[0].gmailThreadId,
          driveFileUrl: insertion[0].driveFileUrl,
          createdAt: insertion[0].createdAt || new Date(),
        };
      }
    } catch (err: any) {
      handleDbFailure(err, "createAppointment");
    }
  }

  const record: AppointmentRecord = {
    id: ++appointmentSeq,
    userId: data.userId ?? null,
    clientName: data.clientName,
    clientPhone: data.clientPhone,
    clientEmail: data.clientEmail,
    date: data.date,
    timeSlot: data.timeSlot,
    serviceType: data.serviceType,
    status: "booked",
    notes: data.notes || "",
    keepNoteId: data.keepNoteId || null,
    gmailThreadId: data.gmailThreadId || null,
    driveFileUrl: data.driveFileUrl || null,
    createdAt: new Date(),
  };
  memoryAppointments.push(record);
  return record;
}

export async function getUserAppointments(localUserId: number | null, uid?: string | null): Promise<AppointmentRecord[]> {
  if (!isDbCooldownActive() && localUserId !== null) {
    try {
      const list = await db
        .select()
        .from(appointments)
        .where(eq(appointments.userId, localUserId))
        .orderBy(desc(appointments.createdAt));

      return list.map(a => ({
        id: a.id,
        userId: a.userId,
        clientName: a.clientName,
        clientPhone: a.clientPhone,
        clientEmail: a.clientEmail,
        date: a.date,
        timeSlot: a.timeSlot,
        serviceType: a.serviceType,
        status: a.status,
        notes: a.notes,
        keepNoteId: a.keepNoteId,
        gmailThreadId: a.gmailThreadId,
        driveFileUrl: a.driveFileUrl,
        createdAt: a.createdAt || new Date(),
      }));
    } catch (err: any) {
      handleDbFailure(err, "getUserAppointments");
    }
  }

  return memoryAppointments
    .filter(a => (localUserId && a.userId === localUserId) || (uid && a.clientEmail?.includes(uid)))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ----------------------
// USERS
// ----------------------
export async function getOrCreateUserRecord(uid: string, email: string, name?: string | null): Promise<UserRecord> {
  if (!isDbCooldownActive()) {
    try {
      const result = await db.insert(users)
        .values({
          uid,
          email,
          name: name || null,
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email,
            name: name || null,
          },
        })
        .returning();

      if (result && result[0]) {
        return {
          id: result[0].id,
          uid: result[0].uid,
          email: result[0].email,
          name: result[0].name,
          createdAt: result[0].createdAt,
        };
      }
    } catch (err: any) {
      handleDbFailure(err, "getOrCreateUserRecord");
    }
  }

  // Memory fallback
  let existing = memoryUsers.get(uid);
  if (!existing) {
    existing = {
      id: ++userSeq,
      uid,
      email,
      name: name || null,
      createdAt: new Date(),
    };
    memoryUsers.set(uid, existing);
  } else {
    existing.email = email;
    if (name) existing.name = name;
  }
  return existing;
}

export async function findUserByUid(uid: string): Promise<UserRecord | null> {
  if (!isDbCooldownActive()) {
    try {
      const matched = await db.select().from(users).where(eq(users.uid, uid));
      if (matched.length > 0) {
        return {
          id: matched[0].id,
          uid: matched[0].uid,
          email: matched[0].email,
          name: matched[0].name,
          createdAt: matched[0].createdAt,
        };
      }
    } catch (err: any) {
      handleDbFailure(err, "findUserByUid");
    }
  }

  return memoryUsers.get(uid) || null;
}
