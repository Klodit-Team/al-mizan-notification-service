import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { RABBITMQ_EXCHANGE } from './rabbitmq.constants';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: any = null;
  private channel: any = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch { /* ignore */ }
    this.logger.log('RabbitMQ déconnecté');
  }

  private async connect(): Promise<void> {
    const url = this.configService.get<string>('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672');
    let retries = 10;
    while (retries > 0) {
      try {
        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange(RABBITMQ_EXCHANGE, 'topic', { durable: true });
        // Dead Letter Exchange
        await this.channel.assertExchange(`${RABBITMQ_EXCHANGE}.dlx`, 'topic', { durable: true });
        this.connection.on('error', () => setTimeout(() => this.connect(), 5000));
        this.connection.on('close', () => setTimeout(() => this.connect(), 5000));
        this.logger.log(`RabbitMQ connecté → ${url}`);
        return;
      } catch {
        retries--;
        this.logger.warn(`RabbitMQ indisponible – retry dans 5s (${retries} restants)`);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
    this.logger.error('Impossible de se connecter à RabbitMQ');
  }

  async publish(routingKey: string, payload: object): Promise<void> {
    if (!this.channel) return;
    this.channel.publish(
      RABBITMQ_EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true, contentType: 'application/json', timestamp: Date.now() },
    );
    this.logger.debug(`[${routingKey}]`);
  }

  async assertQueue(queueName: string, routingKeys: string[]): Promise<void> {
    if (!this.channel) return;
    await this.channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': `${RABBITMQ_EXCHANGE}.dlx`,
        'x-dead-letter-routing-key': `${queueName}.dead`,
      },
    });
    for (const rk of routingKeys) {
      await this.channel.bindQueue(queueName, RABBITMQ_EXCHANGE, rk);
    }
    this.logger.log(`Queue [${queueName}] ← [${routingKeys.join(', ')}]`);
  }

  async consume(
    queueName: string,
    handler: (msg: any) => Promise<void>,
    prefetch = 10,
  ): Promise<void> {
    if (!this.channel) return;
    await this.channel.prefetch(prefetch);
    await this.channel.consume(queueName, async (msg: any) => {
      if (!msg) return;
      try {
        await handler(msg);
        this.channel?.ack(msg);
      } catch (err) {
        this.logger.error(`Erreur consumer [${queueName}]`, err);
        this.channel?.nack(msg, false, false);
      }
    });
    this.logger.log(`Consumer [${queueName}] démarré`);
  }
}
