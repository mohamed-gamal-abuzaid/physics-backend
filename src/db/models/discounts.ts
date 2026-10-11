import { pgTable, serial, text, varchar, timestamp, integer, decimal, boolean } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { discountScopeEnum, discountTypeEnum } from './enums.js';

export const discounts = pgTable('discounts', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  scope: discountScopeEnum('scope').default('ALL').notNull(),
  targetLevel: text('target_level'),
  targetStudentId: integer('target_student_id').references(() => users.id, { onDelete: 'cascade' }),
  discountType: discountTypeEnum('discount_type').default('PERCENTAGE').notNull(),
  value: decimal('value', { precision: 10, scale: 2 }).notNull(),
  minSessionsCount: integer('min_sessions_count').default(1),
  maxUsageCount: integer('max_usage_count'),
  currentUsageCount: integer('current_usage_count').default(0).notNull(),
  validFrom: timestamp('valid_from'),
  validUntil: timestamp('valid_until'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Discount = typeof discounts.$inferSelect;
export type NewDiscount = typeof discounts.$inferInsert;
