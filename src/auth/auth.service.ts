import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import {
  BusinessException,
  ErrorCode,
} from '../common/exceptions/business.exception.js';

interface TokenPayload {
  sub: string;
  role: string;
  type: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshExpiresIn: number;
  private readonly saltRounds: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const raw = this.configService.get<string>('jwt.refreshExpiresIn', '7d');
    this.refreshExpiresIn = this.parseToSeconds(raw);
    this.saltRounds = this.configService.get<number>('bcrypt.saltRounds', 10);
  }

  private parseToSeconds(value: string): number {
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) return 604800;
    const num = parseInt(match[1], 10);
    const units: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    return num * (units[match[2]] ?? 86400);
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
    });

    this.logger.log(`User registered: ${user.id}`);
    return this.buildTokenResponse(user.id, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new BusinessException(ErrorCode.ACCOUNT_DISABLED);
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
    }

    this.logger.log(`User logged in: ${user.id}`);
    return this.buildTokenResponse(user.id, user.role);
  }

  async refresh(dto: RefreshDto) {
    try {
      const payload = this.jwtService.verify<TokenPayload>(dto.refreshToken);

      if (payload.type !== 'refresh') {
        throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
      }

      this.logger.log(`Token refreshed for user: ${user.id}`);
      return this.buildTokenResponse(user.id, user.role);
    } catch (error) {
      if (error instanceof BusinessException) throw error;
      throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
    }
  }

  private buildTokenResponse(userId: string, role: string) {
    const accessPayload = { sub: userId, role, type: 'access' };
    const refreshPayload = { sub: userId, role, type: 'refresh' };

    return {
      accessToken: this.jwtService.sign(accessPayload),
      refreshToken: this.jwtService.sign(refreshPayload, {
        expiresIn: this.refreshExpiresIn,
      }),
    };
  }
}
