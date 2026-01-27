import { AppDataSource } from '../config/database';
import { Customer } from '../models/Customer';
import { VehicleOwner } from '../models/VehicleOwner';
import { NotFoundError, ConflictError, VersionConflictError } from '../middleware/errorHandler';
import { OptimisticLockVersionMismatchError } from 'typeorm';
import { PaginatedResult } from '../types/common';

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  version?: number;
}

export { PaginatedResult };

export class CustomerService {
  private repository = AppDataSource.getRepository(Customer);
  private vehicleOwnerRepository = AppDataSource.getRepository(VehicleOwner);

  async findAll(
    page: number = 1,
    limit: number = 50,
    search?: string
  ): Promise<PaginatedResult<Customer>> {
    const queryBuilder = this.repository.createQueryBuilder('customer');

    if (search) {
      // Normalize search term: remove common phone formatting characters for phone number search
      const normalizedSearch = search.replace(/[\s\-\(\)]/g, '');
      const searchPattern = `%${search}%`;
      const normalizedPattern = `%${normalizedSearch}%`;
      
      // Use nested REPLACE to remove formatting from phone numbers for comparison
      queryBuilder.where(
        '(customer.name ILIKE :search OR customer.email ILIKE :search OR customer.code ILIKE :search) OR (customer.phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(REPLACE(customer.phone, \' \', \'\'), \'-\', \'\'), \'(\', \'\'), \')\', \'\') LIKE :normalizedSearch)',
        { search: searchPattern, normalizedSearch: normalizedPattern }
      );
    }

    const [data, total] = await queryBuilder
      .orderBy('customer.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Customer> {
    const customer = await this.repository.findOne({
      where: { id },
      relations: ['vehicles'],
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return customer;
  }

  async findByCode(code: string): Promise<Customer> {
    const customer = await this.repository.findOne({
      where: { code },
      relations: ['vehicles'],
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return customer;
  }

  async create(data: CreateCustomerDto): Promise<Customer> {
    const normalizedEmail = data.email?.trim().toLowerCase() || undefined;
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const repository = queryRunner.manager.getRepository(Customer);
      if (normalizedEmail) {
        const existing = await repository
          .createQueryBuilder('customer')
          .where('LOWER(customer.email) = :email', { email: normalizedEmail })
          .getOne();
        if (existing) {
          throw new ConflictError('Customer with this email already exists');
        }
      }

      const cleanName = data.name.replace(/[^a-zA-Z]/g, '').toUpperCase();
      const namePrefix = cleanName.substring(0, 5).padEnd(5, 'X');
      const fullPrefix = `C${namePrefix}`;

      await queryRunner.query(
        'SELECT pg_advisory_xact_lock(hashtext($1))',
        [`customer_code_${fullPrefix}`],
      );
      const result = await queryRunner.query(
        `
          SELECT code FROM customers
          WHERE code LIKE $1
          ORDER BY code DESC
          LIMIT 1
        `,
        [`${fullPrefix}%`],
      );

      let nextNumber = 1;
      if (result.length > 0) {
        const lastCode = result[0].code as string;
        const lastNumber = Number.parseInt(lastCode.substring(6), 10);
        if (!Number.isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      const code = `${fullPrefix}${nextNumber.toString().padStart(3, '0')}`;

      const customer = repository.create({
        ...data,
        email: normalizedEmail ?? null,
        code,
      });

      const saved = await repository.save(customer);
      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, data: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findById(id);

    // Check version if provided
    if (data.version !== undefined && data.version !== customer.version) {
      throw new VersionConflictError(
        'This customer has been modified by another user. Please refresh and try again.'
      );
    }

    if (data.email !== undefined) {
      const normalizedEmail = data.email?.trim().toLowerCase() || undefined;
      const existingEmail = customer.email?.toLowerCase() || undefined;
      if (normalizedEmail && normalizedEmail !== existingEmail) {
        const existing = await this.repository
          .createQueryBuilder('customer')
          .where('LOWER(customer.email) = :email', { email: normalizedEmail })
          .getOne();
        if (existing) {
          throw new ConflictError('Customer with this email already exists');
        }
      }
      data.email = normalizedEmail;
    }

    Object.assign(customer, data);
    
    try {
      return await this.repository.save(customer);
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new VersionConflictError(
          'This customer has been modified by another user. Please refresh and try again.'
        );
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const customer = await this.findById(id);
    
    // Check if customer is an owner of any vehicles
    const vehicleOwnerCount = await this.vehicleOwnerRepository.count({
      where: { customerId: id },
    });

    if (vehicleOwnerCount > 0) {
      throw new ConflictError('Cannot delete customer who owns vehicles. Remove vehicle ownership first.');
    }

    await this.repository.remove(customer);
  }
}

