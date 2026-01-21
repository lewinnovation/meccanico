import {
  Controller,
  Get,
  Post,
  Put,
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
  CommunicationTemplateService,
  CreateCommunicationTemplateDto,
  UpdateCommunicationTemplateDto,
} from '../services/CommunicationTemplateService';
import {
  CommunicationTemplate,
  CommunicationTemplateType,
} from '../models/CommunicationTemplate';

@Route('api/communication-templates')
@Tags('Communication Templates')
@Security('jwt')
export class CommunicationTemplateController extends Controller {
  private templateService = new CommunicationTemplateService();

  /**
   * Get all communication templates
   */
  @Get('/')
  public async getCommunicationTemplates(
    @Query() type?: CommunicationTemplateType
  ): Promise<CommunicationTemplate[]> {
    return this.templateService.findAll(type);
  }

  /**
   * Get available template variables
   */
  @Get('/variables')
  public async getVariables(): Promise<Array<{ key: string; description: string }>> {
    return this.templateService.getAvailableVariables();
  }

  /**
   * Get a template by ID
   */
  @Get('/{id}')
  public async getCommunicationTemplate(@Path() id: string): Promise<CommunicationTemplate> {
    return this.templateService.findById(id);
  }

  /**
   * Create a new template
   */
  @Post('/')
  @Security('jwt', ['ADMIN'])
  @SuccessResponse(201, 'Created')
  public async createCommunicationTemplate(
    @Body() body: CreateCommunicationTemplateDto
  ): Promise<CommunicationTemplate> {
    this.setStatus(201);
    return this.templateService.create(body);
  }

  /**
   * Update a template
   */
  @Put('/{id}')
  @Security('jwt', ['ADMIN'])
  public async updateCommunicationTemplate(
    @Path() id: string,
    @Body() body: UpdateCommunicationTemplateDto
  ): Promise<CommunicationTemplate> {
    return this.templateService.update(id, body);
  }

  /**
   * Delete a template
   */
  @Delete('/{id}')
  @Security('jwt', ['ADMIN'])
  @SuccessResponse(204, 'Deleted')
  public async deleteCommunicationTemplate(@Path() id: string): Promise<void> {
    this.setStatus(204);
    return this.templateService.delete(id);
  }
}
