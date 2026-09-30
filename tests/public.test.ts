import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';

describe('public API endpoints', () => {
  it('allows unauthenticated access to payment channels', async () => {
    const response = await request(app).get('/api/public/payment-channels');
    expect(response.status).toBe(200);
    expect(response.body.channels).toBeInstanceOf(Array);
    expect(response.body.channels.length).toBeGreaterThan(0);
    expect(response.body.channels[0].channel).toBeDefined();
  });

  it('allows unauthenticated access to public config', async () => {
    const response = await request(app).get('/api/public/config');
    expect(response.status).toBe(200);
    expect(response.body.config).toBeDefined();
    expect(response.body.config.curriculaOptions).toBeInstanceOf(Array);
    expect(response.body.config.examSessionOptions).toBeInstanceOf(Array);
  });

  it('rejects invalid trial registration with 400 and validation errors', async () => {
    const response = await request(app).post('/api/public/trial').send({
      name: '',
      email: 'not-an-email',
      phone: '',
    });
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('rejects invalid booking inquiry with 400 and validation errors', async () => {
    const response = await request(app).post('/api/public/book-session').send({
      name: 'A',
      email: 'invalid-email',
      phone: '',
    });
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });
});
