
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AuthenticatedUser {
  sub: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authorization = request.headers.authorization;

    if (
      typeof authorization !== 'string' ||
      !authorization.startsWith('Bearer ')
    ) {
      throw new UnauthorizedException(
        'Access token is missing',
      );
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      throw new UnauthorizedException('Access token is missing');
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<AuthenticatedUser>(token);

      if (
        typeof payload.sub !== 'string' ||
        typeof payload.email !== 'string' ||
        !['PATIENT', 'DOCTOR', 'ADMIN'].includes(payload.role)
      ) {
        throw new UnauthorizedException('Invalid access token');
      }

      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
