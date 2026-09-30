import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { generateToken } from '../src/utils/auth.js';

describe('Financials and Invoices API', () => {
  const studentToken = generateToken({ id: 2, email: 'student@example.com', role: 'STUDENT' });
  const adminToken = generateToken({ id: 1, email: 'admin@example.com', role: 'ADMIN' });

  it('rejects unauthenticated requests to student invoices', async () => {
    const response = await request(app).get('/api/student/invoices');
    expect(response.status).toBe(401);
  });

  it('blocks students from accessing admin invoices', async () => {
    const response = await request(app)
      .get('/api/admin/invoices')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(response.status).toBe(403);
  });

  it('allows admin to access admin invoices route', async () => {
    const response = await request(app)
      .get('/api/admin/invoices')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  });

  it('rejects invalid invoice creation with 400 validation error', async () => {
    const response = await request(app)
      .post('/api/admin/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId: 'not-a-number',
        amount: -50,
      });
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('rejects invalid manual credit adjustment with 400', async () => {
    const response = await request(app)
      .post('/api/admin/students/2/adjust-credits')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        creditType: 'invalid-type',
        amount: 'two',
        reason: '',
      });
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });
});

describe('Support Tickets and Helpdesk API', () => {
  const studentToken = generateToken({ id: 2, email: 'student@example.com', role: 'STUDENT' });
  const adminToken = generateToken({ id: 1, email: 'admin@example.com', role: 'ADMIN' });

  it('rejects unauthenticated requests to student tickets', async () => {
    const response = await request(app).get('/api/student/tickets');
    expect(response.status).toBe(401);
  });

  it('blocks students from accessing admin tickets', async () => {
    const response = await request(app)
      .get('/api/admin/tickets')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(response.status).toBe(403);
  });

  it('allows admin to access admin tickets route', async () => {
    const response = await request(app)
      .get('/api/admin/tickets')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  });

  it('rejects invalid ticket creation with 400', async () => {
    const response = await request(app)
      .post('/api/student/tickets')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        subject: '',
        category: '',
        message: 'ab',
      });
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('rejects empty ticket reply with 400', async () => {
    const response = await request(app)
      .post('/api/student/tickets/1/messages')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        text: '',
      });
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });
});
