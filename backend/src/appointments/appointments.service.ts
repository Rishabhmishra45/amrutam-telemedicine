
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(patientId: string, dto: CreateAppointmentDto) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    const now = new Date();

    if (
      Number.isNaN(startsAt.getTime()) ||
      Number.isNaN(endsAt.getTime()) ||
      startsAt <= now ||
      endsAt <= startsAt
    ) {
      throw new BadRequestException(
        'Appointment must have a valid future start and end time',
      );
    }

    const APPOINTMENT_DURATION_MS = 30 * 60 * 1000;

    if (endsAt.getTime() - startsAt.getTime() !== APPOINTMENT_DURATION_MS) {
      throw new BadRequestException(
        'Appointment duration must be exactly 30 minutes',
      );
    }


    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: dto.doctorId },
      select: { id: true, isAvailable: true },
    });

    if (!doctor || !doctor.isAvailable) {
      throw new NotFoundException('Available doctor not found');
    }

    const overlapping = await this.prisma.appointment.findFirst({
      where: {
        doctorId: dto.doctorId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });

    if (overlapping) {
      throw new BadRequestException(
        'Doctor already has an appointment during this time',
      );
    }

    return this.prisma.appointment.create({
      data: {
        patientId,
        doctorId: dto.doctorId,
        startsAt,
        endsAt,
        reason: dto.reason?.trim() || null,
      },
      select: {
        id: true,
        doctorId: true,
        startsAt: true,
        endsAt: true,
        status: true,
        reason: true,
        createdAt: true,
      },
    });
  }

  async findMine(patientId: string) {
    return this.prisma.appointment.findMany({
      where: { patientId },
      orderBy: { startsAt: 'asc' },
      select: {
        id: true,
        doctorId: true,
        startsAt: true,
        endsAt: true,
        status: true,
        reason: true,
      },
    });
  }

  async cancel(patientId: string, appointmentId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status !== 'PENDING') {
      throw new BadRequestException(
        'Only pending appointments can be cancelled',
      );
    }

    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'CANCELLED' },
      select: {
        id: true,
        doctorId: true,
        startsAt: true,
        endsAt: true,
        status: true,
        reason: true,
      },
    });
  }
}
