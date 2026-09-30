import { z } from 'zod';

export const YEAR_VALUES = ['Y9', 'Y10', 'Y11', 'Y12', 'ELSE'] as const;

export const BOARD_VALUES = [
  'NIES',
  'OL_CAMBRIDGE',
  'AQA_PHYSICS',
  'OL_EDXECEL_LINEAR',
  'OL_EDXECEL_MODULAR_UNIT_1',
  'OL_EDXECEL_MODULAR_UNIT_2',
  'AS_CAMBRIDGE',
  'AL_EDXECEL_MODULAR_UNIT_1',
  'AL_EDXECEL_MODULAR_UNIT_2',
  'AL_EDXECEL_MODULAR_UNIT_3',
  'AL_EDXECEL_MODULAR_UNIT_4',
  'AL_EDXECEL_MODULAR_UNIT_5',
  'AL_EDXECEL_MODULAR_UNIT_6',
  'ELSE',
] as const;

const normalizeYear = (val: unknown) => {
  if (typeof val !== 'string') return val;
  const upper = val.trim().toUpperCase();
  if (upper === 'ELSE' || upper === 'OTHER') return 'ELSE';
  return upper;
};

const BOARD_LABEL_MAP: Record<string, (typeof BOARD_VALUES)[number]> = {
  'NIES': 'NIES',
  'NIES (NILE INTERNATIONAL EDUCATION SYSTEM)': 'NIES',
  'OL CAMBRIDGE': 'OL_CAMBRIDGE',
  'OL_CAMBRIDGE': 'OL_CAMBRIDGE',
  'AQA PHYSICS': 'AQA_PHYSICS',
  'AQA_PHYSICS': 'AQA_PHYSICS',
  'OL EDEXCEL LINEAR': 'OL_EDXECEL_LINEAR',
  'OL EDXECEL LINEAR': 'OL_EDXECEL_LINEAR',
  'OL_EDXECEL_LINEAR': 'OL_EDXECEL_LINEAR',
  'OL_EDEXCEL_LINEAR': 'OL_EDXECEL_LINEAR',
  'OL EDEXCEL MODULAR UNIT 1': 'OL_EDXECEL_MODULAR_UNIT_1',
  'OL EDXECEL MODULAR UNIT 1': 'OL_EDXECEL_MODULAR_UNIT_1',
  'OL_EDXECEL_MODULAR_UNIT_1': 'OL_EDXECEL_MODULAR_UNIT_1',
  'OL_EDEXCEL_MODULAR_UNIT_1': 'OL_EDXECEL_MODULAR_UNIT_1',
  'OL EDEXCEL MODULAR UNIT 2': 'OL_EDXECEL_MODULAR_UNIT_2',
  'OL EDXECEL MODULAR UNIT 2': 'OL_EDXECEL_MODULAR_UNIT_2',
  'OL_EDXECEL_MODULAR_UNIT_2': 'OL_EDXECEL_MODULAR_UNIT_2',
  'OL_EDEXCEL_MODULAR_UNIT_2': 'OL_EDXECEL_MODULAR_UNIT_2',
  'AS CAMBRIDGE': 'AS_CAMBRIDGE',
  'AS_CAMBRIDGE': 'AS_CAMBRIDGE',
  'AL EDEXCEL MODULAR UNIT 1': 'AL_EDXECEL_MODULAR_UNIT_1',
  'AL EDXECEL MODULAR UNIT 1': 'AL_EDXECEL_MODULAR_UNIT_1',
  'AL_EDXECEL_MODULAR_UNIT_1': 'AL_EDXECEL_MODULAR_UNIT_1',
  'AL_EDEXCEL_MODULAR_UNIT_1': 'AL_EDXECEL_MODULAR_UNIT_1',
  'AL EDEXCEL MODULAR UNIT 2': 'AL_EDXECEL_MODULAR_UNIT_2',
  'AL EDXECEL MODULAR UNIT 2': 'AL_EDXECEL_MODULAR_UNIT_2',
  'AL_EDXECEL_MODULAR_UNIT_2': 'AL_EDXECEL_MODULAR_UNIT_2',
  'AL_EDEXCEL_MODULAR_UNIT_2': 'AL_EDXECEL_MODULAR_UNIT_2',
  'AL EDEXCEL MODULAR UNIT 3': 'AL_EDXECEL_MODULAR_UNIT_3',
  'AL EDXECEL MODULAR UNIT 3': 'AL_EDXECEL_MODULAR_UNIT_3',
  'AL_EDXECEL_MODULAR_UNIT_3': 'AL_EDXECEL_MODULAR_UNIT_3',
  'AL_EDEXCEL_MODULAR_UNIT_3': 'AL_EDXECEL_MODULAR_UNIT_3',
  'AL EDEXCEL MODULAR UNIT 4': 'AL_EDXECEL_MODULAR_UNIT_4',
  'AL EDXECEL MODULAR UNIT 4': 'AL_EDXECEL_MODULAR_UNIT_4',
  'AL_EDXECEL_MODULAR_UNIT_4': 'AL_EDXECEL_MODULAR_UNIT_4',
  'AL_EDEXCEL_MODULAR_UNIT_4': 'AL_EDXECEL_MODULAR_UNIT_4',
  'AL EDEXCEL MODULAR UNIT 5': 'AL_EDXECEL_MODULAR_UNIT_5',
  'AL EDXECEL MODULAR UNIT 5': 'AL_EDXECEL_MODULAR_UNIT_5',
  'AL_EDXECEL_MODULAR_UNIT_5': 'AL_EDXECEL_MODULAR_UNIT_5',
  'AL_EDEXCEL_MODULAR_UNIT_5': 'AL_EDXECEL_MODULAR_UNIT_5',
  'AL EDEXCEL MODULAR UNIT 6': 'AL_EDXECEL_MODULAR_UNIT_6',
  'AL EDXECEL MODULAR UNIT 6': 'AL_EDXECEL_MODULAR_UNIT_6',
  'AL_EDXECEL_MODULAR_UNIT_6': 'AL_EDXECEL_MODULAR_UNIT_6',
  'AL_EDEXCEL_MODULAR_UNIT_6': 'AL_EDXECEL_MODULAR_UNIT_6',
  'ELSE': 'ELSE',
  'OTHER': 'ELSE',
};

const normalizeBoard = (val: unknown) => {
  if (typeof val !== 'string') return val;
  const upper = val.trim().toUpperCase();
  if (BOARD_LABEL_MAP[upper]) return BOARD_LABEL_MAP[upper];
  // Replace EDEXCEL with EDXECEL if present
  const transformed = upper.replace(/\s+/g, '_').replace(/-/g, '_').replace('EDEXCEL', 'EDXECEL');
  if ((BOARD_VALUES as readonly string[]).includes(transformed)) return transformed;
  return val;
};

export const yearSchema = z.preprocess(
  normalizeYear,
  z.enum(YEAR_VALUES, { message: 'Year must be one of: Y9, Y10, Y11, Y12, Else' })
);

export const boardSchema = z.preprocess(
  normalizeBoard,
  z.enum(BOARD_VALUES, { message: 'Invalid Board selection' })
);

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Maximum length is 50 characters'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  schoolName: z.string().trim().min(1, 'School name is required').max(255),
  year: yearSchema,
  board: boardSchema,
  studentPhoneNumber: z.string().trim().min(1, 'Student phone number is required').max(20).optional(),
  studentPhone: z.string().trim().max(20).optional(),
  parentPhoneNumber: z.string().trim().min(1, 'Parent phone number is required').max(20).optional(),
  parentPhone: z.string().trim().max(20).optional(),
  phone: z.string().trim().max(20).optional(),
}).refine(
  (data) => Boolean(data.studentPhoneNumber || data.studentPhone || data.phone),
  { message: 'Student phone number is required', path: ['studentPhoneNumber'] }
).refine(
  (data) => Boolean(data.parentPhoneNumber || data.parentPhone),
  { message: 'Parent phone number is required', path: ['parentPhoneNumber'] }
);

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;