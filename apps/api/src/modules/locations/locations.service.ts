import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { Location, LocationStatus } from './entities/location.entity';
import { Profile } from '../users/entities/profile.entity';
import {
  CreateLocationDto,
  UpdateLocationDto,
  ValidateLocationDto,
  ValidationAction,
  QueryLocationDto,
} from './dto';
import { PaginatedResponse } from './interfaces';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);
  private readonly CACHE_TTL = 300000; // 5 minutes in ms
  private readonly CACHE_PREFIX = 'location:';

  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  async create(userId: string, dto: CreateLocationDto): Promise<Location> {
    this.logger.log(`Creating location for user ${userId}`);

    const location = this.locationRepository.create({
      collectorId: userId,
      name: dto.name,
      category: dto.category,
      description: dto.description || null,
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracy: dto.accuracy || null,
      address: dto.address || null,
      city: dto.city || 'Dakar',
      photos: dto.photos || [],
      metadata: dto.metadata || {},
      status: LocationStatus.PENDING,
    });

    const saved = await this.locationRepository.save(location);

    // Invalidate list caches
    await this.invalidateListCache();

    this.logger.log(`Location ${saved.id} created successfully`);
    return this.findOne(saved.id);
  }

  async findAll(query: QueryLocationDto): Promise<PaginatedResponse<Location>> {
    const { status, category, city, collectorId, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Try cache first
    const cacheKey = `${this.CACHE_PREFIX}list:${JSON.stringify(query)}`;
    const cached = await this.cacheManager.get<PaginatedResponse<Location>>(cacheKey);
    if (cached) {
      this.logger.debug('Cache hit for locations list');
      return cached;
    }

    // Use query builder for search support
    const queryBuilder = this.locationRepository
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.collector', 'collector')
      .orderBy('location.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Apply search
    if (search) {
      queryBuilder.andWhere(
        '(location.name ILIKE :search OR location.description ILIKE :search OR location.address ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply filters
    if (status) queryBuilder.andWhere('location.status = :status', { status });
    if (category) queryBuilder.andWhere('location.category = :category', { category });
    if (city) queryBuilder.andWhere('location.city ILIKE :city', { city: `%${city}%` });
    if (collectorId) queryBuilder.andWhere('location.collectorId = :collectorId', { collectorId });

    const [data, total] = await queryBuilder.getManyAndCount();

    const result: PaginatedResponse<Location> = {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    // Cache result
    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async findOne(id: string): Promise<Location> {
    // Try cache
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    const cached = await this.cacheManager.get<Location>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for location ${id}`);
      return cached;
    }

    const location = await this.locationRepository.findOne({
      where: { id },
      relations: ['collector'],
    });

    if (!location) {
      throw new NotFoundException(`Location ${id} not found`);
    }

    // Cache
    await this.cacheManager.set(cacheKey, location, this.CACHE_TTL);

    return location;
  }

  async findNearby(
    lat: number,
    lng: number,
    radiusKm: number = 5,
  ): Promise<Location[]> {
    // Using Haversine formula in raw query for nearby search
    const locations = await this.locationRepository
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.collector', 'collector')
      .where('location.status = :status', { status: LocationStatus.VALIDATED })
      .andWhere(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(location.latitude)) *
            cos(radians(location.longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(location.latitude))
          )
        ) <= :radius`,
        { lat, lng, radius: radiusKm },
      )
      .orderBy(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(location.latitude)) *
            cos(radians(location.longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(location.latitude))
          )
        )`,
        'ASC',
      )
      .setParameters({ lat, lng })
      .limit(50)
      .getMany();

    return locations;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateLocationDto,
  ): Promise<Location> {
    const existing = await this.findOne(id);

    // Only owner can update, and only pending locations
    if (existing.collectorId !== userId) {
      throw new BadRequestException('You can only update your own locations');
    }

    if (existing.status !== LocationStatus.PENDING) {
      throw new BadRequestException('Cannot update a validated/rejected location');
    }

    const updateData = {
      ...(dto.name && { name: dto.name }),
      ...(dto.category && { category: dto.category }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.latitude && { latitude: dto.latitude }),
      ...(dto.longitude && { longitude: dto.longitude }),
      ...(dto.accuracy !== undefined && { accuracy: dto.accuracy }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.city && { city: dto.city }),
      ...(dto.photos && { photos: dto.photos }),
      ...(dto.metadata && { metadata: dto.metadata as Record<string, unknown> }),
      updatedAt: new Date(),
    };

    await this.locationRepository.update(id, updateData as any);

    // Invalidate caches
    await this.cacheManager.del(`${this.CACHE_PREFIX}${id}`);
    await this.invalidateListCache();

    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.findOne(id);

    // Only owner can delete, and only pending locations
    if (existing.collectorId !== userId) {
      throw new BadRequestException('You can only delete your own locations');
    }

    if (existing.status !== LocationStatus.PENDING) {
      throw new BadRequestException('Cannot delete a validated/rejected location');
    }

    await this.locationRepository.delete(id);

    // Invalidate caches
    await this.cacheManager.del(`${this.CACHE_PREFIX}${id}`);
    await this.invalidateListCache();
  }

  async validate(
    id: string,
    validatorId: string,
    dto: ValidateLocationDto,
  ): Promise<Location> {
    const location = await this.findOne(id);

    if (location.status !== LocationStatus.PENDING) {
      throw new BadRequestException('Location already processed');
    }

    if (dto.action === ValidationAction.REJECT && !dto.reason) {
      throw new BadRequestException('Rejection reason is required');
    }

    const pointsToAward =
      dto.action === ValidationAction.VALIDATE
        ? dto.pointsToAward || this.calculatePoints(location)
        : 0;

    const newStatus =
      dto.action === ValidationAction.VALIDATE
        ? LocationStatus.VALIDATED
        : LocationStatus.REJECTED;

    await this.locationRepository.update(id, {
      status: newStatus,
      validatedBy: validatorId,
      validatedAt: new Date(),
      rejectionReason: dto.action === ValidationAction.REJECT ? dto.reason : null,
      pointsAwarded: pointsToAward,
    });

    // Update collector points if validated
    if (dto.action === ValidationAction.VALIDATE && location.collectorId) {
      await this.profileRepository.increment(
        { id: location.collectorId },
        'points',
        pointsToAward,
      );
    }

    // Invalidate caches
    await this.cacheManager.del(`${this.CACHE_PREFIX}${id}`);
    await this.invalidateListCache();

    return this.findOne(id);
  }

  async addPhotos(id: string, photoUrls: string[]): Promise<Location> {
    const location = await this.findOne(id);

    const updatedPhotos = [...(location.photos || []), ...photoUrls];

    await this.locationRepository.update(id, {
      photos: updatedPhotos,
      updatedAt: new Date(),
    });

    // Invalidate cache
    await this.cacheManager.del(`${this.CACHE_PREFIX}${id}`);

    return this.findOne(id);
  }

  private calculatePoints(location: Location): number {
    let points = 10; // Base points

    // Bonus for photos
    if (location.photos?.length > 0) {
      points += Math.min(location.photos.length * 2, 10);
    }

    // Bonus for description
    if (location.description && location.description.length > 50) {
      points += 5;
    }

    // Bonus for address
    if (location.address) {
      points += 3;
    }

    return Math.min(points, 50); // Max 50 points
  }

  private async invalidateListCache(): Promise<void> {
    // NestJS cache-manager doesn't have a keys() method by default
    // We'll use a pattern-based approach or just clear specific known keys
    const keys = await this.cacheManager.store.keys?.(`${this.CACHE_PREFIX}list:*`);
    if (keys && keys.length > 0) {
      await Promise.all(keys.map((key) => this.cacheManager.del(key)));
    }
  }
}
