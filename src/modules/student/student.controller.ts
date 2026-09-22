import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { studentService } from './student.service.js';
import {
  createPaymentSchema,
  createReviewSchema,
  createSessionSchema,
  createSubmissionSchema,
  listSchema,
  rescheduleSessionSchema,
  updateProfileSchema,
} from './student.schema.js';

const userId = (req: AuthRequest) => {
  if (!req.user) throw new Error('UNAUTHORIZED');
  return req.user.id;
};

const handleError = (res: Response, error: any) => {
  const statuses: Record<string, number> = {
    STUDENT_NOT_FOUND: 404,
    ASSIGNMENT_NOT_FOUND: 404,
    NOTIFICATION_NOT_FOUND: 404,
    SUBMISSION_EXISTS: 409,
    TEACHER_NOT_FOUND: 404,
    SESSION_NOT_FOUND: 404,
    SESSION_DATE_INVALID: 400,
    INSUFFICIENT_CREDITS: 400,
    ASSIGNMENT_DEADLINE_PASSED: 400,
  };
  const status = statuses[error.message] || 500;
  return res.status(status).json({ message: status === 500 ? 'An error occurred' : error.message });
};

export const dashboard = async (req: AuthRequest, res: Response) => {
  const validation = listSchema.safeParse(req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ dashboard: await studentService.getDashboard(userId(req), validation.data) }); }
  catch (error) { return handleError(res, error); }
};

export const profile = async (req: AuthRequest, res: Response) => {
  try { return res.json({ profile: await studentService.getProfile(userId(req)) }); }
  catch (error) { return handleError(res, error); }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const validation = updateProfileSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ profile: await studentService.updateProfile(userId(req), validation.data) }); }
  catch (error) { return handleError(res, error); }
};

export const assignments = async (req: AuthRequest, res: Response) => {
  const validation = listSchema.safeParse(req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ assignments: await studentService.getAssignments(userId(req), validation.data) }); }
  catch (error) { return handleError(res, error); }
};

export const assignment = async (req: AuthRequest, res: Response) => {
  try { return res.json({ assignment: await studentService.getAssignment(userId(req), Number(req.params.id)) }); }
  catch (error) { return handleError(res, error); }
};

export const submissions = async (req: AuthRequest, res: Response) => {
  const validation = listSchema.safeParse(req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ submissions: await studentService.getSubmissions(userId(req), validation.data) }); }
  catch (error) { return handleError(res, error); }
};

export const submitAssignment = async (req: AuthRequest, res: Response) => {
  const validation = createSubmissionSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try {
    const submission = await studentService.createSubmission(userId(req), Number(req.params.assignmentId), validation.data);
    return res.status(201).json({ submission });
  } catch (error) { return handleError(res, error); }
};

export const sessions = async (req: AuthRequest, res: Response) => {
  const validation = listSchema.safeParse(req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ sessions: await studentService.getSessions(userId(req), validation.data) }); }
  catch (error) { return handleError(res, error); }
};

export const createSession = async (req: AuthRequest, res: Response) => {
  const validation = createSessionSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.status(201).json({ session: await studentService.createSession(userId(req), validation.data) }); }
  catch (error) { return handleError(res, error); }
};

export const rescheduleSession = async (req: AuthRequest, res: Response) => {
  const validation = rescheduleSessionSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ session: await studentService.rescheduleSession(userId(req), Number(req.params.id), validation.data) }); }
  catch (error) { return handleError(res, error); }
};

export const cancelSession = async (req: AuthRequest, res: Response) => {
  try { return res.json({ session: await studentService.cancelSession(userId(req), Number(req.params.id)) }); }
  catch (error) { return handleError(res, error); }
};

export const notifications = async (req: AuthRequest, res: Response) => {
  const validation = listSchema.safeParse(req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ notifications: await studentService.getNotifications(userId(req), validation.data) }); }
  catch (error) { return handleError(res, error); }
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  try { return res.json({ notification: await studentService.markNotificationRead(userId(req), Number(req.params.id)) }); }
  catch (error) { return handleError(res, error); }
};

export const resources = async (req: AuthRequest, res: Response) => {
  const validation = listSchema.safeParse(req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ resources: await studentService.getResources(validation.data) }); }
  catch (error) { return handleError(res, error); }
};

export const payments = async (req: AuthRequest, res: Response) => {
  const validation = listSchema.safeParse(req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ payments: await studentService.getPayments(userId(req), validation.data) }); }
  catch (error) { return handleError(res, error); }
};

export const createPayment = async (req: AuthRequest, res: Response) => {
  const validation = createPaymentSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.status(201).json({ payment: await studentService.createPayment(userId(req), validation.data) }); }
  catch (error) { return handleError(res, error); }
};

export const reviews = async (req: AuthRequest, res: Response) => {
  try { return res.json({ reviews: await studentService.getReviews(userId(req)) }); }
  catch (error) { return handleError(res, error); }
};

export const createReview = async (req: AuthRequest, res: Response) => {
  const validation = createReviewSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.status(201).json({ review: await studentService.createReview(userId(req), validation.data) }); }
  catch (error) { return handleError(res, error); }
};