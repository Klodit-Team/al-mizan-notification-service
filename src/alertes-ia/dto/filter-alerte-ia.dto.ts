import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { AlerteIAType, NiveauUrgence, AlerteStatut } from '../../common/prisma-enums';

export class FilterAlerteIADto {
  @ApiPropertyOptional({ enum: AlerteIAType })
  @IsOptional()
  @IsEnum(AlerteIAType)
  typeAlerte?: AlerteIAType;

  @ApiPropertyOptional({ enum: NiveauUrgence })
  @IsOptional()
  @IsEnum(NiveauUrgence)
  niveauUrgence?: NiveauUrgence;

  @ApiPropertyOptional({ enum: AlerteStatut })
  @IsOptional()
  @IsEnum(AlerteStatut)
  statut?: AlerteStatut;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
