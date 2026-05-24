import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, NotificationCategory, NotificationStatut } from '../../common/prisma-enums';

export class NotificationEntity {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() titre: string;
  @ApiProperty() contenu: string;
  @ApiProperty({ enum: NotificationType }) type: NotificationType;
  @ApiProperty({ enum: NotificationCategory }) categorie: NotificationCategory;
  @ApiProperty({ enum: NotificationStatut }) statut: NotificationStatut;
  @ApiProperty() isLue: boolean;
  @ApiPropertyOptional() dateEnvoi: Date | null;
  @ApiPropertyOptional() dateLecture: Date | null;
  @ApiPropertyOptional() destinataire: string | null;
  @ApiPropertyOptional() messageId: string | null;
  @ApiProperty() tentatives: number;
  @ApiPropertyOptional() erreurDetails: string | null;
  @ApiPropertyOptional() refEntiteId: string | null;
  @ApiPropertyOptional() refEntiteType: string | null;
  @ApiProperty() createdAt: Date;
}

export class PaginatedNotificationEntity {
  @ApiProperty({ type: [NotificationEntity] }) data: NotificationEntity[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}

export class CountResponseEntity {
  @ApiProperty() count: number;
}