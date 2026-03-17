import { Module, forwardRef } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { EmailChannelModule } from '../channels/email/email-channel.module';
import { SmsChannelModule } from '../channels/sms/sms-channel.module';
import { PushChannelModule } from '../channels/push/push-channel.module';
import { DeviceTokensModule } from '../device-tokens/device-tokens.module';
import { PreferencesModule } from '../preferences/preferences.module';

@Module({
  imports: [
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
