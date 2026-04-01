import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlerteStatut } from '../common/prisma-enums';
import { FilterAlerteIADto } from './dto';

@Injectable()
export class AlertesIARepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<any> {
    return this.prisma['alerteIA'].create({ data });
  }

  async findById(id: string): Promise<any> {
    return this.prisma['alerteIA'].findUnique({ where: { id } });
  }

  async findAll(filter: FilterAlerteIADto): Promise<{ data: any[]; total: number }> {
    const { page = 1, limit = 20, typeAlerte, niveauUrgence, statut } = filter;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(typeAlerte && { typeAlerte }),
      ...(niveauUrgence && { niveauUrgence }),
      ...(statut && { statut }),
    };

    const [data, total] = await Promise.all([
      this.prisma['alerteIA'].findMany({
        where,
        orderBy: { dateCreation: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma['alerteIA'].count({ where }),
    ]);

    return { data, total };
  }

  async updateStatut(
    id: string,
    statut: AlerteStatut,
    extra?: { acquittePar?: string; resolvedBy?: string; notesResolution?: string },
  ): Promise<any> {
    return this.prisma['alerteIA'].update({
      where: { id },
      data: {
        statut,
        ...(statut === AlerteStatut.ACQUITTEE && {
          dateAcquittement: new Date(),
          acquittePar: extra?.acquittePar,
        }),
        ...(statut === AlerteStatut.RESOLUE && {
          resolvedAt: new Date(),
          resolvedBy: extra?.resolvedBy,
          notesResolution: extra?.notesResolution,
        }),
      },
    });
  }
}
