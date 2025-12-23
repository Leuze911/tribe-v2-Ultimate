import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { Profile } from '../../users/entities/profile.entity';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let profileRepository: jest.Mocked<Repository<Profile>>;

  const mockProfile: Partial<Profile> = {
    id: 'test-uuid-123',
    email: 'test@tribe.sn',
    passwordHash: 'hashed_password',
    fullName: 'Test User',
    phone: '+221777777777',
    role: 'collector',
    points: 0,
    level: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProfileRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-jwt-secret-with-32-characters-minimum'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Profile),
          useValue: mockProfileRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    profileRepository = module.get(getRepositoryToken(Profile));
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@tribe.sn',
      password: 'password123',
      fullName: 'New User',
      phone: '+221777777777',
    };

    it('should create a new user with hashed password', async () => {
      mockProfileRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockProfileRepository.create.mockReturnValue(mockProfile);
      mockProfileRepository.save.mockResolvedValue(mockProfile);

      const result = await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockProfileRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'newuser@tribe.sn',
          passwordHash: 'hashed_password',
          fullName: 'New User',
          role: 'collector',
          points: 0,
          level: 1,
        }),
      );
      expect(result).toHaveProperty('accessToken');
      expect(result.tokenType).toBe('Bearer');
    });

    it('should throw ConflictException for duplicate email', async () => {
      mockProfileRepository.findOne.mockResolvedValue(mockProfile);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should return JWT token after registration', async () => {
      mockProfileRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockProfileRepository.create.mockReturnValue(mockProfile);
      mockProfileRepository.save.mockResolvedValue(mockProfile);

      const result = await service.register(registerDto);

      expect(result.accessToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
      expect(result.accessToken.split('.')).toHaveLength(3); // JWT format
    });

    it('should assign default role "collector"', async () => {
      mockProfileRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockProfileRepository.create.mockReturnValue(mockProfile);
      mockProfileRepository.save.mockResolvedValue(mockProfile);

      const result = await service.register(registerDto);

      expect(result.user.role).toBe('collector');
    });

    it('should initialize points to 0', async () => {
      mockProfileRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockProfileRepository.create.mockReturnValue(mockProfile);
      mockProfileRepository.save.mockResolvedValue(mockProfile);

      const result = await service.register(registerDto);

      expect(result.user.points).toBe(0);
    });

    it('should convert email to lowercase', async () => {
      mockProfileRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockProfileRepository.create.mockReturnValue(mockProfile);
      mockProfileRepository.save.mockResolvedValue(mockProfile);

      await service.register({ ...registerDto, email: 'TEST@TRIBE.SN' });

      expect(mockProfileRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@tribe.sn' },
      });
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@tribe.sn',
      password: 'password123',
    };

    it('should return JWT token for valid credentials', async () => {
      mockProfileRepository.findOne.mockResolvedValue(mockProfile);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result.accessToken).toBeDefined();
      expect(result.tokenType).toBe('Bearer');
      expect(result.user.email).toBe('test@tribe.sn');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      mockProfileRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockProfileRepository.findOne.mockResolvedValue(mockProfile);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      mockProfileRepository.findOne.mockResolvedValue({
        ...mockProfile,
        isActive: false,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should convert email to lowercase for comparison', async () => {
      mockProfileRepository.findOne.mockResolvedValue(mockProfile);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login({ ...loginDto, email: 'TEST@TRIBE.SN' });

      expect(mockProfileRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@tribe.sn' },
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile by id', async () => {
      mockProfileRepository.findOne.mockResolvedValue(mockProfile);

      const result = await service.getProfile('test-uuid-123');

      expect(result).toHaveProperty('id', 'test-uuid-123');
      expect(result).toHaveProperty('email', 'test@tribe.sn');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockProfileRepository.findOne.mockResolvedValue(null);

      await expect(service.getProfile('non-existent-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should exclude password from response', async () => {
      mockProfileRepository.findOne.mockResolvedValue(mockProfile);

      const result = await service.getProfile('test-uuid-123');

      expect(result).not.toHaveProperty('passwordHash');
    });
  });
});
