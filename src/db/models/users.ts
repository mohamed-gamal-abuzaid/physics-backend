import { pgTable, serial, text, varchar, timestamp, integer, decimal, boolean } from 'drizzle-orm/pg-core';
import { userRoleEnum } from './enums.js';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  googleId: varchar('google_id', { length: 255 }).unique(),
  password: text('password'), 
  phone: varchar('phone', { length: 20 }),
  role: userRoleEnum('role').default('STUDENT').notNull(),
  avatar: text('avatar'),
  specialty: text('specialty'),
  status: varchar('status', { length: 50 }).default('ACTIVE'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const studentProfiles = pgTable('student_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  parentName: text('parent_name'),
  parentEmail: varchar('parent_email', { length: 255 }),
  parentPhone: varchar('parent_phone', { length: 20 }),
  gradeLevel: text('grade_level'),
  cohort: text('cohort'),
  totalCredits: integer('total_credits').default(0),
  remainingCredits: integer('remaining_credits').default(0),
  remainingPrivateCredits: integer('remaining_private_credits').default(0),
  remainingGroupCredits: integer('remaining_group_credits').default(0),
  attendanceRate: decimal('attendance_rate', { precision: 5, scale: 2 }).default('0.00'),
  averageScore: decimal('average_score', { precision: 5, scale: 2 }).default('0.00'),
  enrolledCourse: text('enrolled_course'),
  schoolName: text('school_name'),
  academicYear: text('academic_year'),
  examBoard: text('exam_board'),
  examSession: text('exam_session'),
  hardestTopic: text('hardest_topic'),
  meetingLink: text('meeting_link'),
  isAccountGranted: boolean('is_account_granted').default(false),
  generatedPassword: text('generated_password'),
  passwordGeneratedAt: timestamp('password_generated_at'),
  assignedTeacherId: integer('assigned_teacher_id').references(() => users.id, { onDelete: 'set null' }),
  registeredVia: varchar('registered_via', { length: 100 }),
  joinedDate: timestamp('joined_date').defaultNow(),
  notes: text('notes'),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserRole = (typeof userRoleEnum.enumValues)[number];