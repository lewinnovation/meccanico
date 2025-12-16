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
  Request,
} from 'tsoa';
import {
  TemplateService,
  CreateTemplateDto,
  UpdateTemplateDto,
  PaginatedResult,
  TemplateItemDto,
} from '../services/TemplateService';
import { Template } from '../models/Template';
import { TemplateItem } from '../models/TemplateItem';
import { AuthenticatedRequest } from '../middleware/auth';

@Route('api/templates')
@Tags('Templates')
@Security('jwt')
export class TemplateController extends Controller {
  private templateService = new TemplateService();

  /**
   * Get all templates with pagination and search
   */
  @Get('/')
  public async getTemplates(
    @Request() request: AuthenticatedRequest,
    @Query() page: number = 1,
    @Query() limit: number = 50,
    @Query() search?: string
  ): Promise<PaginatedResult<Template>> {
    const userId = request.user?.id;
    return this.templateService.findAll(page, limit, search, userId);
  }

  /**
   * Get a template by ID
   */
  @Get('/{id}')
  public async getTemplate(@Path() id: string): Promise<Template> {
    return this.templateService.findById(id);
  }

  /**
   * Get a template by code
   */
  @Get('/code/{code}')
  public async getTemplateByCode(@Path() code: string): Promise<Template> {
    return this.templateService.findByCode(code);
  }

  /**
   * Create a new template
   */
  @Post('/')
  @SuccessResponse(201, 'Created')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  public async createTemplate(
    @Request() request: AuthenticatedRequest,
    @Body() body: CreateTemplateDto
  ): Promise<Template> {
    this.setStatus(201);
    const userId = request.user?.id;
    return this.templateService.create({ ...body, createdBy: userId });
  }

  /**
   * Update a template
   */
  @Patch('/{id}')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  public async updateTemplate(
    @Path() id: string,
    @Body() body: UpdateTemplateDto
  ): Promise<Template> {
    return this.templateService.update(id, body);
  }

  /**
   * Delete a template
   */
  @Delete('/{id}')
  @SuccessResponse(204, 'Deleted')
  @Security('jwt', ['ADMIN'])
  public async deleteTemplate(@Path() id: string): Promise<void> {
    this.setStatus(204);
    return this.templateService.delete(id);
  }

  /**
   * Add an item to a template
   */
  @Post('/{id}/items')
  @SuccessResponse(201, 'Created')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  public async addTemplateItem(
    @Path() id: string,
    @Body() body: TemplateItemDto
  ): Promise<TemplateItem> {
    this.setStatus(201);
    return this.templateService.addItem(id, body);
  }

  /**
   * Remove an item from a template
   */
  @Delete('/{id}/items/{itemId}')
  @SuccessResponse(204, 'Deleted')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  public async removeTemplateItem(
    @Path() id: string,
    @Path() itemId: string
  ): Promise<void> {
    this.setStatus(204);
    return this.templateService.removeItem(id, itemId);
  }
}
