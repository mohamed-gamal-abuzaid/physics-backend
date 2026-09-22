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

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ListInput = z.infer<typeof listSchema>;
export type RescheduleSessionInput = z.infer<typeof rescheduleSessionSchema>;
