import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PreferencesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<any> {
    return this.prisma['preferenceNotification'].findUnique({ where: { userId } });
  }

  async upsert(userId: string, data: any): Promise<any> {
    return this.prisma['preferenceNotification'].upsert({
      where:  { userId },
      update: data,
      create: {
        userId,
        emailActif:       data.emailActif       ?? true,
        smsActif:         data.smsActif         ?? true,
        pushActif:        data.pushActif         ?? true,
        plateformeActif:  data.plateformeActif   ?? true,
        // optoutCategories est le vrai nom du champ Prisma (pas categoriesDesactivees)
        optoutCategories: data.categoriesDesactivees ?? [],
      },
    });
  }
}