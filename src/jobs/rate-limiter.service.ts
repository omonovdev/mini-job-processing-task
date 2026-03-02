import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private readonly rateLimits: Record<string, RateLimitConfig>;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {
    this.rateLimits = {
      email: {
        maxRequests: this.configService.get<number>('rateLimit.email.max', 5),
        windowSeconds: this.configService.get<number>(
          'rateLimit.email.window',
          60,
        ),
      },
      report: {
        maxRequests: this.configService.get<number>('rateLimit.report.max', 2),
        windowSeconds: this.configService.get<number>(
          'rateLimit.report.window',
          60,
        ),
      },
    };
  }

  async isAllowed(taskType: string): Promise<boolean> {
    const config = this.rateLimits[taskType];
    if (!config) {
      return true;
    }

    try {
      const key = `rate_limit:${taskType}`;
      const current = await this.redis.incr(key);

      if (current === 1) {
        await this.redis.expire(key, config.windowSeconds);
      }

      if (current > config.maxRequests) {
        this.logger.warn(
          `Rate limit exceeded for type "${taskType}" (${current}/${config.maxRequests})`,
        );
        return false;
      }

      return true;
    } catch {
      this.logger.error(`Redis error in rate limiter, allowing request`);
      return true;
    }
  }

  async getDelayMs(taskType: string): Promise<number> {
    const config = this.rateLimits[taskType];
    if (!config) return 0;

    try {
      const key = `rate_limit:${taskType}`;
      const ttl = await this.redis.ttl(key);
      return ttl > 0 ? ttl * 1000 : 0;
    } catch {
      return config.windowSeconds * 1000;
    }
  }
}
