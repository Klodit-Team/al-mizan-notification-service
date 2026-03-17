import { Module } from '@nestjs/common';
import { SmsChannelService } from './sms-channel.service';

@Module({
  providers: [SmsChannelService],
  exports: [SmsChannelService],
})
export class SmsChannelModule {}
