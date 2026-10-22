
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AppointmentsService } from './appointments.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import {
  AuthenticatedUser,
  JwtAuthGuard,
} from '../auth/jwt-auth.guard.js';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
  ) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(
      request.user.sub,
      dto,
    );
  }

  @Get('my')
  findMine(@Req() request: AuthenticatedRequest) {
    return this.appointmentsService.findMine(
      request.user.sub,
    );
  }

  @Post(':id/cancel')
  cancel(
    @Req() request: AuthenticatedRequest,
    @Param('id') appointmentId: string,
  ) {
    return this.appointmentsService.cancel(
      request.user.sub,
      appointmentId,
    );
  }
}
