import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty, IsOptional, IsArray, MaxLength, MinLength } from 'class-validator';
import { AlerteIAType, NiveauUrgence } from '../../common/prisma-enums';

export class CreateAlerteIADto {
  @ApiPropertyOptional({ description: 'ID de l\'incident source (depuis audit-service)' })
  @IsOptional()
  @IsString()
  incidentId?: string;

  @ApiProperty({ description: 'Titre de l\'alerte', example: 'Divergence IA détectée – Gré à gré' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  titre: string;

  @ApiProperty({ description: 'Message détaillé', minLength: 10 })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  message: string;

  @ApiProperty({ enum: AlerteIAType, description: 'Type d\'alerte IA' })
  @IsEnum(AlerteIAType)
  typeAlerte: AlerteIAType;

  @ApiProperty({ enum: NiveauUrgence, description: 'Niveau d\'urgence' })
  @IsEnum(NiveauUrgence)
  niveauUrgence: NiveauUrgence;

  @ApiProperty({ description: 'IDs des utilisateurs ciblés (admins/contrôleurs)', type: [String] })
  @IsArray()
  @IsString({ each: true })
  utilisateursCibles: string[];

  @ApiPropertyOptional({ description: 'Données contextuelles (JSON)' })
  @IsOptional()
  donneesContexte?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Type entité concernée' })
  @IsOptional()
  @IsString()
  entiteType?: string;

  @ApiPropertyOptional({ description: 'ID entité concernée' })
  @IsOptional()
  @IsString()
  entiteId?: string;
}
