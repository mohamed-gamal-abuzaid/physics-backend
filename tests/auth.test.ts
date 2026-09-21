import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { generateToken } from '../src/utils/auth.js';

describe('authentication API', () => {
  it('rejects requests without a bearer token', async () => {
    const response = await request(app).get('/api/student/profile');
    expect(response.status).toBe(401);
  });

  it('rejects invalid credentials without exposing internal errors', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'not-an-email',
      password: '',
    });
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('allows an admin token to pass admin authorization', async () => {
    const token = generateToken({ id: 1, email: 'admin@example.com', role: 'ADMIN' });
    const response = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  });

  it('blocks a student token from admin APIs', async () => {
    const token = generateToken({ id: 2, email: 'student@example.com', role: 'STUDENT' });
    const response = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it('blocks an admin token from student APIs', async () => {
    const token = generateToken({ id: 1, email: 'admin@example.com', role: 'ADMIN' });
    const response = await request(app).get('/api/student/profile').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it('rejects an empty bearer token', async () => {
    const response = await request(app).get('/api/auth/me').set('Authorization', 'Bearer ');
    expect(response.status).toBe(401);
  });

  it('protects the health API route', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(401);
  });

  it('allows an authenticated user to access the health API route', async () => {
    const token = generateToken({ id: 2, email: 'student@example.com', role: 'STUDENT' });
    const response = await request(app).get('/health').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
  });
});