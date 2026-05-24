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
import { ApiTags, ApiOperation, ApiSecurity, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AlertesIAService } from './alertes-ia.service';
import { CreateAlerteIADto, FilterAlerteIADto, AcquitterAlerteDto } from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AlerteIAEntity, PaginatedAlerteIAEntity } from './entities/alerte-ia.entity';

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
  @ApiResponse({ status: 201, type: AlerteIAEntity })
  create(@Body() dto: CreateAlerteIADto): Promise<AlerteIAEntity> {
    return this.service.create(dto);
  }

  @Get()
  @Roles('ADMIN', 'CONTROLEUR')
  @ApiOperation({ summary: 'Lister les alertes IA [ADMIN, CONTROLEUR]' })
  @ApiResponse({ status: 200, type: PaginatedAlerteIAEntity })
  findAll(@Query() filter: FilterAlerteIADto): Promise<PaginatedAlerteIAEntity> {
    return this.service.findAll(filter) as unknown as Promise<PaginatedAlerteIAEntity>;
  }

  @Get(':id')
  @Roles('ADMIN', 'CONTROLEUR')
  @ApiOperation({ summary: "Détail d'une alerte IA" })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: AlerteIAEntity })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AlerteIAEntity> {
    return this.service.findById(id);
  }

  @Patch(':id/acquitter')
  @Roles('ADMIN', 'CONTROLEUR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acquitter une alerte IA [ADMIN, CONTROLEUR]' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: AlerteIAEntity })
  acquitter(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: AcquitterAlerteDto,
  ): Promise<AlerteIAEntity> {
    return this.service.acquitter(id, user.id, dto);
  }

  @Patch(':id/resoudre')
  @Roles('ADMIN', 'CONTROLEUR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Résoudre une alerte IA [ADMIN, CONTROLEUR]' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: AlerteIAEntity })
  resoudre(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: AcquitterAlerteDto,
  ): Promise<AlerteIAEntity> {
    return this.service.resoudre(id, user.id, dto);
  }
}