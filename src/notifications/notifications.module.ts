import { Module, forwardRef } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { EmailChannelModule } from '../channels/email/email-channel.module';
import { SmsChannelModule } from '../channels/sms/sms-channel.module';
import { PushChannelModule } from '../channels/push/push-channel.module';
import { DeviceTokensModule } from '../device-tokens/device-tokens.module';
import { PreferencesModule } from '../preferences/preferences.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    RedisModule, // ← was missing, RedisService needed by NotificationsService
    EmailChannelModule,
    SmsChannelModule,
    PushChannelModule,
    forwardRef(() => DeviceTokensModule),
    forwardRef(() => PreferencesModule),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository],
  exports: [NotificationsService, NotificationsRepository],
})
export class NotificationsModule {}
