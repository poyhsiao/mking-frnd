import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from './test/testApp';

describe('Backend Application', () => {
  describe('Health Check', () => {
    it('should return comprehensive health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body as Record<string, unknown>).toMatchObject({
        status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String),
        version: expect.any(String),
        dependencies: expect.any(Object),
        system: expect.any(Object),
      });
    });

    it('should return simple health status', async () => {
      const response = await request(app).get('/health/simple').expect(200);

      expect(response.body as Record<string, unknown>).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String),
      });
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body as Record<string, unknown>).toMatchObject({
        success: false,
        error: {
          message: expect.stringContaining('not found'),
        },
        timestamp: expect.any(String),
        path: '/non-existent-route',
      });
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app).get('/health').expect(200);

      // Helmet adds various security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });
});
