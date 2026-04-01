import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { TypeRapportIA, StatutRapport } from '../../common/prisma-enums';

export class FilterRapportIADto {
  @ApiPropertyOptional({ enum: TypeRapportIA, description: 'Filtrer par type de rapport' })
  @IsOptional()
  @IsEnum(TypeRapportIA)
  typeRapport?: TypeRapportIA;

  @ApiPropertyOptional({
    enum: StatutRapport,
    description: 'Filtrer par statut (GENERE ou ENVOYE)',
  })
  @IsOptional()
  @IsEnum(StatutRapport)
  statut?: StatutRapport;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
