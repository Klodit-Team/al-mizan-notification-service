import { Module, Global } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { NotificationProducer } from './producers/notification.producer';

@Global()
@Module({
  providers: [RabbitMQService, NotificationProducer],
  exports: [RabbitMQService, NotificationProducer],
})
export class RabbitMQModule {}
