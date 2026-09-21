import { pgTable, serial, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const assignments = pgTable('assignments', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  course: text('course'),
  module: text('module'),
  description: text('description'),
  dueDate: timestamp('due_date'),
  totalPoints: integer('total_points').default(100),
  studentId: integer('student_id').references(() => users.id, { onDelete: 'cascade' }),
  assignedStudentIds: jsonb('assigned_student_ids'),
  attachments: jsonb('attachments'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});