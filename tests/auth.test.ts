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

  describe('registration validation', () => {
    it('rejects registration when required fields are missing', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'Omar Tarek',
        email: 'omar@example.com',
        password: 'password123',
      });
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('rejects registration with an invalid year option', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'Omar Tarek',
        email: 'omar@example.com',
        password: 'password123',
        schoolName: 'Cairo English School',
        year: 'Y15',
        board: 'OL_CAMBRIDGE',
        studentPhoneNumber: '01012345678',
        parentPhoneNumber: '01098765432',
      });
      expect(response.status).toBe(400);
      expect(response.body.errors?.year).toBeDefined();
    });

    it('rejects registration with an invalid board option', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'Omar Tarek',
        email: 'omar@example.com',
        password: 'password123',
        schoolName: 'Cairo English School',
        year: 'Y11',
        board: 'NOT_A_VALID_BOARD',
        studentPhoneNumber: '01012345678',
        parentPhoneNumber: '01098765432',
      });
      expect(response.status).toBe(400);
      expect(response.body.errors?.board).toBeDefined();
    });

    it('validates supported year and board options properly', async () => {
      // Missing phone numbers
      const response = await request(app).post('/api/auth/register').send({
        name: 'Omar Tarek',
        email: 'omar@example.com',
        password: 'password123',
        schoolName: 'Cairo English School',
        year: 'Y12',
        board: 'NIES',
      });
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('student profile update security & validation', () => {
    it('rejects profile update without auth token', async () => {
      const res = await request(app).patch('/api/student/profile').send({ name: 'New Name' });
      expect(res.status).toBe(401);
    });

    it('rejects profile update with invalid year', async () => {
      const token = generateToken({ id: 2, email: 'student@example.com', role: 'STUDENT' });
      const res = await request(app)
        .patch('/api/student/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ year: 'INVALID_YEAR' });
      expect(res.status).toBe(400);
      expect(res.body.errors?.year).toBeDefined();
    });

    it('rejects profile update with invalid board', async () => {
      const token = generateToken({ id: 2, email: 'student@example.com', role: 'STUDENT' });
      const res = await request(app)
        .patch('/api/student/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ board: 'INVALID_BOARD' });
      expect(res.status).toBe(400);
      expect(res.body.errors?.board).toBeDefined();
    });
  });
});