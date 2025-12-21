import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Path,
  Query,
  Route,
  Tags,
  Security,
  SuccessResponse,
} from 'tsoa';
import {
  ServiceService,
  CreateServiceDto,
  UpdateServiceDto,
  PaginatedResult,
} from '../services/ServiceService';
import { Service } from '../models/Service';

@Route('api/services')
@Tags('Services')
@Security('jwt')
export class ServiceController extends Controller {
  private serviceService = new ServiceService();

  /**
   * Get all services with pagination and filters
   */
  @Get('/')
  public async getServices(
    @Query() page: number = 1,
    @Query() limit: number = 50,
    @Query() search?: string,
    @Query() category?: string,
    @Query() active?: boolean
  ): Promise<PaginatedResult<Service>> {
    return this.serviceService.findAll(page, limit, search, category, active);
  }

  /**
   * Get available categories
   */
  @Get('/categories')
  public async getCategories(): Promise<string[]> {
    return this.serviceService.getCategories();
  }

  /**
   * Get a service by ID
   */
  @Get('/{id}')
  public async getService(@Path() id: string): Promise<Service> {
    return this.serviceService.findById(id);
  }

  /**
   * Get a service by code
   */
  @Get('/code/{code}')
  public async getServiceByCode(@Path() code: string): Promise<Service> {
    return this.serviceService.findByCode(code);
  }

  /**
   * Create a new service
   */
  @Post('/')
  @Security('jwt', ['ADMIN'])
  @SuccessResponse(201, 'Created')
  public async createService(@Body() body: CreateServiceDto): Promise<Service> {
    this.setStatus(201);
    return this.serviceService.create(body);
  }

  /**
   * Update a service
   */
  @Patch('/{id}')
  @Security('jwt', ['ADMIN'])
  public async updateService(
    @Path() id: string,
    @Body() body: UpdateServiceDto
  ): Promise<Service> {
    return this.serviceService.update(id, body);
  }

  /**
   * Delete a service
   */
  @Delete('/{id}')
  @Security('jwt', ['ADMIN'])
  @SuccessResponse(204, 'Deleted')
  public async deleteService(@Path() id: string): Promise<void> {
    this.setStatus(204);
    return this.serviceService.delete(id);
  }
}

