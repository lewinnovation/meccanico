import { AppDataSource } from '../config/database';
import { Inventory } from '../models/Inventory';
import { generateCode, CODE_PREFIXES } from '../utils/codeGenerator';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';
import { PaginatedResult } from '../types/common';

export interface CreateInventoryDto {
  name: string;
  description?: string;
  sku?: string;
  unitPrice: number;
  costPrice?: number;
  quantityInStock?: number;
  minimumStock?: number;
  category?: string;
  unit?: string;
}

export interface UpdateInventoryDto {
  name?: string;
  description?: string;
  sku?: string;
  unitPrice?: number;
  costPrice?: number;
  minimumStock?: number;
  category?: string;
  unit?: string;
  isActive?: boolean;
}

export interface AdjustStockDto {
  adjustment: number;
  reason?: string;
}

export { PaginatedResult };

export class InventoryService {
  private repository = AppDataSource.getRepository(Inventory);

  async findAll(
    page: number = 1,
    limit: number = 50,
    search?: string,
    category?: string,
    lowStock?: boolean,
    active?: boolean
  ): Promise<PaginatedResult<Inventory>> {
    const queryBuilder = this.repository.createQueryBuilder('inventory');

    if (search) {
      queryBuilder.andWhere(
        '(inventory.name ILIKE :search OR inventory.code ILIKE :search OR inventory.sku ILIKE :search OR inventory.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (category) {
      queryBuilder.andWhere('inventory.category = :category', { category });
    }

    if (lowStock) {
      queryBuilder.andWhere('inventory.quantityInStock <= inventory.minimumStock');
    }

    if (active !== undefined) {
      queryBuilder.andWhere('inventory.isActive = :active', { active });
    } else {
      // Default to showing only active items
      queryBuilder.andWhere('inventory.isActive = true');
    }

    const [data, total] = await queryBuilder
      .orderBy('inventory.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Inventory> {
    const item = await this.repository.findOne({ where: { id } });

    if (!item) {
      throw new NotFoundError('Inventory item not found');
    }

    return item;
  }

  async findByCode(code: string): Promise<Inventory> {
    const item = await this.repository.findOne({ where: { code } });

    if (!item) {
      throw new NotFoundError('Inventory item not found');
    }

    return item;
  }

  async create(data: CreateInventoryDto): Promise<Inventory> {
    // Check for duplicate SKU if provided
    if (data.sku) {
      const existing = await this.repository.findOne({
        where: { sku: data.sku },
      });
      if (existing) {
        throw new ConflictError('Inventory item with this SKU already exists');
      }
    }

    const code = await generateCode('inventory', CODE_PREFIXES.INVENTORY);

    const item = this.repository.create({
      ...data,
      code,
      quantityInStock: data.quantityInStock ?? 0,
      minimumStock: data.minimumStock ?? 0,
      unit: data.unit ?? 'each',
    });

    return this.repository.save(item);
  }

  async update(id: string, data: UpdateInventoryDto): Promise<Inventory> {
    const item = await this.findById(id);

    // Check for duplicate SKU if being updated
    if (data.sku && data.sku !== item.sku) {
      const existing = await this.repository.findOne({
        where: { sku: data.sku },
      });
      if (existing) {
        throw new ConflictError('Inventory item with this SKU already exists');
      }
    }

    Object.assign(item, data);
    return this.repository.save(item);
  }

  async delete(id: string): Promise<void> {
    const item = await this.findById(id);
    // In production, check for usage in line_items and deactivate instead
    await this.repository.remove(item);
  }

  async adjustStock(id: string, data: AdjustStockDto): Promise<Inventory> {
    const item = await this.findById(id);
    item.quantityInStock += data.adjustment;
    return this.repository.save(item);
  }

  async getCategories(): Promise<string[]> {
    const result = await this.repository
      .createQueryBuilder('inventory')
      .select('DISTINCT inventory.category', 'category')
      .where('inventory.category IS NOT NULL')
      .andWhere('inventory.isActive = true')
      .orderBy('inventory.category', 'ASC')
      .getRawMany();

    return result.map((r) => r.category as string);
  }
}

