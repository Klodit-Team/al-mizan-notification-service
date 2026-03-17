import { Module } from '@nestjs/common';
import { PushChannelService } from './push-channel.service';

@Module({
  providers: [PushChannelService],
  exports: [PushChannelService],
})
export class PushChannelModule {}
