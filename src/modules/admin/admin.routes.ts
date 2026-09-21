import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import * as controller from './admin.controller.js';

const router = Router();

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     summary: List users
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: search, in: query, schema: { type: string } }]
 *     responses: { 200: { description: User list } }
 * /api/admin/users/{id}:
 *   patch:
 *     summary: Update a user role or status
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: User updated } }
 * /api/admin/assignments:
 *   get:
 *     summary: List all assignments
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Assignment list } }
 *   post:
 *     summary: Create an assignment
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Assignment created } }
 * /api/admin/assignments/{id}:
 *   patch:
 *     summary: Update an assignment
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Assignment updated } }
 *   delete:
 *     summary: Delete an assignment
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 204: { description: Assignment deleted } }
 * /api/admin/submissions:
 *   get:
 *     summary: List homework submissions
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Submission list } }
 * /api/admin/submissions/{id}/grade:
 *   patch:
 *     summary: Grade a homework submission
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Submission graded } }
 * /api/admin/sessions:
 *   get:
 *     summary: List all sessions
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Session list } }
 * /api/admin/sessions/{id}:
 *   patch:
 *     summary: Update a session status
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Session updated } }
 * /api/admin/payments:
 *   get:
 *     summary: List payment proofs
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Payment list } }
 * /api/admin/payments/{id}/review:
 *   patch:
 *     summary: Approve or reject a payment proof
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Payment reviewed } }
 * /api/admin/resources:
 *   get:
 *     summary: List resources
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Resource list } }
 *   post:
 *     summary: Create a resource
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Resource created } }
 * /api/admin/resources/{id}:
 *   patch:
 *     summary: Update a resource
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Resource updated } }
 *   delete:
 *     summary: Delete a resource
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 204: { description: Resource deleted } }
 * /api/admin/settings:
 *   get:
 *     summary: Get application settings
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Settings } }
 *   patch:
 *     summary: Update application settings
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Settings updated } }
 */

router.get('/users', authenticate, authorize('admin'), controller.users);
router.patch('/users/:id', authenticate, authorize('admin'), controller.updateUser);
router.get('/assignments', authenticate, authorize('admin'), controller.assignments);
router.post('/assignments', authenticate, authorize('admin'), controller.createAssignment);
router.patch('/assignments/:id', authenticate, authorize('admin'), controller.updateAssignment);
router.delete('/assignments/:id', authenticate, authorize('admin'), controller.deleteAssignment);
router.get('/submissions', authenticate, authorize('admin'), controller.submissions);
router.patch('/submissions/:id/grade', authenticate, authorize('admin'), controller.gradeSubmission);
router.get('/sessions', authenticate, authorize('admin'), controller.sessions);
router.patch('/sessions/:id', authenticate, authorize('admin'), controller.updateSession);
router.get('/payments', authenticate, authorize('admin'), controller.payments);
router.patch('/payments/:id/review', authenticate, authorize('admin'), controller.reviewPayment);
router.get('/resources', authenticate, authorize('admin'), controller.resources);
router.post('/resources', authenticate, authorize('admin'), controller.createResource);
router.patch('/resources/:id', authenticate, authorize('admin'), controller.updateResource);
router.delete('/resources/:id', authenticate, authorize('admin'), controller.deleteResource);
router.get('/settings', authenticate, authorize('admin'), controller.getSettings);
router.patch('/settings', authenticate, authorize('admin'), controller.updateSettings);

export default router;