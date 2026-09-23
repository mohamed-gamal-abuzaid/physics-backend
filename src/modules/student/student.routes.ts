import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import * as controller from './student.controller.js';

const router = Router();

/**
 * @openapi
 * /api/student/dashboard:
 *   get:
 *     summary: Get the student dashboard
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Dashboard data }, 401: { $ref: '#/components/responses/Unauthorized' } }
 * /api/student/profile:
 *   get:
 *     summary: Get the authenticated student profile
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Student profile } }
 *   patch:
 *     summary: Update the authenticated student profile
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/ProfileUpdate' } } } }
 *     responses: { 200: { description: Updated profile }, 400: { $ref: '#/components/responses/ValidationError' } }
 * /api/student/assignments:
 *   get:
 *     summary: List assignments assigned to the student
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Assignment list } }
 * /api/student/assignments/{id}:
 *   get:
 *     summary: Get one assigned assignment
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Assignment }, 404: { description: Assignment not found } }
 * /api/student/submissions:
 *   get:
 *     summary: List the student's submissions
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Submission list } }
 * /api/student/assignments/{assignmentId}/submissions:
 *   post:
 *     summary: Submit an assignment
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: assignmentId, in: path, required: true, schema: { type: integer } }]
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, properties: { fileName: { type: string }, fileUrl: { type: string, format: uri } } } } } }
 *     responses: { 201: { description: Submission created }, 409: { description: Already submitted } }
 * /api/student/sessions:
 *   get:
 *     summary: List the student's sessions
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Session list } }
 *   post:
 *     summary: Book a session
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/Session' } } } }
 *     responses: { 201: { description: Session created } }
 * /api/student/notifications:
 *   get:
 *     summary: List student notifications
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Notification list } }
 * /api/student/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Notification updated } }
 * /api/student/resources:
 *   get:
 *     summary: List learning resources with category filtering
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: search, in: query, schema: { type: string } }
 *       - { name: category, in: query, schema: { type: string } }
 *       - { name: course, in: query, schema: { type: string } }
 *       - { name: topic, in: query, schema: { type: string } }
 *     responses: { 200: { description: Resource list } }
 * /api/student/resources/{id}/download:
 *   post:
 *     summary: Increment resource download counter and get file download details
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Resource download info }, 404: { description: Resource not found } }
 * /api/student/payments:
 *   get:
 *     summary: List the student's payment proofs
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Payment list } }
 *   post:
 *     summary: Submit a payment proof
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/Payment' } } } }
 *     responses: { 201: { description: Payment created } }
 * /api/student/reviews:
 *   get:
 *     summary: List the student's reviews
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Review list } }
 *   post:
 *     summary: Submit a review
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Review created } }
 * /api/student/invoices:
 *   get:
 *     summary: List student billing invoices
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Invoice list } }
 * /api/student/invoices/{id}:
 *   get:
 *     summary: Get single invoice receipt details
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Invoice details }, 404: { description: Invoice not found } }
 * /api/student/tickets:
 *   get:
 *     summary: List student support helpdesk tickets
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Ticket list } }
 *   post:
 *     summary: Create a support ticket (NewTicketModal)
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, category, message]
 *             properties:
 *               subject: { type: string, example: "Question regarding electromagnetism" }
 *               category: { type: string, example: "Academic Question" }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH, URGENT], default: MEDIUM }
 *               message: { type: string, example: "Hello, I need help with problem 3 on worksheet 4." }
 *     responses: { 201: { description: Ticket created } }
 * /api/student/tickets/{id}:
 *   get:
 *     summary: Get single ticket conversation thread
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Ticket details }, 404: { description: Ticket not found } }
 * /api/student/tickets/{id}/messages:
 *   post:
 *     summary: Add reply message to support ticket
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text: { type: string, example: "Thank you for the clarification!" }
 *     responses: { 200: { description: Reply appended } }
 */

router.get('/dashboard', authenticate, authorize('student'), controller.dashboard);
router.get('/profile', authenticate, authorize('student'), controller.profile);
router.patch('/profile', authenticate, authorize('student'), controller.updateProfile);
router.get('/assignments', authenticate, authorize('student'), controller.assignments);
router.get('/assignments/:id', authenticate, authorize('student'), controller.assignment);
router.get('/submissions', authenticate, authorize('student'), controller.submissions);
router.post('/assignments/:assignmentId/submissions', authenticate, authorize('student'), controller.submitAssignment);
router.get('/sessions', authenticate, authorize('student'), controller.sessions);
router.post('/sessions', authenticate, authorize('student'), controller.createSession);
router.patch('/sessions/:id/reschedule', authenticate, authorize('student'), controller.rescheduleSession);
router.patch('/sessions/:id/cancel', authenticate, authorize('student'), controller.cancelSession);
router.get('/notifications', authenticate, authorize('student'), controller.notifications);
router.patch('/notifications/:id/read', authenticate, authorize('student'), controller.markNotificationRead);
router.get('/resources', authenticate, authorize('student'), controller.resources);
router.post('/resources/:id/download', authenticate, authorize('student'), controller.downloadResource);
router.get('/payments', authenticate, authorize('student'), controller.payments);
router.post('/payments', authenticate, authorize('student'), controller.createPayment);
router.get('/reviews', authenticate, authorize('student'), controller.reviews);
router.post('/reviews', authenticate, authorize('student'), controller.createReview);
router.get('/invoices', authenticate, authorize('student'), controller.invoices);
router.get('/invoices/:id', authenticate, authorize('student'), controller.invoice);
router.get('/tickets', authenticate, authorize('student'), controller.tickets);
router.post('/tickets', authenticate, authorize('student'), controller.createTicket);
router.get('/tickets/:id', authenticate, authorize('student'), controller.ticket);
router.post('/tickets/:id/messages', authenticate, authorize('student'), controller.addTicketMessage);

export default router;