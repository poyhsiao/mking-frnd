import { checkDatabaseHealth } from '../utils/database';
import { checkRedisHealth } from '../utils/redis';
import { createLogger } from '../utils/logger';

const logger = createLogger('health-service');

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
  };
  system: {
    memory: MemoryInfo;
    cpu: CpuInfo;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
  lastChecked: string;
}

export interface MemoryInfo {
  used: number;
  total: number;
  percentage: number;
}

export interface CpuInfo {
  loadAverage: number[];
}

/**
 * Get system memory information
 */
const getMemoryInfo = (): MemoryInfo => {
  const used = process.memoryUsage();
  const total = used.heapTotal;
  const percentage = Math.round((used.heapUsed / total) * 100);

  return {
    used: used.heapUsed,
    total,
    percentage,
  };
};

/**
 * Get CPU information
 */
const getCpuInfo = (): CpuInfo => {
  // Note: loadavg is not available on all platforms (e.g., Windows)
  // For cross-platform compatibility, we'll use a default value
  return {
    loadAverage: [0, 0, 0],
  };
};

/**
 * Perform comprehensive health check
 */
export const performHealthCheck = async (): Promise<HealthCheckResult> => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  logger.debug('Starting health check');

  // Check all services in parallel
  const [databaseHealth, redisHealth] = await Promise.allSettled([
    checkDatabaseHealth(),
    checkRedisHealth(),
  ]);

  // Process database health result
  const dbResult: ServiceHealth = {
    status: databaseHealth.status === 'fulfilled' ? databaseHealth.value.status : 'unhealthy',
    lastChecked: timestamp,
  };
  
  if (databaseHealth.status === 'fulfilled') {
    if (databaseHealth.value.latency !== undefined) {
      dbResult.latency = databaseHealth.value.latency;
    }
    if (databaseHealth.value.error !== undefined) {
      dbResult.error = databaseHealth.value.error;
    }
  } else {
    dbResult.error = databaseHealth.reason instanceof Error 
      ? databaseHealth.reason.message 
      : 'Database check failed';
  }

  // Process Redis health result
  const redisResult: ServiceHealth = {
    status: redisHealth.status === 'fulfilled' ? redisHealth.value.status : 'unhealthy',
    lastChecked: timestamp,
  };
  
  if (redisHealth.status === 'fulfilled') {
    if (redisHealth.value.latency !== undefined) {
      redisResult.latency = redisHealth.value.latency;
    }
    if (redisHealth.value.error !== undefined) {
      redisResult.error = redisHealth.value.error;
    }
  } else {
    redisResult.error = redisHealth.reason instanceof Error 
      ? redisHealth.reason.message 
      : 'Redis check failed';
  }

  // Determine overall status
  const allHealthy = dbResult.status === 'healthy' && redisResult.status === 'healthy';
  const anyHealthy = dbResult.status === 'healthy' || redisResult.status === 'healthy';
  
  const overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 
    allHealthy ? 'healthy' : anyHealthy ? 'degraded' : 'unhealthy';

  const result: HealthCheckResult = {
    status: overallStatus,
    timestamp,
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'] || 'development',
    version: process.env['npm_package_version'] || '1.0.0',
    services: {
      database: dbResult,
      redis: redisResult,
    },
    system: {
      memory: getMemoryInfo(),
      cpu: getCpuInfo(),
    },
  };

  const duration = Date.now() - startTime;
  
  logger.info('Health check completed', { 
    status: overallStatus, 
    duration,
    services: {
      database: dbResult.status,
      redis: redisResult.status,
    }
  });

  return result;
};

/**
 * Simple health check for Docker health checks
 */
export const performSimpleHealthCheck = async (): Promise<{
  status: 'ok' | 'error';
  timestamp: string;
}> => {
  try {
    const result = await performHealthCheck();
    
    return {
      status: result.status === 'unhealthy' ? 'error' : 'ok',
      timestamp: result.timestamp,
    };
  } catch (error) {
    logger.error('Simple health check failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
    };
  }
};