import { Injectable } from '@nestjs/common';
import { PreferencesRepository } from './preferences.repository';
import { UpdatePreferenceDto } from './dto/update-preference.dto';

@Injectable()
export class PreferencesService {
  constructor(private readonly repo: PreferencesRepository) {}

  async findOrCreateByUserId(userId: string) {
    const existing = await this.repo.findByUserId(userId);
    if (existing) return existing;
    return this.repo.upsert(userId, {
      emailActif: true,
      smsActif: true,
      pushActif: true,
      plateformeActif: true,
      categoriesDesactivees: [],
    });
  }

  async update(userId: string, dto: UpdatePreferenceDto) {
    return this.repo.upsert(userId, {
      ...(dto.emailActif !== undefined && { emailActif: dto.emailActif }),
      ...(dto.smsActif !== undefined && { smsActif: dto.smsActif }),
      ...(dto.pushActif !== undefined && { pushActif: dto.pushActif }),
      ...(dto.plateformeActif !== undefined && { plateformeActif: dto.plateformeActif }),
      ...(dto.categoriesDesactivees !== undefined && {
        categoriesDesactivees: dto.categoriesDesactivees as string[],
      }),
    });
  }
}
