import { AppDataSource } from '../config/database';
import { Labour } from '../models/Labour';
import { generateCode, CODE_PREFIXES } from '../utils/codeGenerator';
import { NotFoundError, VersionConflictError } from '../middleware/errorHandler';
import { OptimisticLockVersionMismatchError } from 'typeorm';
import { PaginatedResult } from '../types/common';

export interface CreateLabourDto {
  name: string;
  description?: string;
  hourlyRate: number;
  defaultHours?: number;
  isFlatRate?: boolean;
  category?: string;
}

export interface UpdateLabourDto {
  name?: string;
  description?: string;
  hourlyRate?: number;
  defaultHours?: number;
  isFlatRate?: boolean;
  category?: string;
  isActive?: boolean;
  version?: number;
}

export { PaginatedResult };

export class LabourService {
  private repository = AppDataSource.getRepository(Labour);

  async findAll(
    page: number = 1,
    limit: number = 50,
    search?: string,
    category?: string,
    active?: boolean
  ): Promise<PaginatedResult<Labour>> {
    const queryBuilder = this.repository.createQueryBuilder('labour');

    if (search) {
      queryBuilder.andWhere(
        '(labour.name ILIKE :search OR labour.code ILIKE :search OR labour.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (category) {
      queryBuilder.andWhere('labour.category = :category', { category });
    }

    if (active !== undefined) {
      queryBuilder.andWhere('labour.isActive = :active', { active });
    } else {
      queryBuilder.andWhere('labour.isActive = true');
    }

    const [data, total] = await queryBuilder
      .orderBy('labour.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Labour> {
    const item = await this.repository.findOne({ where: { id } });

    if (!item) {
      throw new NotFoundError('Labour item not found');
    }

    return item;
  }

  async findByCode(code: string): Promise<Labour> {
    const item = await this.repository.findOne({ where: { code } });

    if (!item) {
      throw new NotFoundError('Labour item not found');
    }

    return item;
  }

  async create(data: CreateLabourDto): Promise<Labour> {
    const code = await generateCode('labour', CODE_PREFIXES.LABOUR);

    const item = this.repository.create({
      ...data,
      code,
      defaultHours: data.defaultHours ?? 1,
      isFlatRate: data.isFlatRate ?? false,
    });

    return this.repository.save(item);
  }

  async update(id: string, data: UpdateLabourDto): Promise<Labour> {
    const item = await this.findById(id);
    
    // Check version if provided
    if (data.version !== undefined && data.version !== item.version) {
      throw new VersionConflictError(
        'This labour item has been modified by another user. Please refresh and try again.'
      );
    }
    
    Object.assign(item, data);
    
    try {
      return await this.repository.save(item);
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new VersionConflictError(
          'This labour item has been modified by another user. Please refresh and try again.'
        );
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const item = await this.findById(id);
    await this.repository.remove(item);
  }

  async getCategories(): Promise<string[]> {
    const result = await this.repository
      .createQueryBuilder('labour')
      .select('DISTINCT labour.category', 'category')
      .where('labour.category IS NOT NULL')
      .andWhere('labour.isActive = true')
      .orderBy('labour.category', 'ASC')
      .getRawMany();

    return result.map((r) => r.category as string);
  }
}

