import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatutRapport } from '../common/prisma-enums';
import { FilterRapportIADto } from './dto';

@Injectable()
export class RapportsIARepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<any> {
    return this.prisma['rapportIA'].create({ data });
  }

  async findById(id: string): Promise<any> {
    return this.prisma['rapportIA'].findUnique({ where: { id } });
  }

  async findAll(filter: FilterRapportIADto): Promise<{ data: any[]; total: number }> {
    const { page = 1, limit = 20, typeRapport, statut } = filter;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(typeRapport && { typeRapport }),
      ...(statut && { statut }),
    };

    const [data, total] = await Promise.all([
      this.prisma['rapportIA'].findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma['rapportIA'].count({ where }),
    ]);

    return { data, total };
  }

  async markAsSent(id: string): Promise<any> {
    return this.prisma['rapportIA'].update({
      where: { id },
      data: { statut: StatutRapport.ENVOYE, sentAt: new Date() },
    });
  }

  async markAsFailed(id: string): Promise<any> {
    // StatutRapport n'a pas de valeur ECHOUE (seulement GENERE et ENVOYE).
    // On garde GENERE pour indiquer que le rapport n'a pas été envoyé.
    return this.prisma['rapportIA'].update({
      where: { id },
      data: { statut: StatutRapport.GENERE },
    });
  }
}
