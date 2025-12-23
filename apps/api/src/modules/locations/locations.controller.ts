import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { UploadService } from '../../common/upload/upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Location } from './entities/location.entity';
import {
  CreateLocationDto,
  UpdateLocationDto,
  ValidateLocationDto,
  QueryLocationDto,
  NearbyLocationDto,
} from './dto';
import { PaginatedResponse } from './interfaces';

@ApiTags('locations')
@Controller({ path: 'locations', version: '1' })
export class LocationsController {
  constructor(
    private readonly locationsService: LocationsService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new location (POI)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Location created successfully',
    type: Location,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid data' })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() createLocationDto: CreateLocationDto,
  ): Promise<Location> {
    return this.locationsService.create(userId, createLocationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all locations with filters and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of locations',
  })
  async findAll(
    @Query() query: QueryLocationDto,
  ): Promise<PaginatedResponse<Location>> {
    return this.locationsService.findAll(query);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find locations near a point' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of nearby locations',
    type: [Location],
  })
  async findNearby(@Query() query: NearbyLocationDto): Promise<Location[]> {
    return this.locationsService.findNearby(query.lat, query.lng, query.radius);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a location by ID' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Location details',
    type: Location,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Location not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Location> {
    return this.locationsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a location' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Location updated successfully',
    type: Location,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Location not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot update this location',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ): Promise<Location> {
    return this.locationsService.update(id, userId, updateLocationDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a location' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Location deleted successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Location not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete this location',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<void> {
    return this.locationsService.remove(id, userId);
  }

  @Patch(':id/validate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'validator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate or reject a location (admin/validator only)' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Location validated/rejected successfully',
    type: Location,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - requires admin/validator role' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Location not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Location already processed or invalid data',
  })
  async validate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') validatorId: string,
    @Body() validateLocationDto: ValidateLocationDto,
  ): Promise<Location> {
    return this.locationsService.validate(id, validatorId, validateLocationDto);
  }

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('photos', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload photos for a location' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photos: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Photos uploaded successfully',
    type: Location,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Location not found' })
  async uploadPhotos(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<Location> {
    // Verify ownership
    const location = await this.locationsService.findOne(id);
    if (location.collectorId !== userId) {
      throw new Error('You can only upload photos to your own locations');
    }

    // Upload files to MinIO
    const photoUrls = await Promise.all(
      files.map((file) =>
        this.uploadService.uploadFile(file, `locations/${id}`),
      ),
    );

    return this.locationsService.addPhotos(id, photoUrls);
  }
}
