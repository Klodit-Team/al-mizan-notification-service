import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';
import { ROUTING_KEY } from '../rabbitmq.constants';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationCategory } from '../../common/prisma-enums';
import type * as amqp from 'amqplib';

@Injectable()
export class SoumissionEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(SoumissionEventsConsumer.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit(): Promise<void> {
    const queueName = 'notification_queue.soumission';
    await this.rabbitMQService.assertQueue(queueName, [
      ROUTING_KEY.SOUMISSION_DEPOSEE,
      ROUTING_KEY.SOUMISSION_REJETEE,
      ROUTING_KEY.SOUMISSION_EVALUEE,
    ]);
    await this.rabbitMQService.consume(queueName, this.handle.bind(this), 10);
  }

  private async handle(msg: amqp.ConsumeMessage | null): Promise<void> {
    if (!msg) return;
    const routingKey = msg.fields.routingKey;
    const payload = JSON.parse(msg.content.toString());
    this.logger.log(`[soumission-events] routingKey=${routingKey}`);

    switch (routingKey) {
      case ROUTING_KEY.SOUMISSION_DEPOSEE:
        await this.handleDeposee(payload);
        break;
      case ROUTING_KEY.SOUMISSION_REJETEE:
        await this.handleRejetee(payload);
        break;
      case ROUTING_KEY.SOUMISSION_EVALUEE:
        await this.handleEvaluee(payload);
        break;
    }
  }

  private async handleDeposee(payload: any): Promise<void> {
    const { soumissionId, operateurId, appelOffreObjet, reference } = payload;
    // Notif à l'opérateur économique
    await this.notificationsService.createAndDispatch({
      userId: operateurId,
      titre: `Soumission reçue – ${appelOffreObjet}`,
      contenu: `Votre soumission (réf. ${reference}) a été reçue et horodatée par notre serveur. Référence : ${soumissionId}.`,
      type: NotificationType.EMAIL,
      categorie: NotificationCategory.DEPOT,
      entiteType: 'SOUMISSION',
      entiteId: soumissionId,
    });
    // Push aussi
    await this.notificationsService.createAndDispatch({
      userId: operateurId,
      titre: `Dépôt confirmé – ${appelOffreObjet}`,
      contenu: `Votre offre a été déposée avec succès.`,
      type: NotificationType.PUSH,
      categorie: NotificationCategory.DEPOT,
      entiteType: 'SOUMISSION',
      entiteId: soumissionId,
    });
  }

  private async handleRejetee(payload: any): Promise<void> {
    const { soumissionId, operateurId, motifRejet, appelOffreObjet } = payload;
    await this.notificationsService.createAndDispatch({
      userId: operateurId,
      titre: `Soumission rejetée – ${appelOffreObjet}`,
      contenu: `Votre soumission (réf. ${soumissionId}) a été rejetée. Motif : ${motifRejet}`,
      type: NotificationType.EMAIL,
      categorie: NotificationCategory.DEPOT,
      entiteType: 'SOUMISSION',
      entiteId: soumissionId,
    });
  }

  private async handleEvaluee(payload: any): Promise<void> {
    const { soumissionId, operateurId, appelOffreObjet } = payload;
    await this.notificationsService.createAndDispatch({
      userId: operateurId,
      titre: `Résultats d'évaluation disponibles – ${appelOffreObjet}`,
      contenu: `L'évaluation de votre soumission (réf. ${soumissionId}) est terminée. Consultez la plateforme pour voir les résultats.`,
      type: NotificationType.EMAIL,
      categorie: NotificationCategory.EVALUATION,
      entiteType: 'SOUMISSION',
      entiteId: soumissionId,
    });
  }
}
