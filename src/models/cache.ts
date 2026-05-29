import Redis from 'ioredis';

// Redis configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client
export const redisClient = new Redis(REDIS_URL, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

// Cache keys prefix
const CACHE_PREFIX = 'edubot:';

// Cache TTL in seconds
const DEFAULT_TTL = 3600; // 1 hour

// Cache wrapper class
export class Cache {
  static async get(key: string): Promise<any> {
    const data = await redisClient.get(`${CACHE_PREFIX}${key}`);
    return data ? JSON.parse(data) : null;
  }

  static async set(key: string, value: any, ttl: number = DEFAULT_TTL): Promise<void> {
    await redisClient.setex(
      `${CACHE_PREFIX}${key}`,
      ttl,
      JSON.stringify(value)
    );
  }

  static async del(key: string): Promise<void> {
    await redisClient.del(`${CACHE_PREFIX}${key}`);
  }

  static async clearPattern(pattern: string): Promise<void> {
    const keys = await redisClient.keys(`${CACHE_PREFIX}${pattern}*`);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  }

  // Cache college data
  static async getCollegeData(collegeId: string): Promise<any> {
    return await Cache.get(`college:${collegeId}`);
  }

  static async setCollegeData(collegeId: string, data: any): Promise<void> {
    await Cache.set(`college:${collegeId}`, data);
  }

  // Cache user session
  static async getUserSession(userId: string): Promise<any> {
    return await Cache.get(`session:${userId}`);
  }

  static async setUserSession(userId: string, data: any): Promise<void> {
    await Cache.set(`session:${userId}`, data, 86400); // 24 hours TTL
  }

  // Cache chat history
  static async getChatHistory(sessionId: string): Promise<any> {
    return await Cache.get(`chat:${sessionId}`);
  }

  static async setChatHistory(sessionId: string, messages: any[]): Promise<void> {
    await Cache.set(`chat:${sessionId}`, messages);
  }

  // Cache analytics data
  static async getAnalytics(key: string): Promise<any> {
    return await Cache.get(`analytics:${key}`);
  }

  static async setAnalytics(key: string, data: any): Promise<void> {
    await Cache.set(`analytics:${key}`, data, 7200); // 2 hours TTL
  }
}