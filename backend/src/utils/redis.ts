import { createClient, RedisClientType } from 'redis';
import { createLogger } from './logger';

const logger = createLogger('redis');

// Global Redis client instance
let redisClient: RedisClientType | null = null;

/**
 * Get or create Redis client instance
 */
export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
      },
    });

    redisClient.on('error', (error: Error) => {
      logger.error('Redis client error', { error: error.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('disconnect', () => {
      logger.info('Redis client disconnected');
    });
  }
  
  return redisClient;
};

/**
 * Check Redis connectivity
 */
export const checkRedisHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> => {
  const startTime = Date.now();
  
  try {
    const client = getRedisClient();
    
    // Connect if not already connected
    if (!client.isOpen) {
      await client.connect();
    }
    
    // Simple ping to check connectivity
    const pong = await client.ping();
    
    const latency = Date.now() - startTime;
    
    if (pong === 'PONG') {
      logger.debug('Redis health check passed', { latency });
      
      return {
        status: 'healthy',
        latency,
      };
    } else {
      throw new Error('Invalid ping response');
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown Redis error';
    
    logger.error('Redis health check failed', { 
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
 * Gracefully disconnect from Redis
 */
export const disconnectRedis = async (): Promise<void> => {
  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.disconnect();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      redisClient = null;
    }
  }
};

// Handle process termination
process.on('beforeExit', () => {
  void disconnectRedis();
});

process.on('SIGINT', () => {
  void disconnectRedis();
  process.exit(0);
});

process.on('SIGTERM', () => {
  void disconnectRedis();
  process.exit(0);
});