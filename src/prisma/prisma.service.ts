import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');
    if (!connectionString) {
      throw new Error('DATABASE_URL must be defined');
    }

    super({ adapter: new PrismaMariaDb(connectionString) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connexion MySQL etablie (notif_db)');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Connexion MySQL fermee');
  }

  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase interdit en production');
    }
    const tables = [
      'rapports_ia',
      'alertes_ia',
      'tokens_fcm',
      'preferences_notification',
      'notifications',
    ];

    await this.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
    try {
      for (const t of tables) {
        await this.$executeRawUnsafe(`TRUNCATE TABLE \`${t}\``);
      }
    } finally {
      await this.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
    }
  }
}
