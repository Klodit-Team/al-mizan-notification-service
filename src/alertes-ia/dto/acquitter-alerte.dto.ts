import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AcquitterAlerteDto {
  @ApiPropertyOptional({ description: 'Notes de résolution' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notesResolution?: string;
}
