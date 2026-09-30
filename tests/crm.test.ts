import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { generateToken } from '../src/utils/auth.js';

describe('CRM & Student Onboarding API', () => {
  const studentToken = generateToken({ id: 2, email: 'student@example.com', role: 'STUDENT' });
  const adminToken = generateToken({ id: 1, email: 'admin@example.com', role: 'ADMIN' });

  it('rejects unauthenticated requests to CRM students directory', async () => {
    const response = await request(app).get('/api/admin/crm/students');
    expect(response.status).toBe(401);
  });

  it('blocks students from accessing CRM students directory', async () => {
    const response = await request(app)
      .get('/api/admin/crm/students')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(response.status).toBe(403);
  });

  it('blocks students from accessing CRM waiting queue', async () => {
    const response = await request(app)
      .get('/api/admin/crm/waiting')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(response.status).toBe(403);
  });

  it('allows admin to access CRM students directory', async () => {
    const response = await request(app)
      .get('/api/admin/crm/students')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  });

  it('allows admin to access CRM waiting onboarding queue', async () => {
    const response = await request(app)
      .get('/api/admin/crm/waiting')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  });

  it('rejects invalid direct student registration with 400', async () => {
    const response = await request(app)
      .post('/api/admin/crm/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: '',
        email: 'invalid-email',
      });
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('rejects invalid scholar assignment with 400 for malformed URL', async () => {
    const response = await request(app)
      .patch('/api/admin/crm/students/2/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        meetingLink: 'not-a-url',
      });
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('rejects empty status update with 400', async () => {
    const response = await request(app)
      .patch('/api/admin/crm/students/2/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: '',
      });
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });
});
