import { Router } from 'express';
import { authenticate, authorizeRoles } from '../../middlewares/auth.middleware.js';
import * as controller from './student.controller.js';

const router = Router();
router.use(authenticate, authorizeRoles('STUDENT'));

router.get('/dashboard', controller.dashboard);
router.get('/profile', controller.profile);
router.patch('/profile', controller.updateProfile);
router.get('/assignments', controller.assignments);
router.get('/assignments/:id', controller.assignment);
router.get('/submissions', controller.submissions);
router.post('/assignments/:assignmentId/submissions', controller.submitAssignment);
router.get('/sessions', controller.sessions);
router.post('/sessions', controller.createSession);
router.get('/notifications', controller.notifications);
router.patch('/notifications/:id/read', controller.markNotificationRead);
router.get('/resources', controller.resources);
router.get('/payments', controller.payments);
router.post('/payments', controller.createPayment);
router.get('/reviews', controller.reviews);
router.post('/reviews', controller.createReview);

export default router;