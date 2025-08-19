import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from '../middleware/errorHandler';
import { notFoundHandler } from '../middleware/notFoundHandler';

const app: Express = express();

// Security middleware
app.use(helmet());

// CORS middleware
app.use(
  cors({
    origin: process.env['FRONTEND_URL'] || 'http://localhost:3000',
    credentials: true,
  })
);

// Skip logging middleware in tests

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Test-specific health check endpoints
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'] || 'development',
    version: process.env['npm_package_version'] || '1.0.0',
    dependencies: {
      database: { status: 'healthy', responseTime: 10 },
      redis: { status: 'healthy', responseTime: 5 },
    },
    system: {
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        percentage: Math.round(
          (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) *
            100
        ),
      },
      cpu: {
        loadAverage: [0.1, 0.2, 0.3],
      },
    },
  });
});

app.get('/health/simple', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
