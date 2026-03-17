import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';
import { ROUTING_KEY } from '../rabbitmq.constants';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationCategory } from '../../common/prisma-enums';
import type * as amqp from 'amqplib';

@Injectable()
export class AuthEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(AuthEventsConsumer.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit(): Promise<void> {
    const queueName = 'notification_queue.auth';
    await this.rabbitMQService.assertQueue(queueName, [
      ROUTING_KEY.USER_INSCRIT,
      ROUTING_KEY.USER_CONNEXION_SUSPECTE,
    ]);
    await this.rabbitMQService.consume(queueName, this.handle.bind(this), 10);
  }

  private async handle(msg: amqp.ConsumeMessage | null): Promise<void> {
    if (!msg) return;
    const routingKey = msg.fields.routingKey;
    const payload = JSON.parse(msg.content.toString());
    this.logger.log(`[auth-events] routingKey=${routingKey}`);

    switch (routingKey) {
      case ROUTING_KEY.USER_INSCRIT:
        await this.handleUserInscrit(payload);
        break;
        await this.handleMfaActive(payload);
        break;
      case ROUTING_KEY.USER_CONNEXION_SUSPECTE:
        await this.handleConnexionSuspecte(payload);
        break;
    }
  }

  private async handleUserInscrit(payload: any): Promise<void> {
    const { userId, email, prenom } = payload;
    await this.notificationsService.createAndDispatch({
      userId,
      titre: 'Bienvenue sur Al-Mizan',
      contenu: `Bonjour ${prenom ?? ''},\n\nVotre compte sur la plateforme Al-Mizan a été créé avec succès.\nVous pouvez désormais consulter les appels d'offres et soumettre vos offres en toute sécurité.\n\nL'équipe Al-Mizan`,
      type: NotificationType.EMAIL,
      categorie: NotificationCategory.SYSTEME,
      destinataire: email,
    });
  }

  private async handleMfaActive(payload: any): Promise<void> {
    const { userId, email } = payload;
    await this.notificationsService.createAndDispatch({
      userId,
      titre: 'Authentification à deux facteurs activée',
      contenu: `L'authentification à deux facteurs (MFA) a été activée sur votre compte Al-Mizan. Votre compte est maintenant mieux protégé.`,
      type: NotificationType.EMAIL,
      categorie: NotificationCategory.SYSTEME,
      destinataire: email,
    });
  }

  private async handleConnexionSuspecte(payload: any): Promise<void> {
    const { userId, email, ipAddress, userAgent, timestamp } = payload;
    await this.notificationsService.createAndDispatch({
      userId,
      titre: 'Connexion suspecte détectée',
      contenu: `Une connexion suspecte a été détectée sur votre compte le ${timestamp}.\nIP : ${ipAddress}\nNavigateur : ${userAgent}\n\nSi vous n'êtes pas à l'origine de cette connexion, changez immédiatement votre mot de passe.`,
      type: NotificationType.EMAIL,
      categorie: NotificationCategory.SYSTEME,
      destinataire: email,
    });
  }
}
