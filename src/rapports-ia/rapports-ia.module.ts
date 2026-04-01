import { Module } from '@nestjs/common';
import { RapportsIAController } from './rapports-ia.controller';
import { RapportsIAService } from './rapports-ia.service';
import { RapportsIARepository } from './rapports-ia.repository';
import { EmailChannelModule } from '../channels/email/email-channel.module';

@Module({
  imports: [EmailChannelModule],
  controllers: [RapportsIAController],
  providers: [RapportsIAService, RapportsIARepository],
  exports: [RapportsIAService],
})
export class RapportsIAModule {}
