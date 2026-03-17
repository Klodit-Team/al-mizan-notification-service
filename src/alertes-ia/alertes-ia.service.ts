import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AlertesIARepository } from './alertes-ia.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationProducer } from '../rabbitmq/producers/notification.producer';
import { CreateAlerteIADto, FilterAlerteIADto, AcquitterAlerteDto } from './dto';
import { AlerteStatut, NotificationType, NotificationCategory } from '../common/prisma-enums';

@Injectable()
export class AlertesIAService {
  private readonly logger = new Logger(AlertesIAService.name);

  constructor(
    private readonly repo: AlertesIARepository,
    private readonly notificationsService: NotificationsService,
    private readonly notificationProducer: NotificationProducer,
  ) {}

  async create(dto: CreateAlerteIADto) {
    const alerte = await this.repo.create({
      incidentId: dto.incidentId ?? null,
      titre: dto.titre,
      message: dto.message,
      typeAlerte: dto.typeAlerte,
      niveauUrgence: dto.niveauUrgence,
      statut: AlerteStatut.EMISE,
      utilisateursCibles: dto.utilisateursCibles,
      donneesContexte: dto.donneesContexte ?? undefined,
      entiteType: dto.entiteType ?? null,
      entiteId: dto.entiteId ?? null,
    });

    // Notifier chaque utilisateur ciblé
    for (const userId of dto.utilisateursCibles) {
      await this.notificationsService.createAndDispatch({
        userId,
        titre: `Alerte IA [${dto.niveauUrgence}] : ${dto.titre}`,
        contenu: dto.message,
        type: NotificationType.EMAIL,
        categorie: NotificationCategory.IA_DIVERGENCE,
        entiteType: dto.entiteType,
        entiteId: dto.entiteId,
      });
      // Push aussi pour les alertes critiques
      if (dto.niveauUrgence === 'CRITICAL' || dto.niveauUrgence === 'ERROR') {
        await this.notificationsService.createAndDispatch({
          userId,
          titre: `${dto.titre}`,
          contenu: dto.message.substring(0, 200),
          type: NotificationType.PUSH,
          categorie: NotificationCategory.IA_DIVERGENCE,
          entiteType: dto.entiteType,
          entiteId: dto.entiteId,
        });
      }
    }

    // Publier sur RabbitMQ pour l'audit-service
    await this.notificationProducer.publishAlerteIAEmise({
      alerteId: alerte.id,
      typeAlerte: alerte.typeAlerte,
      niveauUrgence: alerte.niveauUrgence,
      entiteType: alerte.entiteType ?? undefined,
      entiteId: alerte.entiteId ?? undefined,
      utilisateursCibles: dto.utilisateursCibles,
    });

    this.logger.log(`Alerte IA créée : ${alerte.id} [${dto.typeAlerte}/${dto.niveauUrgence}]`);
    return alerte;
  }

  async findAll(filter: FilterAlerteIADto) {
    const { data, total } = await this.repo.findAll(filter);
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const alerte = await this.repo.findById(id);
    if (!alerte) throw new NotFoundException(`Alerte IA introuvable : ${id}`);
    return alerte;
  }

  async acquitter(id: string, acquittePar: string, dto: AcquitterAlerteDto) {
    await this.findById(id);
    return this.repo.updateStatut(id, AlerteStatut.ACQUITTEE, { acquittePar });
  }

  async resoudre(id: string, resolvedBy: string, dto: AcquitterAlerteDto) {
    await this.findById(id);
    return this.repo.updateStatut(id, AlerteStatut.RESOLUE, {
      resolvedBy,
      notesResolution: dto.notesResolution,
    });
  }
}
