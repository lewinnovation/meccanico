import { AppDataSource } from '../config/database';
import { Template } from '../models/Template';
import { TemplateItem } from '../models/TemplateItem';
import { LineItemType } from '../models/LineItem';
import { generateCode, CODE_PREFIXES } from '../utils/codeGenerator';
import { NotFoundError, VersionConflictError } from '../middleware/errorHandler';
import { OptimisticLockVersionMismatchError } from 'typeorm';
import { PaginatedResult } from '../types/common';

export interface TemplateItemDto {
  itemType: LineItemType;
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder?: number;
}

export interface CreateTemplateDto {
  name: string;
  description?: string;
  isGlobal?: boolean;
  createdBy?: string;
  items?: TemplateItemDto[];
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  isGlobal?: boolean;
  items?: TemplateItemDto[];
  version?: number;
}

export { PaginatedResult };

export class TemplateService {
  private repository = AppDataSource.getRepository(Template);
  private itemRepository = AppDataSource.getRepository(TemplateItem);

  async findAll(
    page: number = 1,
    limit: number = 50,
    search?: string,
    userId?: string
  ): Promise<PaginatedResult<Template>> {
    const queryBuilder = this.repository.createQueryBuilder('template');

    if (search) {
      queryBuilder.andWhere(
        '(template.name ILIKE :search OR template.code ILIKE :search OR template.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Show global templates and user's own templates
    if (userId) {
      queryBuilder.andWhere(
        '(template.isGlobal = true OR template.createdBy = :userId)',
        { userId }
      );
    }

    const [data, total] = await queryBuilder
      .leftJoinAndSelect('template.items', 'items')
      .orderBy('template.name', 'ASC')
      .addOrderBy('items.sortOrder', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Template> {
    const template = await this.repository.findOne({
      where: { id },
      relations: ['items'],
      order: { items: { sortOrder: 'ASC' } },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    return template;
  }

  async findByCode(code: string): Promise<Template> {
    const template = await this.repository.findOne({
      where: { code },
      relations: ['items'],
      order: { items: { sortOrder: 'ASC' } },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    return template;
  }

  async create(data: CreateTemplateDto): Promise<Template> {
    const code = await generateCode('templates', CODE_PREFIXES.TEMPLATE);

    const template = this.repository.create({
      code,
      name: data.name,
      description: data.description,
      isGlobal: data.isGlobal ?? false,
      createdBy: data.createdBy,
    });

    const savedTemplate = await this.repository.save(template);

    // Add template items if provided
    if (data.items && data.items.length > 0) {
      const items = data.items.map((item, index) =>
        this.itemRepository.create({
          templateId: savedTemplate.id,
          itemType: item.itemType,
          itemId: item.itemId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          sortOrder: item.sortOrder ?? index,
        })
      );
      await this.itemRepository.save(items);
    }

    return this.findById(savedTemplate.id);
  }

  async update(id: string, data: UpdateTemplateDto): Promise<Template> {
    // Load template to check version
    const template = await this.repository.findOne({ where: { id } });
    
    if (!template) {
      throw new NotFoundError('Template not found');
    }

    // Check version if provided
    if (data.version !== undefined && data.version !== template.version) {
      throw new VersionConflictError(
        'This template has been modified by another user. Please refresh and try again.'
      );
    }

    // Update template items if provided
    if (data.items !== undefined) {
      // Remove existing items
      await this.itemRepository.delete({ templateId: id });

      // Add new items
      if (data.items.length > 0) {
        const items = data.items.map((item, index) =>
          this.itemRepository.create({
            templateId: id,
            itemType: item.itemType,
            itemId: item.itemId || null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            sortOrder: item.sortOrder ?? index,
          })
        );
        await this.itemRepository.save(items);
      }
    }

    // Update template fields using entity save to support version checking
    const { items, ...templateData } = data;
    Object.assign(template, templateData);
    
    try {
      await this.repository.save(template);
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new VersionConflictError(
          'This template has been modified by another user. Please refresh and try again.'
        );
      }
      throw error;
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const template = await this.findById(id);
    await this.repository.remove(template);
  }

  async addItem(templateId: string, item: TemplateItemDto): Promise<TemplateItem> {
    const template = await this.findById(templateId);
    
    // Get max sort order
    const maxSortOrder = template.items?.reduce(
      (max, i) => Math.max(max, i.sortOrder),
      -1
    ) ?? -1;

    const newItem = this.itemRepository.create({
      templateId,
      itemType: item.itemType,
      itemId: item.itemId || null,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      sortOrder: item.sortOrder ?? maxSortOrder + 1,
    });

    return this.itemRepository.save(newItem);
  }

  async removeItem(templateId: string, itemId: string): Promise<void> {
    await this.findById(templateId);
    await this.itemRepository.delete({ id: itemId, templateId });
  }
}

