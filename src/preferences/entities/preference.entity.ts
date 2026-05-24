import { ApiProperty } from '@nestjs/swagger';

export class PreferenceEntity {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() emailActif: boolean;
  @ApiProperty() smsActif: boolean;
  @ApiProperty() pushActif: boolean;
  @ApiProperty() plateformeActif: boolean;
  @ApiProperty({ type: [String] }) optoutCategories: string[];
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}