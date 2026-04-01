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
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiParam } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, FilterNotificationDto } from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('notifications')
@ApiSecurity('x-user-id')
@ApiSecurity('x-user-roles')
@UseGuards(ThrottlerGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles('ADMIN', 'SYSTEME')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer et envoyer une notification [ADMIN, SYSTEME]' })
  @ApiResponse({ status: 201, description: 'Notification créée et envoyée' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async create(@Body() dto: CreateNotificationDto) {
    const notif = await this.notificationsService.create(dto);
    return notif;
  }

  @Get()
  @Roles('ADMIN', 'CONTROLEUR')
  @ApiOperation({ summary: 'Lister toutes les notifications (admin) [ADMIN, CONTROLEUR]' })
  @ApiResponse({ status: 200, description: 'Liste paginée des notifications' })
  async findAll(@Query() filter: FilterNotificationDto) {
    return this.notificationsService.findAll(filter);
  }

  @Get('mes-notifications')
  @ApiOperation({ summary: 'Mes notifications (utilisateur connecté)' })
  @ApiResponse({ status: 200, description: "Notifications de l'utilisateur courant" })
  async findMine(@CurrentUser() user: { id: string }, @Query() filter: FilterNotificationDto) {
    return this.notificationsService.findMyNotifications(user.id, filter);
  }

  @Get('non-lues/count')
  @ApiOperation({ summary: 'Compter les notifications non lues' })
  @ApiResponse({ status: 200, description: 'Nombre de notifications non lues' })
  async countUnread(@CurrentUser() user: { id: string }) {
    return this.notificationsService.countUnread(user.id);
  }

  @Patch('marquer-toutes-lues')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marquer toutes mes notifications comme lues' })
  @ApiResponse({ status: 200, description: 'Notifications marquées comme lues' })
  async markAllAsRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une notification par ID' })
  @ApiParam({ name: 'id', type: String, description: 'UUID de la notification' })
  @ApiResponse({ status: 200, description: 'Notification trouvée' })
  @ApiResponse({ status: 404, description: 'Notification introuvable' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.findById(id);
  }

  @Patch(':id/lire')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiParam({ name: 'id', type: String, description: 'UUID de la notification' })
  @ApiResponse({ status: 200, description: 'Notification marquée comme lue' })
  @ApiResponse({ status: 404, description: 'Notification introuvable' })
  async markAsRead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }) {
    return this.notificationsService.markAsRead(id, user.id);
  }
}
