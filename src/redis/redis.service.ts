import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      retryStrategy: (times) => {
        if (times >= 5) {
          this.logger.warn(
            'Redis indisponible — fonctionnement dégradé (sans cache/déduplication)',
          );
          return null; // stop retrying after 5 attempts
        }
        return Math.min(times * 500, 3000);
      },
      lazyConnect: true,
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.log('Redis connecté');
    });

    this.client.on('error', (err) => {
      if (this.isConnected) {
        this.logger.error('Redis error', err.message);
      }
      this.isConnected = false;
    });

    this.client.on('close', () => {
      this.isConnected = false;
    });

    // attempt connection without blocking module init
    this.client.connect().catch(() => {
      this.logger.warn('Redis non disponible au démarrage — fonctionnement dégradé');
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.isConnected) return;
    try {
      if (ttl) await this.client.setex(key, ttl, value);
      else await this.client.set(key, value);
    } catch {
      // silent — Redis down, skip caching
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.del(key);
    } catch {
      // silent
    }
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

  /**
   * Déduplication : retourne true si doublon.
   * Si Redis est down, retourne false (on laisse passer — pas de déduplication).
   */
  async isDuplicate(key: string): Promise<boolean> {
    if (!this.isConnected) return false;
    try {
      const result = await this.client.set(`notif:idem:${key}`, '1', 'EX', 300, 'NX');
      return result === null;
    } catch {
      return false;
    }
  }
}
