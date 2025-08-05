import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { requestLogger } from './middleware/requestLogger';

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

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: process.env['NODE_ENV'] || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
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