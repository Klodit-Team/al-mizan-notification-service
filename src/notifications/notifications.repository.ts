import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatutNotification } from '../common/prisma-enums';
import { FilterNotificationDto } from './dto';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<any> {
    return this.prisma['notification'].create({ data });
  }

  async findById(id: string): Promise<any> {
    return this.prisma['notification'].findUnique({ where: { id } });
  }

  async findAll(filter: FilterNotificationDto): Promise<{ data: any[]; total: number }> {
    const { page = 1, limit = 20, userId, type, categorie, statut, isLue } = filter;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(userId    && { userId }),
      ...(type      && { type }),
      ...(categorie && { categorie }),
      ...(statut    && { statut }),
      ...(isLue !== undefined && { isLue }),
    };

    const [data, total] = await Promise.all([
      this.prisma['notification'].findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma['notification'].count({ where }),
    ]);

    return { data, total };
  }

  async markAsRead(id: string, _userId: string): Promise<any> {
    return this.prisma['notification'].update({
      where: { id },
      data: { isLue: true, dateLecture: new Date() },
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma['notification'].updateMany({
      where: { userId, isLue: false },
      data:  { isLue: true, dateLecture: new Date() },
    });
    return result.count;
  }

  async updateStatut(
    id: string,
    statut: StatutNotification,
    extra?: { messageId?: string; erreur?: string; tentatives?: number },
  ): Promise<any> {
    return this.prisma['notification'].update({
      where: { id },
      data: {
        statut,
        // dateEnvoi uniquement quand la notification est effectivement envoyée
        ...(statut === StatutNotification.ENVOYE && { dateEnvoi: new Date() }),
        ...(extra?.messageId  && { messageId:    extra.messageId }),
        // erreurDetails est le vrai nom du champ Prisma (pas dernierErreur)
        ...(extra?.erreur     && { erreurDetails: extra.erreur   }),
        ...(extra?.tentatives !== undefined && { tentatives: extra.tentatives }),
      },
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma['notification'].count({ where: { userId, isLue: false } });
  }

  async incrementTentatives(id: string): Promise<any> {
    return this.prisma['notification'].update({
      where: { id },
      data:  { tentatives: { increment: 1 } },
    });
  }
}