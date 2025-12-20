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
  public async getTemplates(
    @Query() type?: CommunicationTemplateType
  ): Promise<CommunicationTemplate[]> {
    return this.templateService.findAll(type);
  }

  /**
   * Get a template by ID
   */
  @Get('/{id}')
  public async getTemplate(@Path() id: string): Promise<CommunicationTemplate> {
    return this.templateService.findById(id);
  }

  /**
   * Get available template variables
   */
  @Get('/variables')
  public async getVariables(): Promise<Array<{ key: string; description: string }>> {
    return this.templateService.getAvailableVariables();
  }

  /**
   * Create a new template
   */
  @Post('/')
  @SuccessResponse(201, 'Created')
  public async createTemplate(
    @Body() body: CreateCommunicationTemplateDto
  ): Promise<CommunicationTemplate> {
    this.setStatus(201);
    return this.templateService.create(body);
  }

  /**
   * Update a template
   */
  @Put('/{id}')
  public async updateTemplate(
    @Path() id: string,
    @Body() body: UpdateCommunicationTemplateDto
  ): Promise<CommunicationTemplate> {
    return this.templateService.update(id, body);
  }

  /**
   * Delete a template
   */
  @Delete('/{id}')
  @SuccessResponse(204, 'Deleted')
  public async deleteTemplate(@Path() id: string): Promise<void> {
    this.setStatus(204);
    return this.templateService.delete(id);
  }
}
