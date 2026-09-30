import { pgTable, serial, text, varchar, timestamp, integer, decimal } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { invoiceStatusEnum } from './enums.js';

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  studentId: integer('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  parentName: text('parent_name'),
  packageName: text('package_name'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  issueDate: timestamp('issue_date').defaultNow().notNull(),
  dueDate: timestamp('due_date'),
  status: invoiceStatusEnum('status').default('UNPAID').notNull(),
  paymentMethod: text('payment_method'),
  paidAt: timestamp('paid_at'),
  referenceNote: text('reference_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
