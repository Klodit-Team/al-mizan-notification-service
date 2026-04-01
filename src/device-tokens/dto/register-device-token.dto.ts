import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class RegisterDeviceTokenDto {
  @ApiProperty({ description: 'Token FCM Android', example: 'fME8YFq...FCM_TOKEN' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  token: string;

  @ApiPropertyOptional({
    description: 'Identifiant unique du device',
    example: 'android-uuid-abc123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceId?: string;
}
