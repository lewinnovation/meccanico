import { AppDataSource } from '../config/database';
import { Inventory } from '../models/Inventory';
import { generateCode, CODE_PREFIXES } from '../utils/codeGenerator';
import { NotFoundError, ConflictError, VersionConflictError } from '../middleware/errorHandler';
import { OptimisticLockVersionMismatchError } from 'typeorm';
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
  version?: number;
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
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const repository = queryRunner.manager.getRepository(Inventory);
      if (data.sku) {
        const existing = await repository.findOne({
          where: { sku: data.sku },
        });
        if (existing) {
          throw new ConflictError('Inventory item with this SKU already exists');
        }
      }

      await queryRunner.query(
        "SELECT pg_advisory_xact_lock(hashtext($1))",
        ["inventory_code"],
      );
      const result = await queryRunner.query(
        `
          SELECT code FROM inventory
          WHERE code LIKE $1
          ORDER BY code DESC
          LIMIT 1
        `,
        [`${CODE_PREFIXES.INVENTORY}%`],
      );
      let nextNumber = 1;
      if (result.length > 0) {
        const lastCode = result[0].code as string;
        const lastNumber = Number.parseInt(lastCode.substring(1), 10);
        if (!Number.isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      const code = `${CODE_PREFIXES.INVENTORY}${nextNumber
        .toString()
        .padStart(3, "0")}`;

      const item = repository.create({
        ...data,
        code,
        quantityInStock: data.quantityInStock ?? 0,
        minimumStock: data.minimumStock ?? 0,
        unit: data.unit ?? "each",
      });

      const saved = await repository.save(item);
      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, data: UpdateInventoryDto): Promise<Inventory> {
    const item = await this.findById(id);

    // Check version if provided
    if (data.version !== undefined && data.version !== item.version) {
      throw new VersionConflictError(
        'This inventory item has been modified by another user. Please refresh and try again.'
      );
    }

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
    
    try {
      return await this.repository.save(item);
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new VersionConflictError(
          'This inventory item has been modified by another user. Please refresh and try again.'
        );
      }
      throw error;
    }
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

