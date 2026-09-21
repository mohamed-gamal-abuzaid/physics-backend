import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { reviewStatusEnum } from './enums.js';

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => users.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  cohort: text('cohort'),
  content: text('content').notNull(),
  rating: integer('rating').default(5),
  status: reviewStatusEnum('status').default('PENDING').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});