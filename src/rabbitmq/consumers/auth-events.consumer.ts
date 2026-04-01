import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';
import { QUEUE_NOTIF_USER, QUEUE_NOTIF_AUTH, ROUTING_KEY } from '../rabbitmq.constants';
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
    // Queue: notifications.user — consumes user.registered published by Auth (integration flow step 10)
    await this.rabbitMQService.assertQueue(QUEUE_NOTIF_USER, [ROUTING_KEY.USER_REGISTERED]);
    await this.rabbitMQService.consume(QUEUE_NOTIF_USER, this.handleUserRegistered.bind(this), 10);

    // Queue: notification_auth_queue — consumes internal auth events
    await this.rabbitMQService.assertQueue(QUEUE_NOTIF_AUTH, [
      ROUTING_KEY.USER_INSCRIT,
      ROUTING_KEY.USER_MFA_ACTIVE,
      ROUTING_KEY.USER_CONNEXION_SUSPECTE,
    ]);
    await this.rabbitMQService.consume(QUEUE_NOTIF_AUTH, this.handleAuthEvent.bind(this), 10);
  }

  // ─── notifications.user consumer ────────────────────────────────────────────

  private async handleUserRegistered(msg: amqp.ConsumeMessage | null): Promise<void> {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString()) as UserRegisteredNotificationPayload;
      const { user_id, email, langue } = payload;
      const content = this.buildVerificationContent(langue);

      await this.notificationsService.createAndDispatch({
        userId: user_id,
        titre: content.titre,
        contenu: content.body,
        type: NotificationType.EMAIL,
        categorie: NotificationCategory.SYSTEME,
        destinataire: email,
      });

      this.logger.log(
        `[USER_REGISTERED] verification email sent → user_id=${user_id}, langue=${langue}`,
      );
    } catch (err) {
      this.logger.error('[USER_REGISTERED] failed to process message', err);
      throw err;
    }
  }

  private buildVerificationContent(langue: string): { titre: string; body: string } {
    switch (langue) {
      case 'ar':
        return {
          titre: 'تأكيد حسابك على منصة الميزان',
          body: 'شكراً لتسجيلك في منصة الميزان.\nيرجى تأكيد بريدك الإلكتروني لتفعيل حسابك.\n\nفريق الميزان',
        };
      case 'en':
        return {
          titre: 'Verify your Al-Mizan account',
          body: 'Thank you for registering on Al-Mizan.\nPlease verify your email address to activate your account.\n\nThe Al-Mizan team',
        };
      default: // 'fr'
        return {
          titre: 'Vérifiez votre compte Al-Mizan',
          body: "Merci de vous être inscrit sur Al-Mizan.\nVeuillez vérifier votre adresse e-mail pour activer votre compte.\n\nL'équipe Al-Mizan",
        };
    }
  }

  // ─── notification_auth_queue consumer ───────────────────────────────────────

  private async handleAuthEvent(msg: amqp.ConsumeMessage | null): Promise<void> {
    if (!msg) return;

    const routingKey = msg.fields.routingKey;
    const payload = JSON.parse(msg.content.toString());
    this.logger.log(`[auth-events] routingKey=${routingKey}`);

    switch (routingKey) {
      case ROUTING_KEY.USER_INSCRIT:
        await this.handleUserInscrit(payload);
        break;
      case ROUTING_KEY.USER_MFA_ACTIVE:
        await this.handleMfaActive(payload);
        break;
      case ROUTING_KEY.USER_CONNEXION_SUSPECTE:
        await this.handleConnexionSuspecte(payload);
        break;
      default:
        this.logger.warn(`[auth-events] unhandled routingKey=${routingKey}`);
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

// ─── Payload interfaces ──────────────────────────────────────────────────────

export interface UserRegisteredNotificationPayload {
  event_id: string;
  correlation_id: string;
  user_id: string;
  email: string;
  action: 'USER_REGISTERED';
  langue: string;
  sent_at: string;
}
