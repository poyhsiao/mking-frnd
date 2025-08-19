import { PrismaClient } from '@prisma/client';
import { createLogger } from './logger';

const logger = createLogger('database');

// Global Prisma client instance
let prisma: PrismaClient | null = null;

/**
 * Get or create Prisma client instance
 */
export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env['NODE_ENV'] === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }
  return prisma;
};

/**
 * Check database connectivity
 */
export const checkDatabaseHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> => {
  const startTime = Date.now();
  
  try {
    const client = getPrismaClient();
    
    // Simple query to check connectivity
    await client.$queryRaw`SELECT 1 as health_check`;
    
    const latency = Date.now() - startTime;
    
    logger.debug('Database health check passed', { latency });
    
    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    
    logger.error('Database health check failed', { 
      error: errorMessage, 
      latency 
    });
    
    return {
      status: 'unhealthy',
      latency,
      error: errorMessage,
    };
  }
};

/**
 * Gracefully disconnect from database
 */
export const disconnectDatabase = async (): Promise<void> => {
  if (prisma) {
    try {
      await prisma.$disconnect();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      prisma = null;
    }
  }
};

// Handle process termination
process.on('beforeExit', () => {
  void disconnectDatabase();
});

process.on('SIGINT', () => {
  void disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  void disconnectDatabase();
  process.exit(0);
});