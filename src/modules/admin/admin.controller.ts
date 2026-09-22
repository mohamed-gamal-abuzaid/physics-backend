import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { adminService } from './admin.service.js';
import {
  assignmentSchema, gradeSchema, paymentReviewSchema, resourceSchema,
  sessionStatusSchema, settingsSchema, updateUserSchema, listSchema,
} from './admin.schema.js';

const actorId = (req: AuthRequest) => req.user!.id;
const errorStatus: Record<string, number> = {
  USER_NOT_FOUND: 404, ASSIGNMENT_NOT_FOUND: 404, SUBMISSION_NOT_FOUND: 404,
  SESSION_NOT_FOUND: 404, PAYMENT_NOT_FOUND: 404, RESOURCE_NOT_FOUND: 404,
  PAYMENT_ALREADY_REVIEWED: 409,
};
const handleError = (res: Response, error: any) => {
  const status = errorStatus[error.message] || 500;
  return res.status(status).json({ message: status === 500 ? 'An error occurred' : error.message });
};
const parseId = (value: string | string[]) => Number(Array.isArray(value) ? value[0] : value);

export const users = async (req: AuthRequest, res: Response) => {
  const validation = listSchema.safeParse(req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ users: await adminService.listUsers(validation.data) }); }
  catch (error) { return handleError(res, error); }
};
export const updateUser = async (req: AuthRequest, res: Response) => {
  const validation = updateUserSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ user: await adminService.updateUser(parseId(req.params.id), validation.data) }); }
  catch (error) { return handleError(res, error); }
};
export const assignments = async (_req: AuthRequest, res: Response) => {
  const validation = listSchema.safeParse(_req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ assignments: await adminService.listAssignments(validation.data) }); } catch (error) { return handleError(res, error); }
};
export const createAssignment = async (req: AuthRequest, res: Response) => {
  const validation = assignmentSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.status(201).json({ assignment: await adminService.createAssignment(validation.data) }); } catch (error) { return handleError(res, error); }
};
export const updateAssignment = async (req: AuthRequest, res: Response) => {
  const validation = assignmentSchema.partial().safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ assignment: await adminService.updateAssignment(parseId(req.params.id), validation.data) }); } catch (error) { return handleError(res, error); }
};
export const deleteAssignment = async (req: AuthRequest, res: Response) => {
  try { await adminService.deleteAssignment(parseId(req.params.id)); return res.status(204).send(); } catch (error) { return handleError(res, error); }
};
export const submissions = async (_req: AuthRequest, res: Response) => {
  const validation = listSchema.safeParse(_req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ submissions: await adminService.listSubmissions(validation.data) }); } catch (error) { return handleError(res, error); }
};
export const gradeSubmission = async (req: AuthRequest, res: Response) => {
  const validation = gradeSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ submission: await adminService.gradeSubmission(parseId(req.params.id), validation.data) }); } catch (error) { return handleError(res, error); }
};
export const sessions = async (_req: AuthRequest, res: Response) => {
  const validation = listSchema.safeParse(_req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ sessions: await adminService.listSessions(validation.data) }); } catch (error) { return handleError(res, error); }
};
export const updateSession = async (req: AuthRequest, res: Response) => {
  const validation = sessionStatusSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ session: await adminService.updateSession(parseId(req.params.id), validation.data) }); } catch (error) { return handleError(res, error); }
};
export const payments = async (_req: AuthRequest, res: Response) => {
  const validation = listSchema.safeParse(_req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ payments: await adminService.listPayments(validation.data) }); } catch (error) { return handleError(res, error); }
};
export const reviewPayment = async (req: AuthRequest, res: Response) => {
  const validation = paymentReviewSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ payment: await adminService.reviewPayment(parseId(req.params.id), actorId(req), validation.data) }); } catch (error) { return handleError(res, error); }
};
export const resources = async (_req: AuthRequest, res: Response) => {
  const validation = listSchema.safeParse(_req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ resources: await adminService.listResources(validation.data) }); } catch (error) { return handleError(res, error); }
};
export const createResource = async (req: AuthRequest, res: Response) => {
  const validation = resourceSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.status(201).json({ resource: await adminService.createResource(validation.data) }); } catch (error) { return handleError(res, error); }
};
export const updateResource = async (req: AuthRequest, res: Response) => {
  const validation = resourceSchema.partial().safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ resource: await adminService.updateResource(parseId(req.params.id), validation.data) }); } catch (error) { return handleError(res, error); }
};
export const deleteResource = async (req: AuthRequest, res: Response) => {
  try { await adminService.deleteResource(parseId(req.params.id)); return res.status(204).send(); } catch (error) { return handleError(res, error); }
};
export const getSettings = async (_req: AuthRequest, res: Response) => {
  try { return res.json({ settings: await adminService.getSettings() }); } catch (error) { return handleError(res, error); }
};
export const updateSettings = async (req: AuthRequest, res: Response) => {
  const validation = settingsSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ settings: await adminService.updateSettings(validation.data) }); } catch (error) { return handleError(res, error); }
};