import { pgTable, serial, text, varchar, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { ticketPriorityEnum, ticketStatusEnum } from './enums.js';

export interface TicketMessage {
  id: string;
  sender: string;
  role: string;
  text: string;
  timestamp: string;
  avatar?: string;
}

export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  ticketNumber: varchar('ticket_number', { length: 50 }).notNull().unique(),
  studentId: integer('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  requesterRole: varchar('requester_role', { length: 20 }).default('student').notNull(),
  subject: text('subject').notNull(),
  category: text('category').notNull(),
  priority: ticketPriorityEnum('priority').default('MEDIUM').notNull(),
  status: ticketStatusEnum('status').default('OPEN').notNull(),
  messages: jsonb('messages').$type<TicketMessage[]>().default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
