import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { EmailChannelService } from '../channels/email/email-channel.service';
import { SmsChannelService } from '../channels/sms/sms-channel.service';
import { PushChannelService } from '../channels/push/push-channel.service';
import { RedisService } from '../redis/redis.service';
import { CreateNotificationDto, FilterNotificationDto } from './dto';
import { NotificationType, StatutNotification } from '../common/prisma-enums';
import { DeviceTokensRepository } from '../device-tokens/device-tokens.repository';
import { PreferencesRepository } from '../preferences/preferences.repository';

export type DispatchPayload = CreateNotificationDto;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly repo: NotificationsRepository,
    private readonly emailService: EmailChannelService,
    private readonly smsService: SmsChannelService,
    private readonly pushService: PushChannelService,
    private readonly redisService: RedisService,
    private readonly deviceTokensRepo: DeviceTokensRepository,
    private readonly preferencesRepo: PreferencesRepository,
  ) {}

  /**
   * Crée une notification en BDD et la dispatche immédiatement.
   * Respecte les préférences utilisateur (opt-out par canal/catégorie).
   */
  async createAndDispatch(dto: DispatchPayload): Promise<void> {
    const canSend = await this.checkUserPreference(dto.userId, dto.type, dto.categorie);
    if (!canSend) {
      this.logger.debug(
        `Notification ignorée (préférence désactivée) – userId=${dto.userId} type=${dto.type} cat=${dto.categorie}`,
      );
      return;
    }

    // Déduplication via Redis (5 min TTL)
    const idempotencyKey = `${dto.userId}:${dto.type}:${dto.categorie}:${dto.entiteId ?? 'none'}`;
    const isDup = await this.redisService.isDuplicate(idempotencyKey);
    if (isDup) {
      this.logger.debug(`Notification dupliquée ignorée – key=${idempotencyKey}`);
      return;
    }

    const notification = await this.repo.create({
      userId: dto.userId,
      titre: dto.titre,
      contenu: dto.contenu,
      type: dto.type,
      categorie: dto.categorie,
      statut: StatutNotification.EN_ATTENTE,
      destinataire: dto.destinataire ?? null,
      refEntiteType: dto.entiteType ?? null,
      refEntiteId: dto.entiteId ?? null,
    });

    // Dispatch asynchrone — ne bloque pas la réponse HTTP
    this.dispatch(notification.id, dto).catch((err) =>
      this.logger.error(`Erreur dispatch notif ${notification.id}`, err),
    );
  }

  async create(dto: CreateNotificationDto) {
    return this.repo.create({
      userId: dto.userId,
      titre: dto.titre,
      contenu: dto.contenu,
      type: dto.type,
      categorie: dto.categorie,
      statut: StatutNotification.EN_ATTENTE,
      destinataire: dto.destinataire ?? null,
      refEntiteType: dto.entiteType ?? null,
      refEntiteId: dto.entiteId ?? null,
    });
  }

  private async dispatch(notificationId: string, dto: DispatchPayload): Promise<void> {
    // Pas de statut EN_COURS dans Prisma — on reste EN_ATTENTE jusqu'à l'envoi
    try {
      switch (dto.type) {
        case NotificationType.EMAIL:
          await this.dispatchEmail(notificationId, dto);
          break;
        case NotificationType.SMS:
          await this.dispatchSms(notificationId, dto);
          break;
        case NotificationType.PUSH:
          await this.dispatchPush(notificationId, dto);
          break;
        case NotificationType.PLATEFORME:
          await this.repo.updateStatut(notificationId, StatutNotification.ENVOYE);
          break;
      }
    } catch (err) {
      this.logger.error(`Erreur dispatch [${dto.type}] notif ${notificationId}`, err);
      await this.repo.updateStatut(notificationId, StatutNotification.ECHEC, {
        erreur: err.message,
      });
    }
  }

  private async dispatchEmail(id: string, dto: DispatchPayload): Promise<void> {
    const html = this.emailService.buildHtml(dto.titre, dto.contenu);
    const result = await this.emailService.send({
      to: dto.destinataire ?? `user-${dto.userId}@almizan.dz`,
      subject: dto.titre,
      html,
    });

    if (result.success) {
      await this.repo.updateStatut(id, StatutNotification.ENVOYE, { messageId: result.messageId });
    } else {
      await this.repo.updateStatut(id, StatutNotification.ECHEC, { erreur: result.error });
    }
  }

  private async dispatchSms(id: string, dto: DispatchPayload): Promise<void> {
    if (!dto.destinataire) {
      this.logger.warn(`SMS sans destinataire – notif ${id} ignorée`);
      await this.repo.updateStatut(id, StatutNotification.ECHEC);
      return;
    }

    const phone = this.smsService.normalizeAlgerianPhone(dto.destinataire);
    const result = await this.smsService.send({ to: phone, message: dto.contenu });

    if (result.success) {
      await this.repo.updateStatut(id, StatutNotification.ENVOYE, { messageId: result.messageId });
    } else {
      await this.repo.updateStatut(id, StatutNotification.ECHEC, { erreur: result.error });
    }
  }

  private async dispatchPush(id: string, dto: DispatchPayload): Promise<void> {
    // Récupérer les tokens FCM (cache Redis 15 min)
    let tokens = await this.redisService.getUserDeviceTokens(dto.userId);
    if (!tokens) {
      const devices = await this.deviceTokensRepo.findActiveByUserId(dto.userId);
      tokens = devices.map((d) => d.token);
      if (tokens.length > 0) {
        await this.redisService.setUserDeviceTokens(dto.userId, tokens);
      }
    }

    if (!tokens || tokens.length === 0) {
      this.logger.debug(`Aucun token FCM pour userId=${dto.userId} – push ignoré`);
      await this.repo.updateStatut(id, StatutNotification.ECHEC);
      return;
    }

    const result = await this.pushService.send({
      tokens,
      title: dto.titre,
      body: dto.contenu,
      data: {
        notificationId: id,
        categorie: dto.categorie,
        entiteType: dto.entiteType ?? '',
        entiteId: dto.entiteId ?? '',
      },
    });

    // Nettoyer les tokens FCM invalides
    if (result.invalidTokens.length > 0) {
      await this.deviceTokensRepo.deactivateTokens(result.invalidTokens);
      await this.redisService.invalidateUserDeviceTokens(dto.userId);
    }

    if (result.successCount > 0) {
      await this.repo.updateStatut(id, StatutNotification.ENVOYE);
    } else {
      await this.repo.updateStatut(id, StatutNotification.ECHEC, {
        erreur: `Push échoué : ${result.failureCount} tokens en erreur`,
      });
    }
  }

  private async checkUserPreference(
    userId: string,
    type: string,
    categorie: string,
  ): Promise<boolean> {
    const pref = await this.preferencesRepo.findByUserId(userId);
    if (!pref) return true; // pas de préférences = tout activé

    const canalMap: Record<string, boolean> = {
      EMAIL: pref.emailActif,
      SMS: pref.smsActif,
      PUSH: pref.pushActif,
      PLATEFORME: pref.plateformeActif,
    };

    if (!canalMap[type]) return false;

    // optoutCategories est le vrai nom du champ Prisma
    const optout = (pref.optoutCategories as string[]) ?? [];
    if (optout.includes(categorie)) return false;

    return true;
  }

  async findAll(filter: FilterNotificationDto): Promise<PaginatedResult<any>> {
    const { data, total } = await this.repo.findAll(filter);
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const notif = await this.repo.findById(id);
    if (!notif) throw new NotFoundException(`Notification introuvable : ${id}`);
    return notif;
  }

  async findMyNotifications(userId: string, filter: FilterNotificationDto) {
    return this.findAll({ ...filter, userId });
  }

  async markAsRead(id: string, userId: string) {
    await this.findById(id);
    return this.repo.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const count = await this.repo.markAllAsRead(userId);
    return { count };
  }

  async countUnread(userId: string): Promise<{ count: number }> {
    const count = await this.repo.countUnread(userId);
    return { count };
  }
}
