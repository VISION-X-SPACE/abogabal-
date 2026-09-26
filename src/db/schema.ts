/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { integer, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  clientName: text('client_name').notNull(),
  clientPhone: text('client_phone').notNull(),
  clientEmail: text('client_email').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  timeSlot: text('time_slot').notNull(), // e.g., "10:00"
  serviceType: text('service_type').notNull(),
  status: text('status').default('booked').notNull(), // booked, cancelled, completed
  notes: text('notes'),
  keepNoteId: text('keep_note_id'),
  gmailThreadId: text('gmail_thread_id'),
  driveFileUrl: text('drive_file_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  sessionId: text('session_id').notNull(), // For storing guest and tracked chat sessions
  role: text('role').notNull(), // 'user' or 'model'
  text: text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  appointments: many(appointments),
  chatMessages: many(chatMessages),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  user: one(users, {
    fields: [appointments.userId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const visitors = pgTable('visitors', {
  id: serial('id').primaryKey(),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  language: text('language'),
  screenResolution: text('screen_resolution'),
  createdAt: timestamp('created_at').defaultNow(),
});
