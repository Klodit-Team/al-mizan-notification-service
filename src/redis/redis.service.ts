import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });
    this.client.on('connect', () => this.logger.log('Redis connecté'));
    this.client.on('error', (err) => this.logger.error('Redis error', err.message));
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) await this.client.setex(key, ttl, value);
    else await this.client.set(key, value);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async getUserDeviceTokens(userId: string): Promise<string[] | null> {
    const cached = await this.get(`device_tokens:${userId}`);
    return cached ? (JSON.parse(cached) as string[]) : null;
  }

  async setUserDeviceTokens(userId: string, tokens: string[]): Promise<void> {
    await this.set(`device_tokens:${userId}`, JSON.stringify(tokens), 900);
  }

  async invalidateUserDeviceTokens(userId: string): Promise<void> {
    await this.del(`device_tokens:${userId}`);
  }

  /** Déduplication : retourne true si doublon */
  async isDuplicate(key: string): Promise<boolean> {
    const result = await this.client.set(`notif:idem:${key}`, '1', 'EX', 300, 'NX');
    return result === null;
  }
}
