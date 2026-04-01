import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiParam } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RapportsIAService } from './rapports-ia.service';
import { CreateRapportIADto, FilterRapportIADto } from './dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('rapports-ia')
@ApiSecurity('x-user-id')
@ApiSecurity('x-user-roles')
@UseGuards(ThrottlerGuard, RolesGuard)
@Controller('rapports-ia')
export class RapportsIAController {
  constructor(private readonly service: RapportsIAService) {}

  @Post()
  @Roles('ADMIN', 'SYSTEME')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer et envoyer un rapport IA périodique [ADMIN, SYSTEME]' })
  @ApiResponse({ status: 201, description: 'Rapport IA créé et envoyé aux destinataires' })
  create(@Body() dto: CreateRapportIADto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles('ADMIN', 'CONTROLEUR')
  @ApiOperation({ summary: 'Lister les rapports IA [ADMIN, CONTROLEUR]' })
  @ApiResponse({ status: 200, description: 'Liste paginée des rapports IA' })
  findAll(@Query() filter: FilterRapportIADto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @Roles('ADMIN', 'CONTROLEUR')
  @ApiOperation({ summary: "Détail d'un rapport IA" })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Rapport trouvé' })
  @ApiResponse({ status: 404, description: 'Rapport introuvable' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }
}
