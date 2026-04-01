import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';
import { ROUTING_KEY } from '../rabbitmq.constants';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationCategory } from '../../common/prisma-enums';
import type * as amqp from 'amqplib';

@Injectable()
export class RecoursEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(RecoursEventsConsumer.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit(): Promise<void> {
    const queueName = 'notification_queue.recours';
    await this.rabbitMQService.assertQueue(queueName, [
      ROUTING_KEY.RECOURS_DEPOSE,
      ROUTING_KEY.RECOURS_EN_EXAMEN,
      ROUTING_KEY.RECOURS_STATUE,
    ]);
    await this.rabbitMQService.consume(queueName, this.handle.bind(this), 5);
  }

  private async handle(msg: amqp.ConsumeMessage | null): Promise<void> {
    if (!msg) return;
    const routingKey = msg.fields.routingKey;
    const payload = JSON.parse(msg.content.toString());
    this.logger.log(`[recours-events] routingKey=${routingKey}`);

    switch (routingKey) {
      case ROUTING_KEY.RECOURS_DEPOSE:
        await this.handleDepose(payload);
        break;
      case ROUTING_KEY.RECOURS_EN_EXAMEN:
        await this.handleEnExamen(payload);
        break;
      case ROUTING_KEY.RECOURS_STATUE:
        await this.handleStatue(payload);
        break;
    }
  }

  private async handleDepose(payload: any): Promise<void> {
    const { recoursId, reference, operateurId, serviceContractantId, appelOffreObjet } = payload;
    // Accusé de réception à l'opérateur
    await this.notificationsService.createAndDispatch({
      userId: operateurId,
      titre: `Recours reçu – ${reference}`,
      contenu: `Votre recours (réf. ${reference}) contre la procédure "${appelOffreObjet}" a été enregistré. Vous recevrez une réponse dans les délais légaux.`,
      type: NotificationType.EMAIL,
      categorie: NotificationCategory.RECOURS,
      entiteType: 'RECOURS',
      entiteId: recoursId,
    });
    // Alerte au service contractant
    if (serviceContractantId) {
      await this.notificationsService.createAndDispatch({
        userId: serviceContractantId,
        titre: `Nouveau recours déposé – ${appelOffreObjet}`,
        contenu: `Un recours (réf. ${reference}) a été déposé contre la procédure "${appelOffreObjet}". L'attribution définitive est suspendue.`,
        type: NotificationType.EMAIL,
        categorie: NotificationCategory.RECOURS,
        entiteType: 'RECOURS',
        entiteId: recoursId,
      });
    }
  }

  private async handleEnExamen(payload: any): Promise<void> {
    const { recoursId, reference, operateurId } = payload;
    await this.notificationsService.createAndDispatch({
      userId: operateurId,
      titre: `Recours en cours d'examen – ${reference}`,
      contenu: `Votre recours (réf. ${reference}) est en cours d'examen par la commission des marchés.`,
      type: NotificationType.PLATEFORME,
      categorie: NotificationCategory.RECOURS,
      entiteType: 'RECOURS',
      entiteId: recoursId,
    });
  }

  private async handleStatue(payload: any): Promise<void> {
    const { recoursId, reference, operateurId, decision, motifDecision } = payload;
    const titre =
      decision === 'ACCEPTE' ? `Recours accepté – ${reference}` : `Recours rejeté – ${reference}`;
    await this.notificationsService.createAndDispatch({
      userId: operateurId,
      titre,
      contenu: `Votre recours (réf. ${reference}) a été ${decision === 'ACCEPTE' ? 'accepté' : 'rejeté'}. Motif : ${motifDecision}`,
      type: NotificationType.EMAIL,
      categorie: NotificationCategory.RECOURS,
      entiteType: 'RECOURS',
      entiteId: recoursId,
    });
  }
}
