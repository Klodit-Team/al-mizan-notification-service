import { Injectable, OnModuleInit, Logger, forwardRef, Inject } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';
import { ROUTING_KEY, QUEUE_NOTIF_AO } from '../rabbitmq.constants';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationCategory } from '../../common/prisma-enums';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AoEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(AoEventsConsumer.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.rabbitMQService.assertQueue(QUEUE_NOTIF_AO, [
      ROUTING_KEY.AO_PUBLIE,
      ROUTING_KEY.AO_MODIFIE,
      ROUTING_KEY.AO_ANNULE,
      ROUTING_KEY.AO_CLOTURE,
      ROUTING_KEY.AO_ATTRIBUTION_PROVISOIRE,
      ROUTING_KEY.AO_ATTRIBUTION_DEFINITIVE,
      ROUTING_KEY.AO_CLARIFICATION_REPONDUE,
    ]);
    await this.rabbitMQService.consume(QUEUE_NOTIF_AO, this.handle.bind(this), 5);
  }

  private async handle(msg: any): Promise<void> {
    const rk = msg.fields.routingKey;
    const payload = JSON.parse(msg.content.toString());
    this.logger.log(`[ao-events] ${rk}`);

    switch (rk) {
      case ROUTING_KEY.AO_PUBLIE:
        await this.onAoPublie(payload);
        break;
      case ROUTING_KEY.AO_ANNULE:
        await this.onAoAnnule(payload);
        break;
      case ROUTING_KEY.AO_ATTRIBUTION_PROVISOIRE:
        await this.onAttributionProvisoire(payload);
        break;
      case ROUTING_KEY.AO_ATTRIBUTION_DEFINITIVE:
        await this.onAttributionDefinitive(payload);
        break;
      case ROUTING_KEY.AO_CLARIFICATION_REPONDUE:
        await this.onClarificationRepondue(payload);
        break;
    }
  }

  private async onAoPublie(p: any): Promise<void> {
    for (const userId of p.destinataires ?? []) {
      await this.notificationsService.createAndDispatch({
        userId,
        titre: `Nouvel appel d'offres : ${p.objet}`,
        contenu: `L'appel d'offres réf. ${p.appelOffreId} est disponible sur Al-Mizan.`,
        type: NotificationType.PLATEFORME,
        categorie: NotificationCategory.PUBLICATION,
        entiteType: 'APPEL_OFFRE',
        entiteId: p.appelOffreId,
      });
    }
  }

  private async onAoAnnule(p: any): Promise<void> {
    for (const userId of p.destinataires ?? []) {
      await this.notificationsService.createAndDispatch({
        userId,
        titre: `Annulation : ${p.objet}`,
        contenu: `L'appel d'offres réf. ${p.appelOffreId} a été annulé. Motif : ${p.motif}`,
        type: NotificationType.EMAIL,
        categorie: NotificationCategory.PUBLICATION,
        entiteType: 'APPEL_OFFRE',
        entiteId: p.appelOffreId,
      });
    }
  }

  private async onAttributionProvisoire(p: any): Promise<void> {
    for (const { userId, estRetenu } of p.soumissionnaires ?? []) {
      await this.notificationsService.createAndDispatch({
        userId,
        titre: estRetenu
          ? `Votre offre a été retenue (attribution provisoire) – ${p.objet}`
          : `Attribution provisoire – ${p.objet}`,
        contenu: `L'attribution provisoire du marché réf. ${p.appelOffreId} a été prononcée. Délai de recours : 10 jours.`,
        type: NotificationType.EMAIL,
        categorie: NotificationCategory.ATTRIBUTION,
        entiteType: 'APPEL_OFFRE',
        entiteId: p.appelOffreId,
      });
    }
  }

  private async onAttributionDefinitive(p: any): Promise<void> {
    for (const { userId, estRetenu } of p.soumissionnaires ?? []) {
      await this.notificationsService.createAndDispatch({
        userId,
        titre: estRetenu
          ? `Marché attribué définitivement : ${p.objet}`
          : `Résultats définitifs : ${p.objet}`,
        contenu: `L'attribution définitive du marché réf. ${p.appelOffreId} est prononcée.`,
        type: NotificationType.EMAIL,
        categorie: NotificationCategory.ATTRIBUTION,
        entiteType: 'APPEL_OFFRE',
        entiteId: p.appelOffreId,
      });
    }
  }

  private async onClarificationRepondue(p: any): Promise<void> {
    const { aoId, question, reponse } = p;
    this.logger.log(`[ao-events] Clarification répondue pour AO: ${aoId}`);

    // Récupérer la liste des ID opérateurs ayant effectué un retrait sur ce CDC (depuis ao_db)
    const retraits = await this.prisma.$queryRawUnsafe<any[]>(
      'SELECT operateur_id FROM ao_db.retrait_cdc rc JOIN ao_db.document_cdc dc ON rc.document_cdc_id = dc.id WHERE dc.ao_id = ?',
      aoId,
    );

    const operateurs = retraits.map((r) => r.operateur_id);
    this.logger.log(`Trouvé ${operateurs.length} opérateur(s) ayant retiré le CDC pour l'AO : ${aoId}`);

    for (const operateurId of operateurs) {
      await this.notificationsService.createAndDispatch({
        userId: operateurId,
        titre: `Nouvelle clarification sur le CDC (Appel d'Offres)`,
        contenu: `Une réponse officielle a été publiée pour une demande de clarification sur l'appel d'offres ${aoId}.\n\nQuestion : "${question}"\nRéponse : "${reponse}"`,
        type: NotificationType.EMAIL,
        categorie: NotificationCategory.PUBLICATION,
        entiteType: 'APPEL_OFFRE',
        entiteId: aoId,
      });
    }
  }
}
