import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeRapport, RapportStatut } from '../../common/prisma-enums';

export class RapportIAEntity {
  @ApiProperty() id: string;
  @ApiProperty({ enum: TypeRapport }) typeRapport: TypeRapport;
  @ApiProperty() periodDebut: Date;
  @ApiProperty() periodeFin: Date;
  @ApiProperty({ type: [String] }) destinataires: string[];
  @ApiProperty({ type: Object }) statistiques: any;
  @ApiProperty() divergencesCount: number;
  @ApiProperty() erreursCount: number;
  @ApiProperty() tauxPrecision: number;
  @ApiPropertyOptional() fichierRapportUrl: string | null;
  @ApiProperty({ enum: RapportStatut }) statut: RapportStatut;
  @ApiProperty() createdAt: Date;
  @ApiPropertyOptional() sentAt: Date | null;
}

export class PaginatedRapportIAEntity {
  @ApiProperty({ type: [RapportIAEntity] }) data: RapportIAEntity[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}