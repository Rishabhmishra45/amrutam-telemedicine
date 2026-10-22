
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.doctorProfile.findMany({
      where: {
        isAvailable: true,
      },
      select: {
        id: true,
        specialization: true,
        qualification: true,
        consultationFee: true,
        isAvailable: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
