import { Router } from 'express';
import {
  bookSessionInquiry,
  getCertificate,
  getConfig,
  getHallOfFame,
  getPaymentChannels,
  getReviews,
  registerTrial,
} from './public.controller.js';

const router = Router();

/**
 * @openapi
 * /api/public/config:
 *   get:
 *     summary: Get public academy configuration, curricula, exam sessions, and session pricing
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Configuration payload
 * /api/public/hall-of-fame:
 *   get:
 *     summary: List Hall of Fame alumni for the digital yearbook
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of alumni
 * /api/public/certificates/{certificateId}:
 *   get:
 *     summary: Verify and fetch alumni certificate details (CertificateModal)
 *     tags: [Public]
 *     parameters:
 *       - name: certificateId
 *         in: path
 *         required: true
 *         schema: { type: string, example: "CERT-2025-8821" }
 *     responses:
 *       200:
 *         description: Certificate details
 *       404:
 *         description: Certificate not found
 * /api/public/reviews:
 *   get:
 *     summary: List approved student testimonials for the landing page
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of approved reviews
 * /api/public/payment-channels:
 *   get:
 *     summary: Get official academy payment account details (InstaPay, Vodafone Cash, Bank Transfer)
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Payment channels list
 * /api/public/trial:
 *   post:
 *     summary: Register for a free trial session (FreeTrialModal intake)
 *     tags: [Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone]
 *             properties:
 *               name: { type: string, example: "Ahmed Ali" }
 *               email: { type: string, example: "ahmed@example.com" }
 *               phone: { type: string, example: "01012345678" }
 *               parentName: { type: string, example: "Ali Mahmoud" }
 *               parentPhone: { type: string, example: "01098765432" }
 *               gradeLevel: { type: string, example: "Grade 12 - AP Physics C" }
 *               cohort: { type: string, example: "2025-Quantum" }
 *     responses:
 *       201:
 *         description: Trial registration received
 *       400:
 *         description: Validation failed
 *       409:
 *         description: Email already registered
 * /api/public/book-session:
 *   post:
 *     summary: Submit a public masterclass or 1-on-1 booking inquiry (BookSessionModal intake)
 *     tags: [Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone]
 *             properties:
 *               name: { type: string, example: "Sara Hassan" }
 *               email: { type: string, example: "sara@example.com" }
 *               phone: { type: string, example: "01123456789" }
 *               sessionFormat: { type: string, enum: [PRIVATE, GROUP], default: PRIVATE }
 *               courseName: { type: string, example: "Electromagnetism" }
 *     responses:
 *       201:
 *         description: Booking inquiry submitted
 *       400:
 *         description: Validation failed
 */

router.get('/config', getConfig);
router.get('/hall-of-fame', getHallOfFame);
router.get('/certificates/:certificateId', getCertificate);
router.get('/reviews', getReviews);
router.get('/payment-channels', getPaymentChannels);
router.post('/trial', registerTrial);
router.post('/book-session', bookSessionInquiry);

export default router;
