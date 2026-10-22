
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthController } from './health/health.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { DoctorsModule } from './doctors/doctors.module.js';
import { AppointmentsModule } from './appointments/appointments.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DoctorsModule,
    AppointmentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
