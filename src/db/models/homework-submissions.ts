import { pgTable, serial, text, timestamp, integer, decimal, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { assignments } from './assignments.js';
import { homeworkStatusEnum } from './enums.js';
import { jsonb } from 'drizzle-orm/pg-core';

export const homeworkSubmissions = pgTable('homework_submissions', {
  id: serial('id').primaryKey(),
  assignmentId: integer('assignment_id').references(() => assignments.id, { onDelete: 'cascade' }).notNull(),
  studentId: integer('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  fileName: text('file_name'),
  fileSize: text('file_size'),
  fileUrl: text('file_url'),
  status: homeworkStatusEnum('status').default('SUBMITTED').notNull(),
  score: decimal('score', { precision: 5, scale: 2 }),
  letterGrade: varchar('letter_grade', { length: 5 }),
  feedbackNotes: text('feedback_notes'),
  gradedBy: integer('graded_by').references(() => users.id, { onDelete: 'set null' }),
  gradedAt: timestamp('graded_at'),
  rubricScores: jsonb('rubric_scores'),
});