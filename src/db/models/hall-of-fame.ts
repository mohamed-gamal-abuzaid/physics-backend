import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const hallOfFame = pgTable('hall_of_fame', {
  id: serial('id').primaryKey(),
  studentName: text('student_name').notNull(),
  avatar: text('avatar'),
  cohort: text('cohort'),
  superlativeBadge: text('superlative_badge'),
  quote: text('quote'),
  admittedUniversity: text('admitted_university'),
  gradeOrScore: text('grade_or_score'),
  curriculum: text('curriculum'),
  majorField: text('major_field'),
  mentorLetter: text('mentor_letter'),
  mentorName: text('mentor_name'),
  graduationDate: timestamp('graduation_date'),
  honors: text('honors'),
  certificateId: text('certificate_id'),
});