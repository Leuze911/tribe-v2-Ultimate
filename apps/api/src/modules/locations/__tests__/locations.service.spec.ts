import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { LocationsService } from '../locations.service';
import { Location, LocationStatus, LocationCategory } from '../entities/location.entity';
import { Profile } from '../../users/entities/profile.entity';
import { ValidationAction, CreateLocationDto } from '../dto';

describe('LocationsService', () => {
  let service: LocationsService;
  let locationRepository: jest.Mocked<Repository<Location>>;
  let profileRepository: jest.Mocked<Repository<Profile>>;

  const mockLocation: Partial<Location> = {
    id: 'location-uuid-123',
    name: 'Restaurant Test',
    category: LocationCategory.RESTAURANT,
    description: 'A great restaurant for testing',
    latitude: 14.6937,
    longitude: -17.4441,
    accuracy: 10,
    address: '123 Test Street',
    city: 'Dakar',
    photos: ['photo1.jpg', 'photo2.jpg'],
    metadata: {},
    status: LocationStatus.PENDING,
    collectorId: 'user-uuid-123',
    collector: { id: 'user-uuid-123', fullName: 'Test Collector' } as Profile,
    validatedBy: null,
    validatedAt: null,
    rejectionReason: null,
    pointsAwarded: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    store: {
      keys: jest.fn().mockResolvedValue([]),
    },
  };

  const mockLocationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    increment: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockProfileRepository = {
    increment: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-value'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        {
          provide: getRepositoryToken(Location),
          useValue: mockLocationRepository,
        },
        {
          provide: getRepositoryToken(Profile),
          useValue: mockProfileRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
    locationRepository = module.get(getRepositoryToken(Location));
    profileRepository = module.get(getRepositoryToken(Profile));
  });

  describe('create', () => {
    const createDto: CreateLocationDto = {
      name: 'New Restaurant',
      category: LocationCategory.RESTAURANT,
      latitude: 14.6937,
      longitude: -17.4441,
      description: 'Test description',
    };

    it('should create location with valid data', async () => {
      mockLocationRepository.create.mockReturnValue(mockLocation);
      mockLocationRepository.save.mockResolvedValue(mockLocation);
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.create('user-uuid-123', createDto);

      expect(mockLocationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collectorId: 'user-uuid-123',
          name: 'New Restaurant',
          category: 'restaurant',
          status: LocationStatus.PENDING,
        }),
      );
      expect(result).toHaveProperty('id');
    });

    it('should set default status to "pending"', async () => {
      mockLocationRepository.create.mockReturnValue(mockLocation);
      mockLocationRepository.save.mockResolvedValue(mockLocation);
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.create('user-uuid-123', createDto);

      expect(mockLocationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: LocationStatus.PENDING,
        }),
      );
    });

    it('should associate location with creator user', async () => {
      mockLocationRepository.create.mockReturnValue(mockLocation);
      mockLocationRepository.save.mockResolvedValue(mockLocation);
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockCacheManager.get.mockResolvedValue(null);

      await service.create('user-uuid-123', createDto);

      expect(mockLocationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collectorId: 'user-uuid-123',
        }),
      );
    });

    it('should invalidate list cache after creation', async () => {
      mockLocationRepository.create.mockReturnValue(mockLocation);
      mockLocationRepository.save.mockResolvedValue(mockLocation);
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockCacheManager.get.mockResolvedValue(null);

      await service.create('user-uuid-123', createDto);

      expect(mockCacheManager.store.keys).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const mockData = [mockLocation, { ...mockLocation, id: 'location-2' }];
      mockLocationRepository.findAndCount.mockResolvedValue([mockData, 2]);
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by status', async () => {
      mockLocationRepository.findAndCount.mockResolvedValue([[mockLocation], 1]);
      mockCacheManager.get.mockResolvedValue(null);

      await service.findAll({ status: LocationStatus.PENDING });

      expect(mockLocationRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: LocationStatus.PENDING,
          }),
        }),
      );
    });

    it('should filter by category', async () => {
      mockLocationRepository.findAndCount.mockResolvedValue([[mockLocation], 1]);
      mockCacheManager.get.mockResolvedValue(null);

      await service.findAll({ category: LocationCategory.RESTAURANT });

      expect(mockLocationRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: LocationCategory.RESTAURANT,
          }),
        }),
      );
    });

    it('should use cache if available', async () => {
      const cachedResult = {
        data: [mockLocation],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockCacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(cachedResult);
      expect(mockLocationRepository.findAndCount).not.toHaveBeenCalled();
    });

    it('should sort by createdAt desc by default', async () => {
      mockLocationRepository.findAndCount.mockResolvedValue([[mockLocation], 1]);
      mockCacheManager.get.mockResolvedValue(null);

      await service.findAll({});

      expect(mockLocationRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'DESC' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return location by id', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.findOne('location-uuid-123');

      expect(result).toEqual(mockLocation);
    });

    it('should include collector user info', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockCacheManager.get.mockResolvedValue(null);

      await service.findOne('location-uuid-123');

      expect(mockLocationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'location-uuid-123' },
        relations: ['collector'],
      });
    });

    it('should throw NotFoundException for non-existent id', async () => {
      mockLocationRepository.findOne.mockResolvedValue(null);
      mockCacheManager.get.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use cache if available', async () => {
      mockCacheManager.get.mockResolvedValue(mockLocation);

      const result = await service.findOne('location-uuid-123');

      expect(result).toEqual(mockLocation);
      expect(mockLocationRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Restaurant Name',
      description: 'Updated description',
    };

    it('should update location fields', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockCacheManager.get.mockResolvedValue(null);
      mockLocationRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.update('location-uuid-123', 'user-uuid-123', updateDto);

      expect(mockLocationRepository.update).toHaveBeenCalledWith(
        'location-uuid-123',
        expect.objectContaining({
          name: 'Updated Restaurant Name',
          description: 'Updated description',
        }),
      );
    });

    it('should only allow owner to update', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockCacheManager.get.mockResolvedValue(null);

      await expect(
        service.update('location-uuid-123', 'different-user', updateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not allow update of validated location', async () => {
      mockLocationRepository.findOne.mockResolvedValue({
        ...mockLocation,
        status: LocationStatus.VALIDATED,
      });
      mockCacheManager.get.mockResolvedValue(null);

      await expect(
        service.update('location-uuid-123', 'user-uuid-123', updateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should invalidate cache after update', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockCacheManager.get.mockResolvedValue(null);
      mockLocationRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.update('location-uuid-123', 'user-uuid-123', updateDto);

      expect(mockCacheManager.del).toHaveBeenCalled();
    });
  });

  describe('validate', () => {
    it('should set status to validated', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockCacheManager.get.mockResolvedValue(null);
      mockLocationRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.validate('location-uuid-123', 'validator-id', {
        action: ValidationAction.VALIDATE,
        pointsToAward: 15,
      });

      expect(mockLocationRepository.update).toHaveBeenCalledWith(
        'location-uuid-123',
        expect.objectContaining({
          status: LocationStatus.VALIDATED,
          validatedBy: 'validator-id',
          pointsAwarded: 15,
        }),
      );
    });

    it('should add points to collector', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockCacheManager.get.mockResolvedValue(null);
      mockLocationRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.validate('location-uuid-123', 'validator-id', {
        action: ValidationAction.VALIDATE,
        pointsToAward: 15,
      });

      expect(mockProfileRepository.increment).toHaveBeenCalledWith(
        { id: 'user-uuid-123' },
        'points',
        15,
      );
    });

    it('should throw BadRequestException if already processed', async () => {
      mockLocationRepository.findOne.mockResolvedValue({
        ...mockLocation,
        status: LocationStatus.VALIDATED,
      });
      mockCacheManager.get.mockResolvedValue(null);

      await expect(
        service.validate('location-uuid-123', 'validator-id', {
          action: ValidationAction.VALIDATE,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate default points if not specified', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockCacheManager.get.mockResolvedValue(null);
      mockLocationRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.validate('location-uuid-123', 'validator-id', {
        action: ValidationAction.VALIDATE,
      });

      // Base 10 + 4 for 2 photos + 0 (description < 50 chars) + 3 for address = 17
      expect(mockLocationRepository.update).toHaveBeenCalledWith(
        'location-uuid-123',
        expect.objectContaining({
          pointsAwarded: 17,
        }),
      );
    });
  });

  describe('reject', () => {
    it('should set status to rejected', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockCacheManager.get.mockResolvedValue(null);
      mockLocationRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.validate('location-uuid-123', 'validator-id', {
        action: ValidationAction.REJECT,
        reason: 'Invalid location data',
      });

      expect(mockLocationRepository.update).toHaveBeenCalledWith(
        'location-uuid-123',
        expect.objectContaining({
          status: LocationStatus.REJECTED,
          rejectionReason: 'Invalid location data',
        }),
      );
    });

    it('should require rejection reason', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockCacheManager.get.mockResolvedValue(null);

      await expect(
        service.validate('location-uuid-123', 'validator-id', {
          action: ValidationAction.REJECT,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not add points when rejecting', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockCacheManager.get.mockResolvedValue(null);
      mockLocationRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.validate('location-uuid-123', 'validator-id', {
        action: ValidationAction.REJECT,
        reason: 'Invalid data',
      });

      expect(mockProfileRepository.increment).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete pending location', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockCacheManager.get.mockResolvedValue(null);

      await service.remove('location-uuid-123', 'user-uuid-123');

      expect(mockLocationRepository.delete).toHaveBeenCalledWith('location-uuid-123');
    });

    it('should only allow owner to delete', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockCacheManager.get.mockResolvedValue(null);

      await expect(
        service.remove('location-uuid-123', 'different-user'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not allow delete of validated location', async () => {
      mockLocationRepository.findOne.mockResolvedValue({
        ...mockLocation,
        status: LocationStatus.VALIDATED,
      });
      mockCacheManager.get.mockResolvedValue(null);

      await expect(
        service.remove('location-uuid-123', 'user-uuid-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
