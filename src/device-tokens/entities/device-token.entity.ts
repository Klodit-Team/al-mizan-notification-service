import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeviceTokenEntity {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() token: string;
  @ApiPropertyOptional() deviceId: string | null;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}