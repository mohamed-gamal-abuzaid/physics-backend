import { pgTable, serial, text, timestamp, integer, decimal } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { paymentProofStatusEnum } from './enums.js';

export const paymentProofs = pgTable('payment_proofs', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  packageName: text('package_name'),
  sessionsCount: integer('sessions_count'),
  creditType: text('credit_type'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text('payment_method'),
  senderAccountOrPhone: text('sender_account_or_phone'),
  transactionRef: text('transaction_ref'),
  screenshotUrl: text('screenshot_url').notNull(),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  status: paymentProofStatusEnum('status').default('PENDING').notNull(),
  notes: text('notes'),
  reviewedBy: integer('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at'),
  rejectionReason: text('rejection_reason'),
});