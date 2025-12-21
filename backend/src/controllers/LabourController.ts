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
  LabourService,
  CreateLabourDto,
  UpdateLabourDto,
  PaginatedResult,
} from '../services/LabourService';
import { Labour } from '../models/Labour';

@Route('api/labour')
@Tags('Labour')
@Security('jwt')
export class LabourController extends Controller {
  private labourService = new LabourService();

  /**
   * Get all labour items with pagination and filters
   */
  @Get('/')
  public async getLabour(
    @Query() page: number = 1,
    @Query() limit: number = 50,
    @Query() search?: string,
    @Query() category?: string,
    @Query() active?: boolean
  ): Promise<PaginatedResult<Labour>> {
    return this.labourService.findAll(page, limit, search, category, active);
  }

  /**
   * Get available categories
   */
  @Get('/categories')
  public async getCategories(): Promise<string[]> {
    return this.labourService.getCategories();
  }

  /**
   * Get a labour item by ID
   */
  @Get('/{id}')
  public async getLabourItem(@Path() id: string): Promise<Labour> {
    return this.labourService.findById(id);
  }

  /**
   * Get a labour item by code
   */
  @Get('/code/{code}')
  public async getLabourItemByCode(@Path() code: string): Promise<Labour> {
    return this.labourService.findByCode(code);
  }

  /**
   * Create a new labour item
   */
  @Post('/')
  @Security('jwt', ['ADMIN'])
  @SuccessResponse(201, 'Created')
  public async createLabourItem(@Body() body: CreateLabourDto): Promise<Labour> {
    this.setStatus(201);
    return this.labourService.create(body);
  }

  /**
   * Update a labour item
   */
  @Patch('/{id}')
  @Security('jwt', ['ADMIN'])
  public async updateLabourItem(
    @Path() id: string,
    @Body() body: UpdateLabourDto
  ): Promise<Labour> {
    return this.labourService.update(id, body);
  }

  /**
   * Delete a labour item
   */
  @Delete('/{id}')
  @Security('jwt', ['ADMIN'])
  @SuccessResponse(204, 'Deleted')
  public async deleteLabourItem(@Path() id: string): Promise<void> {
    this.setStatus(204);
    return this.labourService.delete(id);
  }
}

