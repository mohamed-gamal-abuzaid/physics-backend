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
 * /api/admin/invoices:
 *   get:
 *     summary: List academy billing invoices
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Invoice list } }
 *   post:
 *     summary: Create an invoice
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, amount]
 *             properties:
 *               studentId: { type: integer, example: 2 }
 *               packageName: { type: string, example: "Monthly Physics Masterclass" }
 *               amount: { type: number, example: 450.00 }
 *               status: { type: string, enum: [UNPAID, PAID, OVERDUE, CANCELLED], default: UNPAID }
 *     responses: { 201: { description: Invoice created } }
 * /api/admin/invoices/{id}:
 *   get:
 *     summary: Get invoice details
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Invoice details }, 404: { description: Invoice not found } }
 * /api/admin/invoices/{id}/status:
 *   patch:
 *     summary: Update invoice status
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [UNPAID, PAID, OVERDUE, CANCELLED] }
 *     responses: { 200: { description: Invoice updated } }
 * /api/admin/students/{id}/adjust-credits:
 *   post:
 *     summary: Manually grant or deduct student credits (ManualCreditModal)
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [creditType, amount, reason]
 *             properties:
 *               creditType: { type: string, enum: [1-to-1, group, general] }
 *               amount: { type: integer, example: 2, description: "Positive to grant, negative to deduct" }
 *               reason: { type: string, example: "Bonus credit for top midterm performance" }
 *     responses: { 200: { description: Credits adjusted } }
 * /api/admin/tickets:
 *   get:
 *     summary: List all helpdesk support tickets
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Ticket list } }
 * /api/admin/tickets/{id}:
 *   get:
 *     summary: Get single support ticket conversation thread
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Ticket details }, 404: { description: Ticket not found } }
 *   patch:
 *     summary: Update ticket status or priority
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED] }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH, URGENT] }
 *     responses: { 200: { description: Ticket updated } }
 * /api/admin/tickets/{id}/messages:
 *   post:
 *     summary: Reply to a support ticket as staff
 *     tags: [Admin / Teacher]
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
 *               text: { type: string, example: "We have reviewed your request and updated your schedule." }
 *     responses: { 200: { description: Reply sent } }
 * /api/admin/crm/students:
 *   get:
 *     summary: List scholars in CRM directory with extended profiles
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Student directory list } }
 *   post:
 *     summary: Register a new scholar directly (AddAccountModal)
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name: { type: string, example: "Omar Tarek" }
 *               email: { type: string, example: "omar@example.com" }
 *               phone: { type: string, example: "01055554444" }
 *               gradeLevel: { type: string, example: "Grade 11 - IGCSE" }
 *               cohort: { type: string, example: "2025-Quantum" }
 *               enrolledCourse: { type: string, example: "Mechanics & Waves" }
 *     responses: { 201: { description: Student account created } }
 * /api/admin/crm/waiting:
 *   get:
 *     summary: List accounts waiting for activation in onboarding queue
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Waiting students list } }
 * /api/admin/crm/students/{id}/assign:
 *   patch:
 *     summary: Assign instructor, cohort, course, and meeting link to student (AssignAccountModal)
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assignedTeacherId: { type: integer, example: 1 }
 *               cohort: { type: string, example: "2025-Quantum" }
 *               enrolledCourse: { type: string, example: "AP Physics C" }
 *               meetingLink: { type: string, example: "https://meet.google.com/abc-defg-hij" }
 *     responses: { 200: { description: Scholar assignment updated } }
 * /api/admin/crm/students/{id}/credentials:
 *   post:
 *     summary: Generate or reset student credentials (AccountCredentialsModal)
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Credentials generated } }
 * /api/admin/crm/students/{id}/status:
 *   patch:
 *     summary: Update student account status
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, example: "Active" }
 *     responses: { 200: { description: Status updated } }
 * /api/admin/sessions/{id}/complete:
 *   post:
 *     summary: Complete a tutoring session with summary notes and whiteboard snapshot (CompleteSessionModal)
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionNotes: { type: object }
 *               assignedHomeworkId: { type: integer }
 *               assignedHomework: { type: object }
 *               notes: { type: string }
 *     responses: { 200: { description: Session completed } }
 * /api/admin/sessions/{id}/approve:
 *   post:
 *     summary: Approve a student session booking
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Session approved } }
 * /api/admin/sessions/{id}/reject:
 *   post:
 *     summary: Reject/cancel a student session booking and refund credit
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses: { 200: { description: Session rejected and credit refunded } }
 * /api/admin/reviews:
 *   get:
 *     summary: List reviews for moderation desk (AdminReviewsManager)
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Reviews list } }
 * /api/admin/reviews/{id}:
 *   patch:
 *     summary: Moderate review status or edit review content
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Review moderated } }
 *   delete:
 *     summary: Delete a student review
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 204: { description: Review deleted } }
 * /api/admin/hall-of-fame:
 *   get:
 *     summary: List alumni in Hall of Fame (AdminHallOfFameManager)
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Hall of Fame alumni list } }
 *   post:
 *     summary: Create a Hall of Fame entry
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Entry created } }
 * /api/admin/hall-of-fame/{id}:
 *   get:
 *     summary: Get single Hall of Fame entry
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Alumni details } }
 *   patch:
 *     summary: Update Hall of Fame alumni profile
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Profile updated } }
 *   delete:
 *     summary: Remove alumni from Hall of Fame
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 204: { description: Profile deleted } }
 * /api/admin/campaigns:
 *   get:
 *     summary: List email marketing campaigns
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Campaign list } }
 *   post:
 *     summary: Create an email marketing campaign (EmailCampaignModal)
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Campaign created } }
 * /api/admin/campaigns/{id}:
 *   patch:
 *     summary: Update email campaign
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Campaign updated } }
 *   delete:
 *     summary: Delete email campaign
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 204: { description: Campaign deleted } }
 * /api/admin/campaigns/{id}/send:
 *   post:
 *     summary: Dispatch email campaign to students and queue outbox records
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Campaign dispatched } }
 * /api/admin/outbox:
 *   get:
 *     summary: List dispatched emails and delivery status from system outbox
 *     tags: [Admin / Teacher]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Outbox email logs } }
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
router.post('/sessions/:id/complete', authenticate, authorize('admin'), controller.completeSession);
router.post('/sessions/:id/approve', authenticate, authorize('admin'), controller.approveSession);
router.post('/sessions/:id/reject', authenticate, authorize('admin'), controller.rejectSession);
router.get('/payments', authenticate, authorize('admin'), controller.payments);
router.patch('/payments/:id/review', authenticate, authorize('admin'), controller.reviewPayment);
router.get('/resources', authenticate, authorize('admin'), controller.resources);
router.post('/resources', authenticate, authorize('admin'), controller.createResource);
router.patch('/resources/:id', authenticate, authorize('admin'), controller.updateResource);
router.delete('/resources/:id', authenticate, authorize('admin'), controller.deleteResource);
router.get('/settings', authenticate, authorize('admin'), controller.getSettings);
router.patch('/settings', authenticate, authorize('admin'), controller.updateSettings);
router.get('/invoices', authenticate, authorize('admin'), controller.invoices);
router.post('/invoices', authenticate, authorize('admin'), controller.createInvoice);
router.get('/invoices/:id', authenticate, authorize('admin'), controller.invoice);
router.patch('/invoices/:id/status', authenticate, authorize('admin'), controller.updateInvoiceStatus);
router.post('/students/:id/adjust-credits', authenticate, authorize('admin'), controller.adjustCredits);
router.get('/tickets', authenticate, authorize('admin'), controller.tickets);
router.get('/tickets/:id', authenticate, authorize('admin'), controller.ticket);
router.post('/tickets/:id/messages', authenticate, authorize('admin'), controller.replyTicket);
router.patch('/tickets/:id', authenticate, authorize('admin'), controller.updateTicket);

router.get('/crm/students', authenticate, authorize('admin'), controller.crmStudents);
router.get('/crm/waiting', authenticate, authorize('admin'), controller.waitingStudents);
router.post('/crm/students', authenticate, authorize('admin'), controller.addStudent);
router.patch('/crm/students/:id/assign', authenticate, authorize('admin'), controller.assignScholar);
router.post('/crm/students/:id/credentials', authenticate, authorize('admin'), controller.generateCredentials);
router.patch('/crm/students/:id/status', authenticate, authorize('admin'), controller.updateStudentStatus);

router.get('/reviews', authenticate, authorize('admin'), controller.reviews);
router.patch('/reviews/:id', authenticate, authorize('admin'), controller.moderateReview);
router.delete('/reviews/:id', authenticate, authorize('admin'), controller.deleteReview);

router.get('/hall-of-fame', authenticate, authorize('admin'), controller.hallOfFame);
router.get('/hall-of-fame/:id', authenticate, authorize('admin'), controller.getHallOfFame);
router.post('/hall-of-fame', authenticate, authorize('admin'), controller.createHallOfFame);
router.patch('/hall-of-fame/:id', authenticate, authorize('admin'), controller.updateHallOfFame);
router.delete('/hall-of-fame/:id', authenticate, authorize('admin'), controller.deleteHallOfFame);

router.get('/campaigns', authenticate, authorize('admin'), controller.campaigns);
router.post('/campaigns', authenticate, authorize('admin'), controller.createCampaign);
router.patch('/campaigns/:id', authenticate, authorize('admin'), controller.updateCampaign);
router.delete('/campaigns/:id', authenticate, authorize('admin'), controller.deleteCampaign);
router.post('/campaigns/:id/send', authenticate, authorize('admin'), controller.sendCampaign);

router.get('/outbox', authenticate, authorize('admin'), controller.outbox);

export default router;