import { pgTable, serial, text, timestamp, integer, boolean, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { assignments } from './assignments.js';
import { sessionStatusEnum, sessionFormatEnum } from './enums.js';

export const bookingSessions = pgTable('booking_sessions', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => users.id, { onDelete: 'cascade' }),
  teacherId: integer('teacher_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  assignedHomeworkId: integer('assigned_homework_id').references(() => assignments.id, { onDelete: 'set null' }),
  courseName: text('course_name'),
  topic: text('topic'),
  sessionFormat: sessionFormatEnum('session_format').default('PRIVATE'),
  date: timestamp('date').notNull(),
  time: text('time'),
  durationMinutes: integer('duration_minutes').default(60),
  location: text('location'),
  status: sessionStatusEnum('status').default('SCHEDULED').notNull(),
  isArchived: boolean('is_archived').default(false),
  creditDeducted: boolean('credit_deducted').default(false),
  creditTypeDeducted: text('credit_type_deducted'),
  meetingLink: text('meeting_link'),
  notes: text('notes'),
  maxStudents: integer('max_students').default(10),
  sessionNotes: jsonb('session_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessionStudents = pgTable('session_students', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => bookingSessions.id, { onDelete: 'cascade' }).notNull(),
  studentId: integer('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('session_students_session_student_idx').on(table.sessionId, table.studentId),
]);