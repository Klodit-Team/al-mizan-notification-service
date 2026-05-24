import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PreferencesService } from './preferences.service';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { PreferenceEntity } from './entities/preference.entity';

@ApiTags('preferences')
@ApiSecurity('x-user-id')
@ApiSecurity('x-user-roles')
@UseGuards(ThrottlerGuard, RolesGuard)
@Controller('preferences')
export class PreferencesController {
  constructor(private readonly service: PreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer mes préférences de notification' })
  @ApiResponse({ status: 200, description: 'Préférences de notification', type: PreferenceEntity })
  findMine(@CurrentUser() user: { id: string }): Promise<PreferenceEntity> {
    return this.service.findOrCreateByUserId(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Mettre à jour mes préférences de notification' })
  @ApiResponse({ status: 200, description: 'Préférences mises à jour', type: PreferenceEntity })
  update(@CurrentUser() user: { id: string }, @Body() dto: UpdatePreferenceDto): Promise<PreferenceEntity> {
    return this.service.update(user.id, dto);
  }
}