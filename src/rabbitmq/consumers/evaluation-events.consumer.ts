import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';
import { ROUTING_KEY } from '../rabbitmq.constants';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationCategory } from '../../common/prisma-enums';
import type * as amqp from 'amqplib';

@Injectable()
export class EvaluationEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(EvaluationEventsConsumer.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit(): Promise<void> {
    const queueName = 'notification_queue.evaluation';
    await this.rabbitMQService.assertQueue(queueName, [
      ROUTING_KEY.EVALUATION_DEMARREE,
      ROUTING_KEY.EVALUATION_TERMINEE,
      ROUTING_KEY.OUVERTURE_PLIS,
    ]);
    await this.rabbitMQService.consume(queueName, this.handle.bind(this), 5);
  }

  private async handle(msg: amqp.ConsumeMessage | null): Promise<void> {
    if (!msg) return;
    const routingKey = msg.fields.routingKey;
    const payload = JSON.parse(msg.content.toString());
    this.logger.log(`[evaluation-events] routingKey=${routingKey}`);

    switch (routingKey) {
      case ROUTING_KEY.OUVERTURE_PLIS:
        await this.handleOuverturePlis(payload);
        break;
      case ROUTING_KEY.EVALUATION_DEMARREE:
        await this.handleEvaluationDemarree(payload);
        break;
      case ROUTING_KEY.EVALUATION_TERMINEE:
        await this.handleEvaluationTerminee(payload);
        break;
    }
  }

  private async handleOuverturePlis(payload: any): Promise<void> {
    const { appelOffreId, appelOffreObjet, membresCommission = [] } = payload;
    for (const userId of membresCommission) {
      await this.notificationsService.createAndDispatch({
        userId,
        titre: `Séance d'ouverture des plis – ${appelOffreObjet}`,
        contenu: `La séance d'ouverture des plis pour l'AO (réf. ${appelOffreId}) vient de démarrer. Veuillez vous connecter à la plateforme.`,
        type: NotificationType.EMAIL,
        categorie: NotificationCategory.OUVERTURE,
        entiteType: 'APPEL_OFFRE',
        entiteId: appelOffreId,
      });
    }
  }

  private async handleEvaluationDemarree(payload: any): Promise<void> {
    const { appelOffreId, appelOffreObjet, evaluateurs = [] } = payload;
    for (const userId of evaluateurs) {
      await this.notificationsService.createAndDispatch({
        userId,
        titre: `Évaluation démarrée – ${appelOffreObjet}`,
        contenu: `L'évaluation des offres pour l'AO (réf. ${appelOffreId}) a démarré. Vos notations sont attendues.`,
        type: NotificationType.PLATEFORME,
        categorie: NotificationCategory.EVALUATION,
        entiteType: 'APPEL_OFFRE',
        entiteId: appelOffreId,
      });
    }
  }

  private async handleEvaluationTerminee(payload: any): Promise<void> {
    const { appelOffreId, appelOffreObjet, serviceContractantId } = payload;
    await this.notificationsService.createAndDispatch({
      userId: serviceContractantId,
      titre: `Évaluation terminée – ${appelOffreObjet}`,
      contenu: `L'évaluation des offres pour l'AO (réf. ${appelOffreId}) est terminée. Vous pouvez consulter le classement et prononcer l'attribution provisoire.`,
      type: NotificationType.EMAIL,
      categorie: NotificationCategory.EVALUATION,
      entiteType: 'APPEL_OFFRE',
      entiteId: appelOffreId,
    });
  }
}
