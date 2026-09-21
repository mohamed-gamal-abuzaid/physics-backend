import { pgTable, serial, text, timestamp, integer, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const outboxEmails = pgTable('outbox_emails', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => users.id, { onDelete: 'set null' }),
  recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  sentAt: timestamp('sent_at'),
  status: varchar('status', { length: 50 }).default('PENDING'),
  provider: varchar('provider', { length: 50 }),
  error: text('error'),
});