import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsArray,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TypeRapport } from '../../common/prisma-enums';

export class CreateRapportIADto {
  @ApiProperty({ enum: TypeRapport, example: TypeRapport.HEBDOMADAIRE })
  @IsEnum(TypeRapport)
  typeRapport: TypeRapport;

  @ApiProperty({
    description: 'Début de la période (ISO 8601)',
    example: '2026-03-01T00:00:00.000Z',
  })
  @IsDateString()
  periodeDebut: string;

  @ApiProperty({ description: 'Fin de la période (ISO 8601)', example: '2026-03-07T23:59:59.000Z' })
  @IsDateString()
  periodeFin: string;

  @ApiProperty({ description: 'IDs utilisateurs destinataires', type: [String] })
  @IsArray()
  @IsString({ each: true })
  destinataires: string[];

  @ApiProperty({ description: 'Statistiques IA (objet JSON libre)' })
  @IsNotEmpty()
  statistiques: Record<string, any>;

  @ApiProperty({ description: 'Nombre de divergences détectées', minimum: 0 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  divergencesCount: number;

  @ApiProperty({ description: "Nombre d'erreurs IA", minimum: 0 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  erreursCount: number;

  @ApiProperty({ description: 'Taux de précision IA (0-100)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  tauxPrecision: number;

  @ApiPropertyOptional({ description: 'URL du fichier rapport PDF (MinIO)' })
  @IsOptional()
  @IsString()
  fichierRapportUrl?: string;
}
