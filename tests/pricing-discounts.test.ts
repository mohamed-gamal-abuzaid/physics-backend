import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { generateToken } from '../src/utils/auth.js';

describe('Level Pricing, Discounts, and Student Deletion API', () => {
  const studentToken = generateToken({ id: 2, email: 'student@example.com', role: 'STUDENT' });
  const adminToken = generateToken({ id: 1, email: 'admin@example.com', role: 'ADMIN' });

  let createdPricingId1: number;
  let createdPricingId2: number;
  let createdDiscountId1: number;
  let createdDiscountId2: number;
  let createdDiscountId3: number;

  describe('1. Landing Home Page Plan Selection Removal', () => {
    it('returns config without hardcoded default landing plans array in sessionPricing', async () => {
      const response = await request(app).get('/api/public/config');
      expect(response.status).toBe(200);
      expect(response.body.config).toBeDefined();
      expect(response.body.config.sessionPricing).toBeDefined();
      expect(response.body.config.sessionPricing.plans).toBeUndefined();
      expect(response.body.config.levelPricing).toBeInstanceOf(Array);
    });
  });

  describe('2. Admin Level Session Pricing CRUD', () => {
    it('blocks unauthenticated requests to level pricing', async () => {
      const response = await request(app).get('/api/admin/level-pricing');
      expect(response.status).toBe(401);
    });

    it('blocks student requests to level pricing management', async () => {
      const response = await request(app)
        .post('/api/admin/level-pricing')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          levelName: 'Year 10',
          title: 'Single Session',
          price: 200,
          sessionsCount: 1,
        });
      expect(response.status).toBe(403);
    });

    it('allows admin to add single session price for Year 10', async () => {
      const response = await request(app)
        .post('/api/admin/level-pricing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          levelName: 'Year 10',
          stageCode: 'Y10',
          sessionFormat: 'PRIVATE',
          sessionsCount: 1,
          title: 'Year 10 Single 1-on-1 Session',
          price: 250,
          currency: 'EGP',
          description: 'Single diagnostic and mentoring session for Year 10 physics.',
        });

      expect(response.status).toBe(201);
      expect(response.body.pricing).toBeDefined();
      expect(response.body.pricing.levelName).toBe('Year 10');
      expect(response.body.pricing.sessionsCount).toBe(1);
      expect(Number(response.body.pricing.price)).toBe(250);
      createdPricingId1 = response.body.pricing.id;
    });

    it('allows admin to add a multi-session package price for Year 12 (different price and level)', async () => {
      const response = await request(app)
        .post('/api/admin/level-pricing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          levelName: 'Year 12 (AS-Level)',
          stageCode: 'Y12',
          sessionFormat: 'GROUP',
          sessionsCount: 4,
          title: 'Year 12 AS-Level 4-Week Cohort',
          price: 900,
          currency: 'EGP',
          description: 'Four intensive group masterclasses covering AS-Level syllabus.',
        });

      expect(response.status).toBe(201);
      expect(response.body.pricing).toBeDefined();
      expect(response.body.pricing.levelName).toBe('Year 12 (AS-Level)');
      expect(response.body.pricing.sessionsCount).toBe(4);
      expect(Number(response.body.pricing.price)).toBe(900);
      createdPricingId2 = response.body.pricing.id;
    });

    it('allows admin to list level pricing entries', async () => {
      const response = await request(app)
        .get('/api/admin/level-pricing')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.pricing.items).toBeInstanceOf(Array);
      expect(response.body.pricing.items.length).toBeGreaterThanOrEqual(2);
    });

    it('allows admin to update level pricing tier', async () => {
      const response = await request(app)
        .patch(`/api/admin/level-pricing/${createdPricingId1}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 280,
          title: 'Year 10 Single 1-on-1 Session (Updated)',
        });

      expect(response.status).toBe(200);
      expect(Number(response.body.pricing.price)).toBe(280);
      expect(response.body.pricing.title).toBe('Year 10 Single 1-on-1 Session (Updated)');
    });
  });

  describe('3. Admin Discounts Management CRUD', () => {
    const timestamp = Date.now().toString().slice(-4);
    const codeAll = `ALL${timestamp}`;
    const codeLevel = `Y12${timestamp}`;
    const codeStudent = `VIP${timestamp}`;

    it('allows admin to add discount for ALL students', async () => {
      const response = await request(app)
        .post('/api/admin/discounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: codeAll,
          title: 'Global Welcome 10% Discount',
          scope: 'ALL',
          discountType: 'PERCENTAGE',
          value: 10,
          minSessionsCount: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.discount).toBeDefined();
      expect(response.body.discount.code).toBe(codeAll);
      expect(response.body.discount.scope).toBe('ALL');
      expect(Number(response.body.discount.value)).toBe(10);
      createdDiscountId1 = response.body.discount.id;
    });

    it('allows admin to add discount for a specific LEVEL', async () => {
      const response = await request(app)
        .post('/api/admin/discounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: codeLevel,
          title: '100 EGP Off for Year 12 AS-Level Students',
          scope: 'LEVEL',
          targetLevel: 'Year 12 (AS-Level)',
          discountType: 'FIXED',
          value: 100,
          minSessionsCount: 4,
        });

      expect(response.status).toBe(201);
      expect(response.body.discount).toBeDefined();
      expect(response.body.discount.code).toBe(codeLevel);
      expect(response.body.discount.scope).toBe('LEVEL');
      expect(response.body.discount.targetLevel).toBe('Year 12 (AS-Level)');
      createdDiscountId2 = response.body.discount.id;
    });

    it('allows admin to add discount for one specific STUDENT', async () => {
      const response = await request(app)
        .post('/api/admin/discounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: codeStudent,
          title: '25% Dedicated Scholar Subsidy',
          scope: 'STUDENT',
          targetStudentId: 2,
          discountType: 'PERCENTAGE',
          value: 25,
          minSessionsCount: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.discount).toBeDefined();
      expect(response.body.discount.code).toBe(codeStudent);
      expect(response.body.discount.scope).toBe('STUDENT');
      expect(response.body.discount.targetStudentId).toBe(2);
      createdDiscountId3 = response.body.discount.id;
    });

    it('rejects duplicate discount code with 409', async () => {
      const response = await request(app)
        .post('/api/admin/discounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: codeAll,
          title: 'Duplicate Test',
          scope: 'ALL',
          discountType: 'PERCENTAGE',
          value: 5,
        });

      expect(response.status).toBe(409);
    });

    it('allows admin to list discounts', async () => {
      const response = await request(app)
        .get('/api/admin/discounts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.discounts.items).toBeInstanceOf(Array);
      expect(response.body.discounts.items.length).toBeGreaterThanOrEqual(3);
    });

    it('allows admin to update discount', async () => {
      const response = await request(app)
        .patch(`/api/admin/discounts/${createdDiscountId1}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          value: 15,
          title: 'Global Welcome 15% Discount (Updated)',
        });

      expect(response.status).toBe(200);
      expect(Number(response.body.discount.value)).toBe(15);
      expect(response.body.discount.title).toBe('Global Welcome 15% Discount (Updated)');
    });
  });

  describe('4. Student Session Discovery & Discount Visibility', () => {
    it('allows student to fetch pricing and see applicable discounts', async () => {
      const response = await request(app)
        .get('/api/student/pricing')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pricing).toBeInstanceOf(Array);
      expect(response.body.pricing.length).toBeGreaterThan(0);

      const pricingItem = response.body.pricing.find((p: any) => p.id === createdPricingId1);
      if (pricingItem) {
        expect(pricingItem.originalPrice).toBeDefined();
        expect(pricingItem.finalPrice).toBeDefined();
        expect(pricingItem.finalPrice).toBeLessThanOrEqual(pricingItem.originalPrice);
      }
    });

    it('allows student to calculate discounted price using a valid promo code', async () => {
      const response = await request(app)
        .post('/api/student/pricing/calculate')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          pricingId: createdPricingId2,
        });

      expect(response.status).toBe(200);
      expect(response.body.originalPrice).toBe(900);
      expect(response.body.finalPrice).toBeDefined();
      expect(response.body.finalPrice).toBeLessThanOrEqual(900);
    });

    it('rejects student calculating with invalid promo code', async () => {
      const response = await request(app)
        .post('/api/student/pricing/calculate')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          pricingId: createdPricingId1,
          discountCode: 'NONEXISTENT_CODE_XYZ',
        });

      expect(response.status).toBe(400);
    });

    it('allows student to submit a payment proof with pricingId and discount', async () => {
      const response = await request(app)
        .post('/api/student/payments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          pricingId: createdPricingId1,
          amount: 238,
          originalAmount: 280,
          discountAmount: 42,
          paymentMethod: 'Vodafone Cash',
          screenshotUrl: 'https://example.com/receipt.png',
        });

      expect(response.status).toBe(201);
      expect(response.body.payment).toBeDefined();
      expect(Number(response.body.payment.amount)).toBe(238);
      expect(response.body.payment.pricingId).toBe(createdPricingId1);
    });
  });

  describe('5. Admin Student Account Deletion', () => {
    let dummyStudentId: number;

    it('creates a temporary student for deletion test', async () => {
      const testEmail = `temp.delete.${Date.now()}@example.com`;
      const response = await request(app)
        .post('/api/admin/crm/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Temporary Student To Delete',
          email: testEmail,
          phone: '01012345678',
          gradeLevel: 'Year 10',
          cohort: '2026-Test',
        });

      expect(response.status).toBe(201);
      dummyStudentId = response.body.student?.id;
      expect(dummyStudentId).toBeDefined();
    });

    it('blocks non-admin from deleting a student account', async () => {
      const response = await request(app)
        .delete(`/api/admin/crm/students/${dummyStudentId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });

    it('allows admin to permanently delete the student account', async () => {
      const response = await request(app)
        .delete(`/api/admin/crm/students/${dummyStudentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verifying student is gone
      const checkRes = await request(app)
        .get(`/api/admin/students/${dummyStudentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(checkRes.status).toBe(404);
    });

    it('rejects admin deleting an admin account with 400', async () => {
      const response = await request(app)
        .delete('/api/admin/crm/students/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('Cleanup', () => {
    it('allows admin to delete created level pricing and discounts', async () => {
      if (createdPricingId1) {
        const res = await request(app)
          .delete(`/api/admin/level-pricing/${createdPricingId1}`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
      }
      if (createdPricingId2) {
        const res = await request(app)
          .delete(`/api/admin/level-pricing/${createdPricingId2}`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
      }
      if (createdDiscountId1) {
        const res = await request(app)
          .delete(`/api/admin/discounts/${createdDiscountId1}`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
      }
      if (createdDiscountId2) {
        const res = await request(app)
          .delete(`/api/admin/discounts/${createdDiscountId2}`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
      }
      if (createdDiscountId3) {
        const res = await request(app)
          .delete(`/api/admin/discounts/${createdDiscountId3}`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
      }
    }, 20000);
  });
});
