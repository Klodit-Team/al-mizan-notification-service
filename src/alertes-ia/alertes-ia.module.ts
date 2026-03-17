import { Module, forwardRef } from '@nestjs/common';
import { AlertesIAController } from './alertes-ia.controller';
import { AlertesIAService } from './alertes-ia.service';
import { AlertesIARepository } from './alertes-ia.repository';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [forwardRef(() => NotificationsModule)],
  controllers: [AlertesIAController],
  providers: [AlertesIAService, AlertesIARepository],
  exports: [AlertesIAService, AlertesIARepository],
})
export class AlertesIAModule {}
