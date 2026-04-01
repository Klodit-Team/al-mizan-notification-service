import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class RegisterTokenDto {
  @ApiProperty({ description: "Token FCM de l'appareil Android", example: 'eP5Kv7...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  token: string;

  @ApiPropertyOptional({
    description: "Identifiant unique de l'appareil",
    example: 'android_device_01',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceId?: string;
}
