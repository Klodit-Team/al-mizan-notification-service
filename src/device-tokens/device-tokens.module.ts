import { Module } from '@nestjs/common';
import { DeviceTokensController } from './device-tokens.controller';
import { DeviceTokensService } from './device-tokens.service';
import { DeviceTokensRepository } from './device-tokens.repository';

@Module({
  controllers: [DeviceTokensController],
  providers: [DeviceTokensService, DeviceTokensRepository],
  exports: [DeviceTokensService, DeviceTokensRepository],
})
export class DeviceTokensModule {}
