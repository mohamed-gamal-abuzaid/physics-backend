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
 *     summary: List learning resources
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Resource list } }
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
router.get('/payments', authenticate, authorize('student'), controller.payments);
router.post('/payments', authenticate, authorize('student'), controller.createPayment);
router.get('/reviews', authenticate, authorize('student'), controller.reviews);
router.post('/reviews', authenticate, authorize('student'), controller.createReview);

export default router;