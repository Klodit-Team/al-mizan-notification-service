import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiParam } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AlertesIAService } from './alertes-ia.service';
import { CreateAlerteIADto, FilterAlerteIADto, AcquitterAlerteDto } from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('alertes-ia')
@ApiSecurity('x-user-id')
@ApiSecurity('x-user-roles')
@UseGuards(ThrottlerGuard, RolesGuard)
@Controller('alertes-ia')
export class AlertesIAController {
  constructor(private readonly service: AlertesIAService) {}

  @Post()
  @Roles('ADMIN', 'SYSTEME')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Émettre une alerte IA [ADMIN, SYSTEME]' })
  create(@Body() dto: CreateAlerteIADto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles('ADMIN', 'CONTROLEUR')
  @ApiOperation({ summary: 'Lister les alertes IA [ADMIN, CONTROLEUR]' })
  findAll(@Query() filter: FilterAlerteIADto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @Roles('ADMIN', 'CONTROLEUR')
  @ApiOperation({ summary: "Détail d'une alerte IA" })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Patch(':id/acquitter')
  @Roles('ADMIN', 'CONTROLEUR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acquitter une alerte IA [ADMIN, CONTROLEUR]' })
  @ApiParam({ name: 'id', type: String })
  acquitter(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: AcquitterAlerteDto,
  ) {
    return this.service.acquitter(id, user.id, dto);
  }

  @Patch(':id/resoudre')
  @Roles('ADMIN', 'CONTROLEUR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Résoudre une alerte IA [ADMIN, CONTROLEUR]' })
  @ApiParam({ name: 'id', type: String })
  resoudre(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: AcquitterAlerteDto,
  ) {
    return this.service.resoudre(id, user.id, dto);
  }
}
