import { AppDataSource } from '../config/database';
import {
  CommunicationTemplate,
  CommunicationTemplateType,
  CommunicationTemplateAction,
} from '../models/CommunicationTemplate';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';
import { getAvailableTemplateVariables } from '../utils/templateRenderer';

export interface CreateCommunicationTemplateDto {
  name: string;
  type: CommunicationTemplateType;
  action: CommunicationTemplateAction;
  subject?: string | null;
  body: string;
  isActive?: boolean;
}

export interface UpdateCommunicationTemplateDto {
  name?: string;
  subject?: string | null;
  body?: string;
  isActive?: boolean;
}

export class CommunicationTemplateService {
  private repository = AppDataSource.getRepository(CommunicationTemplate);

  /**
   * Get all templates
   */
  async findAll(type?: CommunicationTemplateType): Promise<CommunicationTemplate[]> {
    const queryBuilder = this.repository.createQueryBuilder('template');

    if (type) {
      queryBuilder.where('template.type = :type', { type });
    }

    return queryBuilder.orderBy('template.action', 'ASC').addOrderBy('template.name', 'ASC').getMany();
  }

  /**
   * Get a template by ID
   */
  async findById(id: string): Promise<CommunicationTemplate> {
    const template = await this.repository.findOne({ where: { id } });

    if (!template) {
      throw new NotFoundError('Communication template not found');
    }

    return template;
  }

  /**
   * Get template by action and type
   */
  async findByActionAndType(
    action: CommunicationTemplateAction,
    type: CommunicationTemplateType
  ): Promise<CommunicationTemplate | null> {
    return this.repository.findOne({
      where: { action, type, isActive: true },
    });
  }

  /**
   * Create a new template
   */
  async create(data: CreateCommunicationTemplateDto): Promise<CommunicationTemplate> {
    // Check for duplicate action/type combination
    const existing = await this.repository.findOne({
      where: { action: data.action, type: data.type },
    });

    if (existing) {
      throw new ConflictError(
        `Template already exists for action ${data.action} and type ${data.type}`
      );
    }

    const template = this.repository.create({
      name: data.name,
      type: data.type,
      action: data.action,
      subject: data.subject || null,
      body: data.body,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    return this.repository.save(template);
  }

  /**
   * Update a template
   */
  async update(id: string, data: UpdateCommunicationTemplateDto): Promise<CommunicationTemplate> {
    const template = await this.findById(id);

    if (data.name !== undefined) {
      template.name = data.name;
    }
    if (data.subject !== undefined) {
      template.subject = data.subject;
    }
    if (data.body !== undefined) {
      template.body = data.body;
    }
    if (data.isActive !== undefined) {
      template.isActive = data.isActive;
    }

    return this.repository.save(template);
  }

  /**
   * Delete a template
   */
  async delete(id: string): Promise<void> {
    const template = await this.findById(id);
    await this.repository.remove(template);
  }

  /**
   * Get available template variables
   */
  getAvailableVariables(): Array<{ key: string; description: string }> {
    return getAvailableTemplateVariables();
  }
}
