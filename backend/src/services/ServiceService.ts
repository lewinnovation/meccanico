import { AppDataSource } from '../config/database';
import { Service } from '../models/Service';
import { ServiceItem, ServiceItemType } from '../models/ServiceItem';
import { generateCode, CODE_PREFIXES } from '../utils/codeGenerator';
import { NotFoundError, VersionConflictError } from '../middleware/errorHandler';
import { OptimisticLockVersionMismatchError } from 'typeorm';
import { PaginatedResult } from '../types/common';

export interface ServiceItemDto {
  itemType: ServiceItemType;
  itemId: string;
  quantity: number;
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  basePrice: number;
  category?: string;
  items?: ServiceItemDto[];
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  basePrice?: number;
  category?: string;
  isActive?: boolean;
  items?: ServiceItemDto[];
  version?: number;
}

export { PaginatedResult };

export class ServiceService {
  private repository = AppDataSource.getRepository(Service);
  private itemRepository = AppDataSource.getRepository(ServiceItem);

  async findAll(
    page: number = 1,
    limit: number = 50,
    search?: string,
    category?: string,
    active?: boolean
  ): Promise<PaginatedResult<Service>> {
    const queryBuilder = this.repository.createQueryBuilder('service');

    if (search) {
      queryBuilder.andWhere(
        '(service.name ILIKE :search OR service.code ILIKE :search OR service.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (category) {
      queryBuilder.andWhere('service.category = :category', { category });
    }

    if (active !== undefined) {
      queryBuilder.andWhere('service.isActive = :active', { active });
    } else {
      queryBuilder.andWhere('service.isActive = true');
    }

    const [data, total] = await queryBuilder
      .leftJoinAndSelect('service.items', 'items')
      .orderBy('service.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Service> {
    const service = await this.repository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    return service;
  }

  async findByCode(code: string): Promise<Service> {
    const service = await this.repository.findOne({
      where: { code },
      relations: ['items'],
    });

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    return service;
  }

  async create(data: CreateServiceDto): Promise<Service> {
    const code = await generateCode('services', CODE_PREFIXES.SERVICE);

    const service = this.repository.create({
      name: data.name,
      description: data.description,
      basePrice: data.basePrice,
      category: data.category,
      code,
    });

    const savedService = await this.repository.save(service);

    // Add service items if provided
    if (data.items && data.items.length > 0) {
      const serviceItems = data.items.map((item) =>
        this.itemRepository.create({
          serviceId: savedService.id,
          itemType: item.itemType,
          itemId: item.itemId,
          quantity: item.quantity,
        })
      );
      await this.itemRepository.save(serviceItems);
    }

    return this.findById(savedService.id);
  }

  async update(id: string, data: UpdateServiceDto): Promise<Service> {
    const service = await this.findById(id);

    // Check version if provided
    if (data.version !== undefined && data.version !== service.version) {
      throw new VersionConflictError(
        'This service has been modified by another user. Please refresh and try again.'
      );
    }

    // Update service items if provided
    if (data.items !== undefined) {
      // Remove existing items
      await this.itemRepository.delete({ serviceId: id });

      // Add new items
      if (data.items.length > 0) {
        const serviceItems = data.items.map((item) =>
          this.itemRepository.create({
            serviceId: id,
            itemType: item.itemType,
            itemId: item.itemId,
            quantity: item.quantity,
          })
        );
        await this.itemRepository.save(serviceItems);
      }
    }

    // Update service fields
    const { items, ...serviceData } = data;
    Object.assign(service, serviceData);
    
    try {
      await this.repository.save(service);
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new VersionConflictError(
          'This service has been modified by another user. Please refresh and try again.'
        );
      }
      throw error;
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const service = await this.findById(id);
    await this.repository.remove(service);
  }

  async getCategories(): Promise<string[]> {
    const result = await this.repository
      .createQueryBuilder('service')
      .select('DISTINCT service.category', 'category')
      .where('service.category IS NOT NULL')
      .andWhere('service.isActive = true')
      .orderBy('service.category', 'ASC')
      .getRawMany();

    return result.map((r) => r.category as string);
  }
}

