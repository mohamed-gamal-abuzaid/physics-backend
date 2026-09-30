import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { generateToken } from '../src/utils/auth.js';

describe('Admin Students Management API', () => {
  const studentToken = generateToken({ id: 2, email: 'student@example.com', role: 'STUDENT' });
  const adminToken = generateToken({ id: 1, email: 'admin@example.com', role: 'ADMIN' });

  it('rejects unauthenticated requests to students list', async () => {
    const response = await request(app).get('/api/admin/students');
    expect(response.status).toBe(401);
  });

  it('blocks students from accessing students list', async () => {
    const response = await request(app)
      .get('/api/admin/students')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(response.status).toBe(403);
  });

  it('blocks students from accessing student details', async () => {
    const response = await request(app)
      .get('/api/admin/students/2')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(response.status).toBe(403);
  });

  it('blocks students from updating student academic info', async () => {
    const response = await request(app)
      .patch('/api/admin/students/2/academic')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        year: 'Y11',
        board: 'OL Cambridge',
      });
    expect(response.status).toBe(403);
  });

  it('allows admin to query students list', async () => {
    const response = await request(app)
      .get('/api/admin/students')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  });

  it('rejects invalid year with 400', async () => {
    const response = await request(app)
      .patch('/api/admin/students/2/academic')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        year: 'Grade15',
        board: 'OL Cambridge',
      });
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('rejects invalid board with 400', async () => {
    const response = await request(app)
      .patch('/api/admin/students/2/academic')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        year: 'Y11',
        board: 'NonExistentBoard123',
      });
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('validates year and board schema successfully for valid options', async () => {
    // When sending valid options, validation passes (even if db user 99999999 is not found -> 404, not 400)
    const response = await request(app)
      .patch('/api/admin/students/99999999/academic')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        year: 'Y12',
        board: 'AQA Physics',
      });
    expect(response.status).not.toBe(400);
  });

  it('rejects unauthenticated requests to available sessions', async () => {
    const response = await request(app).get('/api/admin/students/2/available-sessions');
    expect(response.status).toBe(401);
  });

  it('blocks students from fetching available sessions', async () => {
    const response = await request(app)
      .get('/api/admin/students/2/available-sessions')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(response.status).toBe(403);
  });

  it('rejects unauthenticated requests to add student to session', async () => {
    const response = await request(app)
      .post('/api/admin/students/2/sessions')
      .send({ sessionId: 1 });
    expect(response.status).toBe(401);
  });

  it('blocks students from adding student to session', async () => {
    const response = await request(app)
      .post('/api/admin/students/2/sessions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ sessionId: 1 });
    expect(response.status).toBe(403);
  });

  it('rejects invalid sessionId with 400 when adding student to session', async () => {
    const response = await request(app)
      .post('/api/admin/students/2/sessions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sessionId: 'invalid' });
    expect(response.status).toBe(400);
  });

  it('rejects unauthenticated requests to remove student from session', async () => {
    const response = await request(app).delete('/api/admin/students/2/sessions/1');
    expect(response.status).toBe(401);
  });

  it('blocks students from removing student from session', async () => {
    const response = await request(app)
      .delete('/api/admin/students/2/sessions/1')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(response.status).toBe(403);
  });

  it('rejects registration with invalid Year', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Student',
        email: 'test-invalid-year@example.com',
        password: 'password123',
        schoolName: 'Cairo High School',
        year: 'Year99',
        board: 'OL Cambridge',
        studentPhoneNumber: '01012345678',
        parentPhoneNumber: '01087654321',
      });
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('rejects registration with invalid Board', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Student',
        email: 'test-invalid-board@example.com',
        password: 'password123',
        schoolName: 'Cairo High School',
        year: 'Y10',
        board: 'Fake Board System',
        studentPhoneNumber: '01012345678',
        parentPhoneNumber: '01087654321',
      });
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('rejects student profile update with invalid Year', async () => {
    const response = await request(app)
      .patch('/api/student/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        year: 'InvalidGrade',
      });
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('rejects student profile update with invalid Board', async () => {
    const response = await request(app)
      .patch('/api/student/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        board: 'UnknownExamBoard',
      });
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });
});
