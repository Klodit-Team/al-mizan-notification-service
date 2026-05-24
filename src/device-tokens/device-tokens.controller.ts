import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiParam } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DeviceTokensService } from './device-tokens.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { DeviceTokenEntity } from './entities/device-token.entity';

@ApiTags('device-tokens')
@ApiSecurity('x-user-id')
@ApiSecurity('x-user-roles')
@UseGuards(ThrottlerGuard, RolesGuard)
@Controller('device-tokens')
export class DeviceTokensController {
  constructor(private readonly service: DeviceTokensService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enregistrer un token FCM Android' })
  @ApiResponse({ status: 201, description: 'Token enregistré', type: DeviceTokenEntity })
  register(@CurrentUser() user: { id: string }, @Body() dto: RegisterDeviceTokenDto): Promise<DeviceTokenEntity> {
    return this.service.register(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister mes tokens FCM' })
  @ApiResponse({ status: 200, type: [DeviceTokenEntity] })
  findMine(@CurrentUser() user: { id: string }): Promise<DeviceTokenEntity[]> {
    return this.service.findByUserId(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Désactiver un token FCM' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: DeviceTokenEntity })
  deactivate(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }): Promise<DeviceTokenEntity> {
    return this.service.deactivate(id, user.id);
  }
}