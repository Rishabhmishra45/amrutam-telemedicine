
import type {
  Appointment,
  AuthResponse,
  CreateAppointmentPayload,
  Doctor,
  LoginPayload,
  RegisterPayload,
} from '../types';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
).replace(/\/$/, '');

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      'Backend se connection nahi ho pa raha. Backend server check karo.',
    );
  }

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const body = data as { message?: string | string[] } | null;
    const message = body?.message;

    if (Array.isArray(message)) {
      throw new Error(message.join(', '));
    }

    throw new Error(
      typeof message === 'string'
        ? message
        : `Request failed (${response.status})`,
    );
  }

  return data as T;
}

export const api = {
  register(payload: RegisterPayload) {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  login(payload: LoginPayload) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getDoctors() {
    return request<Doctor[]>('/doctors');
  },

  getMyAppointments(token: string) {
    return request<Appointment[]>('/appointments/my', {}, token);
  },

  createAppointment(
    payload: CreateAppointmentPayload,
    token: string,
  ) {
    return request<Appointment>(
      '/appointments',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token,
    );
  },

  cancelAppointment(appointmentId: string, token: string) {
    return request<Appointment>(
      `/appointments/${encodeURIComponent(appointmentId)}/cancel`,
      { method: 'POST' },
      token,
    );
  },
};
