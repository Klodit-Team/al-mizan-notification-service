import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';
import { ROUTING_KEY } from '../rabbitmq.constants';
import { AlertesIAService } from '../../alertes-ia/alertes-ia.service';
import { AlerteIAType, NiveauUrgence } from '../../common/prisma-enums';
import type * as amqp from 'amqplib';

@Injectable()
export class IaEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(IaEventsConsumer.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly alertesIAService: AlertesIAService,
  ) {}

  async onModuleInit(): Promise<void> {
    const queueName = 'notification_queue.ia';
    await this.rabbitMQService.assertQueue(queueName, [
      ROUTING_KEY.IA_ALERTE,
      ROUTING_KEY.IA_DIVERGENCE,
      ROUTING_KEY.IA_ERREUR,
    ]);
    await this.rabbitMQService.consume(queueName, this.handle.bind(this), 3);
  }

  private async handle(msg: amqp.ConsumeMessage | null): Promise<void> {
    if (!msg) return;
    const routingKey = msg.fields.routingKey;
    const payload = JSON.parse(msg.content.toString());
    this.logger.log(`[ia-events] routingKey=${routingKey}`);

    switch (routingKey) {
      case ROUTING_KEY.IA_ALERTE:
        await this.handleAlerteIA(payload);
        break;
      case ROUTING_KEY.IA_DIVERGENCE:
        await this.handleDivergence(payload);
        break;
      case ROUTING_KEY.IA_ERREUR:
        await this.handleErreur(payload);
        break;
    }
  }

  private async handleAlerteIA(payload: any): Promise<void> {
    const {
      incidentId,
      typeAlerte,
      niveauUrgence,
      titre,
      message,
      utilisateursCibles,
      donneesContexte,
      entiteType,
      entiteId,
    } = payload;

    await this.alertesIAService.create({
      incidentId,
      titre: titre ?? `Alerte IA : ${typeAlerte}`,
      message: message ?? 'Une alerte a été détectée par le système IA.',
      typeAlerte: typeAlerte as AlerteIAType,
      niveauUrgence: niveauUrgence as NiveauUrgence,
      utilisateursCibles: utilisateursCibles ?? [],
      donneesContexte,
      entiteType,
      entiteId,
    });
  }

  private async handleDivergence(payload: any): Promise<void> {
    const { incidentId, source, entiteType, entiteId, utilisateursCibles, details } = payload;
    await this.alertesIAService.create({
      incidentId,
      titre: `Divergence IA détectée – ${source}`,
      message: `Une divergence entre la décision IA et la décision humaine a été détectée. Détails : ${JSON.stringify(details)}`,
      typeAlerte:
        source === 'GRE_A_GRE'
          ? AlerteIAType.DIVERGENCE_GRE_A_GRE
          : AlerteIAType.DIVERGENCE_EVALUATION,
      niveauUrgence: NiveauUrgence.WARNING,
      utilisateursCibles: utilisateursCibles ?? [],
      entiteType,
      entiteId,
    });
  }

  private async handleErreur(payload: any): Promise<void> {
    const { incidentId, modeleIA, erreur, utilisateursCibles } = payload;
    await this.alertesIAService.create({
      incidentId,
      titre: `Erreur modèle IA – ${modeleIA}`,
      message: `Une erreur s'est produite dans le modèle IA "${modeleIA}" : ${erreur}`,
      typeAlerte: AlerteIAType.ERREUR_MODELE,
      niveauUrgence: NiveauUrgence.ERROR,
      utilisateursCibles: utilisateursCibles ?? [],
    });
  }
}
