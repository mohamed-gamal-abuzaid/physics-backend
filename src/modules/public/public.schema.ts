import { z } from 'zod';

export const trialRegistrationSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  phone: z.string().trim().min(5, 'Phone number is required').max(20),
  parentName: z.string().trim().max(100).optional(),
  parentPhone: z.string().trim().max(20).optional(),
  parentEmail: z.string().trim().email('Invalid parent email').toLowerCase().optional(),
  gradeLevel: z.string().trim().max(100).optional(),
  cohort: z.string().trim().max(100).optional(),
  schoolName: z.string().trim().max(255).optional(),
  academicYear: z.string().trim().max(100).optional(),
  examBoard: z.string().trim().max(100).optional(),
  examSession: z.string().trim().max(100).optional(),
  hardestTopic: z.string().trim().max(255).optional(),
  enrolledCourse: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const bookSessionInquirySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  phone: z.string().trim().min(5, 'Phone number is required').max(20),
  gradeLevel: z.string().trim().max(100).optional(),
  sessionFormat: z.enum(['PRIVATE', 'GROUP']).default('PRIVATE'),
  courseName: z.string().trim().max(255).optional(),
  topic: z.string().trim().max(255).optional(),
  preferredDate: z.coerce.date().optional(),
  preferredTime: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type TrialRegistrationInput = z.infer<typeof trialRegistrationSchema>;
export type BookSessionInquiryInput = z.infer<typeof bookSessionInquirySchema>;
