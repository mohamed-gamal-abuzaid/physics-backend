import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { generateToken } from '../src/utils/auth.js';

describe('Academic Hub & Marketing Managers API (Steps 6 & 7)', () => {
  const studentToken = generateToken({ id: 2, email: 'student@example.com', role: 'STUDENT' });
  const adminToken = generateToken({ id: 1, email: 'admin@example.com', role: 'ADMIN' });

  describe('Student Resources & Download Counter (Step 6)', () => {
    it('rejects unauthenticated requests to student resources', async () => {
      const response = await request(app).get('/api/student/resources');
      expect(response.status).toBe(401);
    });

    it('allows student to access learning resources route', async () => {
      const response = await request(app)
        .get('/api/student/resources')
        .query({ category: 'Cheat Sheets', search: 'Quantum', page: 1, limit: 10 })
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('rejects unauthenticated resource download increment', async () => {
      const response = await request(app).post('/api/student/resources/1/download');
      expect(response.status).toBe(401);
    });

    it('allows authenticated student to call download increment endpoint', async () => {
      const response = await request(app)
        .post('/api/student/resources/1/download')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });
  });

  describe('Session Lifecycle & Completion Workflows (Step 6)', () => {
    it('blocks student from completing a session', async () => {
      const response = await request(app)
        .post('/api/admin/sessions/1/complete')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          sessionNotes: { summaryNotes: 'Discussed Coulomb law' },
        });

      expect(response.status).toBe(403);
    });

    it('blocks student from approving a session', async () => {
      const response = await request(app)
        .post('/api/admin/sessions/1/approve')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });

    it('blocks student from rejecting a session', async () => {
      const response = await request(app)
        .post('/api/admin/sessions/1/reject')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });

    it('allows admin to access session complete endpoint', async () => {
      const response = await request(app)
        .post('/api/admin/sessions/1/complete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sessionNotes: {
            title: 'Electric Fields Deep Dive',
            summaryNotes: 'Derived Gauss theorem and flux density.',
            keyConcepts: ['Flux', 'Gauss Law', 'Permittivity'],
          },
        });

      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('allows admin to access session approve endpoint', async () => {
      const response = await request(app)
        .post('/api/admin/sessions/1/approve')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('allows admin to access session reject endpoint', async () => {
      const response = await request(app)
        .post('/api/admin/sessions/1/reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Teacher emergency leave' });

      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });
  });

  describe('Reviews Moderation Desk (Step 7)', () => {
    it('blocks student from accessing reviews moderation desk', async () => {
      const response = await request(app)
        .get('/api/admin/reviews')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });

    it('allows admin to access reviews moderation route', async () => {
      const response = await request(app)
        .get('/api/admin/reviews')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('rejects invalid review moderation payload with 400', async () => {
      const response = await request(app)
        .patch('/api/admin/reviews/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rating: 10, // Invalid: rating must be 1-5
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Hall of Fame & Certificate Verification (Step 7)', () => {
    it('allows public access to certificate verification route', async () => {
      const response = await request(app).get('/api/public/certificates/CERT-2025-0001');
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('blocks student from creating Hall of Fame entry', async () => {
      const response = await request(app)
        .post('/api/admin/hall-of-fame')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentName: 'Ziad Mohamed',
          admittedUniversity: 'MIT',
        });

      expect(response.status).toBe(403);
    });

    it('validates Hall of Fame creation input with 400 for missing studentName', async () => {
      const response = await request(app)
        .post('/api/admin/hall-of-fame')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          admittedUniversity: 'Stanford University',
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Email Campaigns & System Outbox (Step 7)', () => {
    it('blocks student from viewing email campaigns', async () => {
      const response = await request(app)
        .get('/api/admin/campaigns')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });

    it('allows admin to access campaigns route', async () => {
      const response = await request(app)
        .get('/api/admin/campaigns')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('validates campaign creation input with 400 for missing title/subject', async () => {
      const response = await request(app)
        .post('/api/admin/campaigns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          targetAudience: 'Everyone',
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('blocks student from viewing system outbox logs', async () => {
      const response = await request(app)
        .get('/api/admin/outbox')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });

    it('allows admin to access system outbox route', async () => {
      const response = await request(app)
        .get('/api/admin/outbox')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });
  });
});
