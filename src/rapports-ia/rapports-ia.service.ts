import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RapportsIARepository } from './rapports-ia.repository';
import { EmailChannelService } from '../channels/email/email-channel.service';
import { NotificationProducer } from '../rabbitmq/producers/notification.producer';
import { CreateRapportIADto, FilterRapportIADto } from './dto';

@Injectable()
export class RapportsIAService {
  private readonly logger = new Logger(RapportsIAService.name);

  constructor(
    private readonly repo: RapportsIARepository,
    private readonly emailService: EmailChannelService,
    private readonly producer: NotificationProducer,
  ) {}

  async create(dto: CreateRapportIADto) {
    const rapport = await this.repo.create({
      typeRapport: dto.typeRapport,
      periodeDebut: new Date(dto.periodeDebut),
      periodeFin: new Date(dto.periodeFin),
      destinataires: dto.destinataires,
      statistiques: dto.statistiques,
      divergencesCount: dto.divergencesCount,
      erreursCount: dto.erreursCount,
      tauxPrecision: dto.tauxPrecision,
      fichierRapportUrl: dto.fichierRapportUrl ?? null,
    });

    // Envoi email asynchrone aux destinataires
    this.sendRapportToDestinataires(rapport.id, dto).catch((err) =>
      this.logger.error(`Erreur envoi rapport IA ${rapport.id}`, err),
    );

    return rapport;
  }

  private async sendRapportToDestinataires(
    rapportId: string,
    dto: CreateRapportIADto,
  ): Promise<void> {
    const rapport = await this.repo.findById(rapportId);
    if (!rapport) return;

    const titre = `Rapport IA Al-Mizan – ${dto.typeRapport} (${new Date(dto.periodeDebut).toLocaleDateString('fr-DZ')} → ${new Date(dto.periodeFin).toLocaleDateString('fr-DZ')})`;

    const statsHtml = Object.entries(dto.statistiques)
      .map(
        ([k, v]) =>
          `<tr><td style="padding:4px 12px;color:#475569;">${k}</td><td style="padding:4px 12px;font-weight:600;">${v}</td></tr>`,
      )
      .join('');

    const html = this.emailService.buildHtml(
      titre,
      `
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr style="background:#f1f5f9;">
          <th style="padding:8px 12px;text-align:left;">Indicateur</th>
          <th style="padding:8px 12px;text-align:left;">Valeur</th>
        </tr>
        ${statsHtml}
        <tr>
          <td style="padding:4px 12px;color:#475569;">Divergences</td>
          <td style="padding:4px 12px;font-weight:600;">${dto.divergencesCount}</td>
        </tr>
        <tr>
          <td style="padding:4px 12px;color:#475569;">Erreurs IA</td>
          <td style="padding:4px 12px;font-weight:600;">${dto.erreursCount}</td>
        </tr>
        <tr>
          <td style="padding:4px 12px;color:#475569;">Taux de précision</td>
          <td style="padding:4px 12px;font-weight:600;">${dto.tauxPrecision}%</td>
        </tr>
      </table>
      ${dto.fichierRapportUrl ? `<p><a href="${dto.fichierRapportUrl}">Télécharger le rapport PDF</a></p>` : ''}
      `,
      dto.fichierRapportUrl,
      'Télécharger le rapport PDF',
    );

    let allSuccess = true;
    for (const dest of dto.destinataires) {
      const result = await this.emailService.send({ to: dest, subject: titre, html });
      if (!result.success) {
        allSuccess = false;
        this.logger.warn(`Rapport IA non envoyé à ${dest}`);
      }
    }

    if (allSuccess) {
      await this.repo.markAsSent(rapportId);
      await this.producer.publishRapportIAEnvoye({
        rapportId,
        typeRapport: dto.typeRapport,
        destinataires: dto.destinataires,
      });
      this.logger.log(
        `Rapport IA ${rapportId} envoyé à ${dto.destinataires.length} destinataire(s)`,
      );
    } else {
      await this.repo.markAsFailed(rapportId);
    }
  }

  async findAll(filter: FilterRapportIADto) {
    const { data, total } = await this.repo.findAll(filter);
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const rapport = await this.repo.findById(id);
    if (!rapport) throw new NotFoundException(`Rapport IA introuvable : ${id}`);
    return rapport;
  }
}
