
export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Doctor {
  id: string;
  specialization: string;
  qualification: string;
  consultationFee: string | number;
  isAvailable: boolean;
  user: {
    name: string;
  };
}

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface Appointment {
  id: string;
  doctorId: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  reason?: string | null;
  createdAt?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CreateAppointmentPayload {
  doctorId: string;
  startsAt: string;
  endsAt: string;
  reason?: string;
}
