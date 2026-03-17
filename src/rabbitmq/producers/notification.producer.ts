import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';
import { ROUTING_KEY } from '../rabbitmq.constants';

@Injectable()
export class NotificationProducer {
  private readonly logger = new Logger(NotificationProducer.name);

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async publishNotifEnvoyee(payload: {
    notificationId: string;
    userId: string;
    type: string;
    categorie: string;
  }): Promise<void> {
    await this.rabbitMQService.publish(ROUTING_KEY.NOTIF_ENVOYEE, {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  async publishNotifEchec(payload: {
    notificationId: string;
    userId: string;
    type: string;
    erreur: string;
    tentatives: number;
  }): Promise<void> {
    await this.rabbitMQService.publish(ROUTING_KEY.NOTIF_ECHEC, {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  async publishAlerteIAEmise(payload: {
    alerteId: string;
    typeAlerte: string;
    niveauUrgence: string;
    entiteType?: string;
    entiteId?: string;
    utilisateursCibles: string[];
  }): Promise<void> {
    await this.rabbitMQService.publish(ROUTING_KEY.ALERTE_IA_EMISE, {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  async publishRapportIAEnvoye(payload: {
    rapportId: string;
    typeRapport: string;
    destinataires: string[];
  }): Promise<void> {
    await this.rabbitMQService.publish(ROUTING_KEY.RAPPORT_IA_ENVOYE, {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }
}
