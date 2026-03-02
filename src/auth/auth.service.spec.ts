import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { Role } from '../common/enums/role.enum.js';
import { BusinessException } from '../common/exceptions/business.exception.js';

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@test.com',
  passwordHash: '',
  role: Role.USER,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, 'findByEmail' | 'create'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'sign'>>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('signed.jwt.token'),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get(AuthService);
  });

  describe('register', () => {
    const dto = { email: 'new@test.com', password: 'securePass123' };

    it('should create user and return access token', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ ...mockUser, email: dto.email });

      const result = await authService.register(dto);

      expect(result).toEqual({ accessToken: 'signed.jwt.token' });
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: dto.email }),
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        role: Role.USER,
      });
    });

    it('should throw BusinessException when email exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.register(dto)).rejects.toThrow(
        BusinessException,
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should hash password before saving', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ ...mockUser, email: dto.email });

      await authService.register(dto);

      const savedHash = usersService.create.mock.calls[0][0].passwordHash!;
      const matches = await bcrypt.compare(dto.password, savedHash);
      expect(matches).toBe(true);
    });
  });

  describe('login', () => {
    const dto = { email: 'test@test.com', password: 'correctPassword' };

    beforeEach(async () => {
      const hash = await bcrypt.hash(dto.password, 10);
      mockUser.passwordHash = hash;
    });

    it('should return access token with valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      const result = await authService.login(dto);

      expect(result).toEqual({ accessToken: 'signed.jwt.token' });
    });

    it('should throw BusinessException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(authService.login(dto)).rejects.toThrow(BusinessException);
    });

    it('should throw BusinessException when password is wrong', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.login({ ...dto, password: 'wrongPassword' }),
      ).rejects.toThrow(BusinessException);
    });

    it('should throw BusinessException when user is deactivated', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(authService.login(dto)).rejects.toThrow(BusinessException);
    });
  });
});
