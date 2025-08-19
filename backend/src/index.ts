import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { requestLogger } from './middleware/requestLogger';
import { performHealthCheck, performSimpleHealthCheck } from './services/healthService';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env['PORT'] || 3001;
const logger = createLogger('app');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(requestLogger);

// Comprehensive health check endpoint
app.get('/health', (_req, res): void => {
  void (async (): Promise<void> => {
    try {
      const healthResult = await performHealthCheck();
      
      // Set appropriate HTTP status based on health
      const statusCode = healthResult.status === 'healthy' ? 200 : 
                        healthResult.status === 'degraded' ? 200 : 503;
      
      res.status(statusCode).json(healthResult);
    } catch (error) {
      logger.error('Health check failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      });
    }
  })();
});

// Simple health check endpoint for Docker health checks
app.get('/health/simple', (_req, res): void => {
  void (async (): Promise<void> => {
    try {
      const healthResult = await performSimpleHealthCheck();
      
      const statusCode = healthResult.status === 'ok' ? 200 : 503;
      res.status(statusCode).json(healthResult);
    } catch (error) {
      logger.error('Simple health check failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
      });
    }
  })();
});

// 404 handler
app.use('*', notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Start server
if (process.env['NODE_ENV'] !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

export default app;