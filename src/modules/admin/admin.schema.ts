import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination.js';

export const listSchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  role: z.enum(['ADMIN', 'STUDENT']).optional(),
  status: z.string().max(50).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  phone: z.string().max(20).nullable().optional(),
  role: z.enum(['ADMIN', 'STUDENT']).optional(),
  status: z.string().max(50).optional(),
});

export const assignmentSchema = z.object({
  title: z.string().min(1).max(255),
  course: z.string().max(255).optional(),
  module: z.string().max(255).optional(),
  description: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  totalPoints: z.number().int().positive().optional(),
  studentId: z.number().int().positive().nullable().optional(),
  assignedStudentIds: z.array(z.number().int().positive()).optional(),
  attachments: z.array(z.unknown()).optional(),
});

export const gradeSchema = z.object({
  score: z.number().min(0).optional(),
  letterGrade: z.string().max(5).optional(),
  feedbackNotes: z.string().max(5000).optional(),
});

export const sessionStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']),
  meetingLink: z.string().url().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const paymentReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().max(2000).optional(),
  rejectionReason: z.string().max(2000).optional(),
});

export const resourceSchema = z.object({
  title: z.string().min(1).max(255),
  category: z.string().max(100).optional(),
  course: z.string().max(255).optional(),
  topic: z.string().max(255).optional(),
  fileFormat: z.string().max(20).optional(),
  fileSize: z.string().max(50).optional(),
  author: z.string().max(255).optional(),
  description: z.string().optional(),
  previewUrl: z.string().url().optional(),
  fileUrl: z.string().url().optional(),
  badge: z.string().max(100).optional(),
});

export const settingsSchema = z.object({
  curriculaOptions: z.unknown().optional(),
  examSessionOptions: z.unknown().optional(),
  introVideoUrl: z.string().url().nullable().optional(),
  sessionPricing: z.unknown().optional(),
});

export const createInvoiceSchema = z.object({
  studentId: z.number().int().positive(),
  parentName: z.string().trim().max(100).optional(),
  packageName: z.string().trim().max(255).optional(),
  amount: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d{1,2})?$/)]),
  dueDate: z.coerce.date().optional(),
  status: z.enum(['UNPAID', 'PAID', 'OVERDUE', 'CANCELLED']).default('UNPAID'),
  paymentMethod: z.string().trim().max(100).optional(),
  referenceNote: z.string().trim().max(2000).optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['UNPAID', 'PAID', 'OVERDUE', 'CANCELLED']),
  paymentMethod: z.string().trim().max(100).optional(),
  referenceNote: z.string().trim().max(2000).optional(),
  paidAt: z.coerce.date().optional(),
});

export const adjustCreditsSchema = z.object({
  creditType: z.enum(['1-to-1', 'group', 'general']),
  amount: z.number().int(),
  reason: z.string().trim().min(3, 'Reason must be at least 3 characters').max(500),
});

export const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

export const adminTicketMessageSchema = z.object({
  text: z.string().trim().min(1, 'Message text is required').max(5000),
});

export const crmListSchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  status: z.string().max(50).optional(),
  cohort: z.string().max(100).optional(),
  teacherId: z.coerce.number().int().positive().optional(),
  registeredVia: z.string().max(100).optional(),
});

export const addStudentAccountSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  phone: z.string().trim().max(20).optional(),
  parentName: z.string().trim().max(100).optional(),
  parentPhone: z.string().trim().max(20).optional(),
  parentEmail: z.string().trim().email('Invalid parent email').toLowerCase().optional(),
  gradeLevel: z.string().trim().max(100).optional(),
  cohort: z.string().trim().max(100).optional(),
  enrolledCourse: z.string().trim().max(255).optional(),
  assignedTeacherId: z.coerce.number().int().positive().nullable().optional(),
  meetingLink: z.string().trim().url().nullable().optional(),
  schoolName: z.string().trim().max(255).optional(),
  academicYear: z.string().trim().max(100).optional(),
  examBoard: z.string().trim().max(100).optional(),
  examSession: z.string().trim().max(100).optional(),
  hardestTopic: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(2000).optional(),
  status: z.string().max(50).default('Active'),
  generateCredentials: z.boolean().default(true),
});

export const assignScholarSchema = z.object({
  assignedTeacherId: z.coerce.number().int().positive().nullable().optional(),
  cohort: z.string().trim().max(100).optional(),
  enrolledCourse: z.string().trim().max(255).optional(),
  meetingLink: z.string().trim().url().nullable().optional(),
  gradeLevel: z.string().trim().max(100).optional(),
});

export const updateStudentStatusSchema = z.object({
  status: z.string().trim().min(1).max(50),
});

export const completeSessionSchema = z.object({
  sessionNotes: z.object({
    title: z.string().optional(),
    summaryNotes: z.string().optional(),
    keyConcepts: z.array(z.string()).optional(),
    pdfFileName: z.string().optional(),
    pdfFileSize: z.string().optional(),
    pdfFileDataUrl: z.string().optional(),
    whiteboardSnapshotUrl: z.string().optional(),
  }).optional(),
  assignedHomeworkId: z.coerce.number().int().positive().optional(),
  assignedHomework: z.object({
    title: z.string().min(1),
    dueDate: z.coerce.date().optional(),
    totalPoints: z.number().int().positive().optional(),
    description: z.string().optional(),
  }).optional(),
  notes: z.string().max(2000).optional(),
});

export const reviewModerationSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  name: z.string().min(1).max(100).optional(),
  cohort: z.string().max(100).optional(),
  content: z.string().min(1).max(2000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export const hallOfFameSchema = z.object({
  studentName: z.string().trim().min(2, 'Student name is required').max(100),
  avatar: z.string().url().nullable().optional(),
  cohort: z.string().max(100).optional(),
  superlativeBadge: z.string().max(100).optional(),
  quote: z.string().max(500).optional(),
  admittedUniversity: z.string().max(255).optional(),
  gradeOrScore: z.string().max(100).optional(),
  curriculum: z.string().max(100).optional(),
  majorField: z.string().max(255).optional(),
  mentorLetter: z.string().max(3000).optional(),
  mentorName: z.string().max(100).optional(),
  graduationDate: z.coerce.date().optional(),
  honors: z.union([z.array(z.string()), z.string()]).optional(),
  certificateId: z.string().max(100).optional(),
});

export const campaignSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  subject: z.string().trim().min(1, 'Subject is required').max(255),
  previewSnippet: z.string().trim().max(500).optional(),
  targetAudience: z.string().max(100).default('Everyone'),
  status: z.enum(['DRAFT', 'SENDING', 'SENT', 'FAILED']).default('DRAFT'),
});

export const resourceListSchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  course: z.string().trim().max(100).optional(),
  topic: z.string().trim().max(100).optional(),
});