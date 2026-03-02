import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/users.service.js';
import { Role } from '../../common/enums/role.enum.js';

@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const email = this.configService.get<string>('admin.email')!;
    const password = this.configService.get<string>('admin.password')!;

    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      return;
    }

    const saltRounds = this.configService.get<number>('bcrypt.saltRounds', 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);
    await this.usersService.create({
      email,
      passwordHash,
      role: Role.ADMIN,
    });

    this.logger.log(`Admin user seeded: ${email}`);
  }
}
