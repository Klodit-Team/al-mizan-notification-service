import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeviceTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(userId: string, token: string, deviceId?: string): Promise<any> {
    // Le modèle Prisma s'appelle tokenFCM (pas deviceToken)
    // Le champ s'appelle isActive (pas isActif)
    return this.prisma['tokenFCM'].upsert({
      where:  { userId_token: { userId, token } },
      update: { isActive: true, updatedAt: new Date(), ...(deviceId && { deviceId }) },
      create: { userId, token, deviceId: deviceId ?? null, isActive: true },
    });
  }

  async findActiveByUserId(userId: string): Promise<any[]> {
    return this.prisma['tokenFCM'].findMany({ where: { userId, isActive: true } });
  }

  async findByUserId(userId: string): Promise<any[]> {
    return this.prisma['tokenFCM'].findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deactivate(id: string): Promise<any> {
    return this.prisma['tokenFCM'].update({ where: { id }, data: { isActive: false } });
  }

  async deactivateTokens(tokens: string[]): Promise<void> {
    await this.prisma['tokenFCM'].updateMany({
      where: { token: { in: tokens } },
      data:  { isActive: false },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma['tokenFCM'].deleteMany({ where: { userId } });
  }
}