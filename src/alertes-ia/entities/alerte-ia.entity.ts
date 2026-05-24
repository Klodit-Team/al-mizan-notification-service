import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NiveauUrgence, AlerteIAType, AlerteStatut } from '../../common/prisma-enums';

export class AlerteIAEntity {
  @ApiProperty() id: string;
  @ApiPropertyOptional() incidentId: string | null;
  @ApiProperty({ type: [String] }) utilisateursCibles: string[];
  @ApiProperty() titre: string;
  @ApiProperty() message: string;
  @ApiProperty({ enum: NiveauUrgence }) niveauUrgence: NiveauUrgence;
  @ApiProperty({ enum: AlerteIAType }) typeAlerte: AlerteIAType;
  @ApiPropertyOptional({ type: Object }) donneesContexte: any | null;
  @ApiProperty({ enum: AlerteStatut }) statut: AlerteStatut;
  @ApiProperty() dateCreation: Date;
  @ApiPropertyOptional() dateAcquittement: Date | null;
  @ApiPropertyOptional() acquitteePar: string | null;
}

export class PaginatedAlerteIAEntity {
  @ApiProperty({ type: [AlerteIAEntity] }) data: AlerteIAEntity[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}