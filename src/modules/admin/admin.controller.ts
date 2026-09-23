import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { adminService } from './admin.service.js';
import {
  addStudentAccountSchema,
  adjustCreditsSchema,
  adminTicketMessageSchema,
  assignmentSchema,
  assignScholarSchema,
  campaignSchema,
  completeSessionSchema,
  createInvoiceSchema,
  crmListSchema,
  gradeSchema,
  hallOfFameSchema,
  listSchema,
  paymentReviewSchema,
  resourceListSchema,
  resourceSchema,
  reviewModerationSchema,
  sessionStatusSchema,
  settingsSchema,
  updateInvoiceStatusSchema,
  updateStudentStatusSchema,
  updateTicketSchema,
  updateUserSchema,
} from './admin.schema.js';

const actorId = (req: AuthRequest) => req.user!.id;
const errorStatus: Record<string, number> = {
  USER_NOT_FOUND: 404,
  ASSIGNMENT_NOT_FOUND: 404,
  SUBMISSION_NOT_FOUND: 404,
  SESSION_NOT_FOUND: 404,
  PAYMENT_NOT_FOUND: 404,
  RESOURCE_NOT_FOUND: 404,
  PAYMENT_ALREADY_REVIEWED: 409,
  INVOICE_NOT_FOUND: 404,
  TICKET_NOT_FOUND: 404,
  REVIEW_NOT_FOUND: 404,
  HALL_OF_FAME_NOT_FOUND: 404,
  CAMPAIGN_NOT_FOUND: 404,
  EMAIL_EXISTS: 409,
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
export const sessions = async (req: AuthRequest, res: Response) => {
  const validation = listSchema.safeParse(req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ sessions: await adminService.listSessions(validation.data) }); } catch (error) { return handleError(res, error); }
};
export const updateSession = async (req: AuthRequest, res: Response) => {
  const validation = sessionStatusSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ session: await adminService.updateSession(parseId(req.params.id), validation.data) }); } catch (error) { return handleError(res, error); }
};
export const completeSession = async (req: AuthRequest, res: Response) => {
  const validation = completeSessionSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ session: await adminService.completeSession(parseId(req.params.id), actorId(req), validation.data) }); }
  catch (error) { return handleError(res, error); }
};
export const approveSession = async (req: AuthRequest, res: Response) => {
  try { return res.json({ session: await adminService.approveSession(parseId(req.params.id), actorId(req)) }); }
  catch (error) { return handleError(res, error); }
};
export const rejectSession = async (req: AuthRequest, res: Response) => {
  try {
    const reason = typeof req.body?.reason === 'string' ? req.body.reason : undefined;
    return res.json({ session: await adminService.rejectSession(parseId(req.params.id), actorId(req), reason) });
  } catch (error) { return handleError(res, error); }
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
  const validation = resourceListSchema.safeParse(_req.query);
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

export const invoices = async (req: AuthRequest, res: Response) => {
  const validation = listSchema.safeParse(req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ invoices: await adminService.listInvoices(validation.data) }); }
  catch (error) { return handleError(res, error); }
};
export const invoice = async (req: AuthRequest, res: Response) => {
  try { return res.json({ invoice: await adminService.getInvoice(parseId(req.params.id)) }); }
  catch (error) { return handleError(res, error); }
};
export const createInvoice = async (req: AuthRequest, res: Response) => {
  const validation = createInvoiceSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.status(201).json({ invoice: await adminService.createInvoice(validation.data) }); }
  catch (error) { return handleError(res, error); }
};
export const updateInvoiceStatus = async (req: AuthRequest, res: Response) => {
  const validation = updateInvoiceStatusSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ invoice: await adminService.updateInvoiceStatus(parseId(req.params.id), validation.data) }); }
  catch (error) { return handleError(res, error); }
};

export const adjustCredits = async (req: AuthRequest, res: Response) => {
  const validation = adjustCreditsSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try {
    const profile = await adminService.adjustCredits(parseId(req.params.id), actorId(req), validation.data);
    return res.json({ profile, message: 'Credits adjusted successfully' });
  } catch (error) { return handleError(res, error); }
};

export const tickets = async (req: AuthRequest, res: Response) => {
  const validation = listSchema.safeParse(req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ tickets: await adminService.listTickets(validation.data) }); }
  catch (error) { return handleError(res, error); }
};
export const ticket = async (req: AuthRequest, res: Response) => {
  try { return res.json({ ticket: await adminService.getTicket(parseId(req.params.id)) }); }
  catch (error) { return handleError(res, error); }
};
export const replyTicket = async (req: AuthRequest, res: Response) => {
  const validation = adminTicketMessageSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ ticket: await adminService.replyTicket(parseId(req.params.id), actorId(req), validation.data) }); }
  catch (error) { return handleError(res, error); }
};
export const updateTicket = async (req: AuthRequest, res: Response) => {
  const validation = updateTicketSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ ticket: await adminService.updateTicket(parseId(req.params.id), validation.data) }); }
  catch (error) { return handleError(res, error); }
};

export const crmStudents = async (req: AuthRequest, res: Response) => {
  const validation = crmListSchema.safeParse(req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ students: await adminService.listCrmStudents(validation.data) }); }
  catch (error) { return handleError(res, error); }
};

export const waitingStudents = async (req: AuthRequest, res: Response) => {
  const validation = crmListSchema.safeParse(req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ students: await adminService.listWaitingStudents(validation.data) }); }
  catch (error) { return handleError(res, error); }
};

export const addStudent = async (req: AuthRequest, res: Response) => {
  const validation = addStudentAccountSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try {
    const result = await adminService.addStudentAccount(actorId(req), validation.data);
    return res.status(201).json(result);
  } catch (error) { return handleError(res, error); }
};

export const assignScholar = async (req: AuthRequest, res: Response) => {
  const validation = assignScholarSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try {
    const profile = await adminService.assignScholar(parseId(req.params.id), actorId(req), validation.data);
    return res.json({ profile, message: 'Scholar assignment updated successfully' });
  } catch (error) { return handleError(res, error); }
};

export const generateCredentials = async (req: AuthRequest, res: Response) => {
  try {
    const credentials = await adminService.generateStudentCredentials(parseId(req.params.id), actorId(req));
    return res.json({ credentials, message: 'Credentials generated successfully' });
  } catch (error) { return handleError(res, error); }
};

export const updateStudentStatus = async (req: AuthRequest, res: Response) => {
  const validation = updateStudentStatusSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try {
    const student = await adminService.updateStudentStatus(parseId(req.params.id), actorId(req), validation.data.status);
    return res.json({ student, message: 'Student status updated successfully' });
  } catch (error) { return handleError(res, error); }
};

export const reviews = async (req: AuthRequest, res: Response) => {
  const validation = listSchema.safeParse(req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ reviews: await adminService.listReviews(validation.data) }); }
  catch (error) { return handleError(res, error); }
};
export const moderateReview = async (req: AuthRequest, res: Response) => {
  const validation = reviewModerationSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ review: await adminService.moderateReview(parseId(req.params.id), validation.data) }); }
  catch (error) { return handleError(res, error); }
};
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try { await adminService.deleteReview(parseId(req.params.id)); return res.status(204).send(); }
  catch (error) { return handleError(res, error); }
};

export const hallOfFame = async (req: AuthRequest, res: Response) => {
  const validation = listSchema.safeParse(req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ hallOfFame: await adminService.listHallOfFame(validation.data) }); }
  catch (error) { return handleError(res, error); }
};
export const getHallOfFame = async (req: AuthRequest, res: Response) => {
  try { return res.json({ alumni: await adminService.getHallOfFame(parseId(req.params.id)) }); }
  catch (error) { return handleError(res, error); }
};
export const createHallOfFame = async (req: AuthRequest, res: Response) => {
  const validation = hallOfFameSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.status(201).json({ alumni: await adminService.createHallOfFame(validation.data) }); }
  catch (error) { return handleError(res, error); }
};
export const updateHallOfFame = async (req: AuthRequest, res: Response) => {
  const validation = hallOfFameSchema.partial().safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ alumni: await adminService.updateHallOfFame(parseId(req.params.id), validation.data) }); }
  catch (error) { return handleError(res, error); }
};
export const deleteHallOfFame = async (req: AuthRequest, res: Response) => {
  try { await adminService.deleteHallOfFame(parseId(req.params.id)); return res.status(204).send(); }
  catch (error) { return handleError(res, error); }
};

export const campaigns = async (req: AuthRequest, res: Response) => {
  const validation = listSchema.safeParse(req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ campaigns: await adminService.listCampaigns(validation.data) }); }
  catch (error) { return handleError(res, error); }
};
export const createCampaign = async (req: AuthRequest, res: Response) => {
  const validation = campaignSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.status(201).json({ campaign: await adminService.createCampaign(validation.data) }); }
  catch (error) { return handleError(res, error); }
};
export const updateCampaign = async (req: AuthRequest, res: Response) => {
  const validation = campaignSchema.partial().safeParse(req.body);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ campaign: await adminService.updateCampaign(parseId(req.params.id), validation.data) }); }
  catch (error) { return handleError(res, error); }
};
export const deleteCampaign = async (req: AuthRequest, res: Response) => {
  try { await adminService.deleteCampaign(parseId(req.params.id)); return res.status(204).send(); }
  catch (error) { return handleError(res, error); }
};
export const sendCampaign = async (req: AuthRequest, res: Response) => {
  try { return res.json(await adminService.sendCampaign(parseId(req.params.id), actorId(req))); }
  catch (error) { return handleError(res, error); }
};

export const outbox = async (req: AuthRequest, res: Response) => {
  const validation = listSchema.safeParse(req.query);
  if (!validation.success) return res.status(400).json({ errors: validation.error.format() });
  try { return res.json({ outbox: await adminService.listOutbox(validation.data) }); }
  catch (error) { return handleError(res, error); }
};