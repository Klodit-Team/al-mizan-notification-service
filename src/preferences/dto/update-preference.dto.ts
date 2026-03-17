import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsArray, IsEnum } from 'class-validator';
import { NotificationCategory } from '../../common/prisma-enums';

export class UpdatePreferenceDto {
  @ApiPropertyOptional({ description: 'Activer/désactiver les emails' })
  @IsOptional()
  @IsBoolean()
  emailActif?: boolean;

  @ApiPropertyOptional({ description: 'Activer/désactiver les SMS' })
  @IsOptional()
  @IsBoolean()
  smsActif?: boolean;

  @ApiPropertyOptional({ description: 'Activer/désactiver les notifications push' })
  @IsOptional()
  @IsBoolean()
  pushActif?: boolean;

  @ApiPropertyOptional({ description: 'Activer/désactiver les notifications plateforme' })
  @IsOptional()
  @IsBoolean()
  plateformeActif?: boolean;

  @ApiPropertyOptional({
    description: 'Catégories de notifications désactivées',
    enum: NotificationCategory,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationCategory, { each: true })
  categoriesDesactivees?: NotificationCategory[];
}
