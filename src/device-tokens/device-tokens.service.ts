import { Injectable, NotFoundException } from '@nestjs/common';
import { DeviceTokensRepository } from './device-tokens.repository';
import { RedisService } from '../redis/redis.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@Injectable()
export class DeviceTokensService {
  constructor(
    private readonly repo: DeviceTokensRepository,
    private readonly redisService: RedisService,
  ) {}

  async register(userId: string, dto: RegisterDeviceTokenDto) {
    const token = await this.repo.upsert(userId, dto.token, dto.deviceId);
    await this.redisService.invalidateUserDeviceTokens(userId);
    return token;
  }

  async findByUserId(userId: string) {
    return this.repo.findByUserId(userId);
  }

  async deactivate(id: string, userId: string) {
    const tokens = await this.repo.findByUserId(userId);
    const token = tokens.find((t) => t.id === id);
    if (!token) throw new NotFoundException(`Token introuvable : ${id}`);
    const result = await this.repo.deactivate(id);
    await this.redisService.invalidateUserDeviceTokens(userId);
    return result;
  }
}
