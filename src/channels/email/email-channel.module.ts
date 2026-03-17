import { Module } from '@nestjs/common';
import { EmailChannelService } from './email-channel.service';

@Module({
  providers: [EmailChannelService],
  exports: [EmailChannelService],
})
export class EmailChannelModule {}
