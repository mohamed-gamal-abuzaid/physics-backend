import { z } from 'zod';

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