import { AppDataSource } from '../config/database';
import { Customer } from '../models/Customer';
import { VehicleOwner } from '../models/VehicleOwner';
import { generateCustomerCode } from '../utils/codeGenerator';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';
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
    // Check for duplicate email if provided
    if (data.email) {
      const existing = await this.repository.findOne({
        where: { email: data.email },
      });
      if (existing) {
        throw new ConflictError('Customer with this email already exists');
      }
    }

    const code = await generateCustomerCode(data.name);
    
    const customer = this.repository.create({
      ...data,
      code,
    });

    return this.repository.save(customer);
  }

  async update(id: string, data: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findById(id);

    // Check for duplicate email if being updated
    if (data.email && data.email !== customer.email) {
      const existing = await this.repository.findOne({
        where: { email: data.email },
      });
      if (existing) {
        throw new ConflictError('Customer with this email already exists');
      }
    }

    Object.assign(customer, data);
    return this.repository.save(customer);
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

