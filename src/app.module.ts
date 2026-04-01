import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { RedisModule } from './redis/redis.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AlertesIAModule } from './alertes-ia/alertes-ia.module';
import { RapportsIAModule } from './rapports-ia/rapports-ia.module';
import { DeviceTokensModule } from './device-tokens/device-tokens.module';
import { PreferencesModule } from './preferences/preferences.module';
import { EmailChannelModule } from './channels/email/email-channel.module';
import { SmsChannelModule } from './channels/sms/sms-channel.module';
import { PushChannelModule } from './channels/push/push-channel.module';
import { HealthController } from './health.controller';
import { AuthEventsConsumer } from './rabbitmq/consumers/auth-events.consumer';
import { AoEventsConsumer } from './rabbitmq/consumers/ao-events.consumer';
import { SoumissionEventsConsumer } from './rabbitmq/consumers/soumission-events.consumer';
import { EvaluationEventsConsumer } from './rabbitmq/consumers/evaluation-events.consumer';
import { RecoursEventsConsumer } from './rabbitmq/consumers/recours-events.consumer';
import { IaEventsConsumer } from './rabbitmq/consumers/ia-events.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 },
      { name: 'medium', ttl: 10000, limit: 100 },
      { name: 'long', ttl: 60000, limit: 500 },
    ]),
    PrismaModule,
    RabbitMQModule,
    RedisModule,
    EmailChannelModule,
    SmsChannelModule,
    PushChannelModule,
    NotificationsModule,
    AlertesIAModule,
    RapportsIAModule,
    DeviceTokensModule,
    PreferencesModule,
  ],
  controllers: [HealthController],
  providers: [
    AuthEventsConsumer,
    AoEventsConsumer,
    SoumissionEventsConsumer,
    EvaluationEventsConsumer,
    RecoursEventsConsumer,
    IaEventsConsumer,
  ],
})
export class AppModule {}
