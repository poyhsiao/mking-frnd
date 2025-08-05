import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from './index';

describe('Backend Application', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toMatchObject({
        status: 'ok',
        environment: expect.any(String),
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      });
    });
  });
  
  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);
      
      expect(response.body).toMatchObject({
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
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
  
  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      // Helmet adds various security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });
});