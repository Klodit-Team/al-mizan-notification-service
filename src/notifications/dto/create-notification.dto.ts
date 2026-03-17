import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NotificationType, NotificationCategory } from '../../common/prisma-enums';

export class CreateNotificationDto {
  @ApiProperty({ description: "ID de l'utilisateur destinataire (UUID)", example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Titre de la notification', maxLength: 255, example: 'Attribution provisoire prononcée' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  titre: string;

  @ApiProperty({ description: 'Contenu de la notification', minLength: 5, example: 'Votre offre a été retenue...' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  contenu: string;

  @ApiProperty({ enum: NotificationType, description: 'Canal de diffusion', example: NotificationType.EMAIL })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ enum: NotificationCategory, description: 'Catégorie métier', example: NotificationCategory.ATTRIBUTION })
  @IsEnum(NotificationCategory)
  categorie: NotificationCategory;

  @ApiPropertyOptional({ description: 'Destinataire explicite (email, tél, token FCM)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  destinataire?: string;

  @ApiPropertyOptional({ description: 'Type entité liée (ex: APPEL_OFFRE, SOUMISSION)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entiteType?: string;

  @ApiPropertyOptional({ description: 'ID entité liée (UUID)' })
  @IsOptional()
  @IsUUID()
  entiteId?: string;

  @ApiPropertyOptional({ description: 'Payload brut pour retry (objet JSON)' })
  @IsOptional()
  payload?: Record<string, any>;
}
