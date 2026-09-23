import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination.js';

export const listSchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  status: z.string().max(50).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  phone: z.string().max(20).nullable().optional(),
  avatar: z.string().url().nullable().optional(),
});

export const createSubmissionSchema = z.object({
  fileName: z.string().max(255).optional(),
  fileSize: z.string().max(50).optional(),
  fileUrl: z.string().url().optional(),
});

export const createSessionSchema = z.object({
  teacherId: z.number().int().positive(),
  assignedHomeworkId: z.number().int().positive().optional(),
  courseName: z.string().max(255).optional(),
  topic: z.string().max(255).optional(),
  sessionFormat: z.enum(['PRIVATE', 'GROUP']).default('PRIVATE'),
  date: z.coerce.date(),
  time: z.string().max(50).optional(),
  durationMinutes: z.number().int().positive().max(480).default(60),
  location: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
});

export const rescheduleSessionSchema = z.object({
  date: z.coerce.date(),
  time: z.string().max(50).optional(),
});

export const createPaymentSchema = z.object({
  packageName: z.string().max(255).optional(),
  sessionsCount: z.number().int().positive().optional(),
  creditType: z.string().max(100).optional(),
  amount: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d{1,2})?$/)]),
  paymentMethod: z.string().max(100).optional(),
  senderAccountOrPhone: z.string().max(255).optional(),
  transactionRef: z.string().max(255).optional(),
  screenshotUrl: z.string().url(),
});

export const createReviewSchema = z.object({
  name: z.string().min(2).max(100),
  cohort: z.string().max(100).optional(),
  content: z.string().min(3).max(2000),
  rating: z.number().int().min(1).max(5).default(5),
});

export const createTicketSchema = z.object({
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(255),
  category: z.string().trim().min(2, 'Category is required').max(100),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  message: z.string().trim().min(3, 'Message must be at least 3 characters').max(5000),
  requesterRole: z.enum(['student', 'parent']).default('student'),
});

export const addTicketMessageSchema = z.object({
  text: z.string().trim().min(1, 'Message text is required').max(5000),
});

export const resourceListSchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  course: z.string().trim().max(100).optional(),
  topic: z.string().trim().max(100).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type AddTicketMessageInput = z.infer<typeof addTicketMessageSchema>;
export type ListInput = z.infer<typeof listSchema>;
export type ResourceListInput = z.infer<typeof resourceListSchema>;
export type RescheduleSessionInput = z.infer<typeof rescheduleSessionSchema>;

