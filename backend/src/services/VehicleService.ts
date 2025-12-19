import { AppDataSource } from '../config/database';
import { Vehicle } from '../models/Vehicle';
import { Customer } from '../models/Customer';
import { generateCode, CODE_PREFIXES } from '../utils/codeGenerator';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';
import { PaginatedResult } from '../types/common';

export interface CreateVehicleDto {
  customerId: string;
  make: string;
  model: string;
  year?: number;
  vin?: string;
  licensePlate?: string;
  color?: string;
  mileage?: number;
  notes?: string;
}

export interface UpdateVehicleDto {
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  licensePlate?: string;
  color?: string;
  mileage?: number;
  notes?: string;
}

export class VehicleService {
  private vehicleRepository = AppDataSource.getRepository(Vehicle);
  private customerRepository = AppDataSource.getRepository(Customer);

  async findAll(
    page: number = 1,
    limit: number = 50,
    search?: string,
    customerId?: string
  ): Promise<PaginatedResult<Vehicle>> {
    const queryBuilder = this.vehicleRepository.createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.customer', 'customer');

    if (search) {
      // Normalize search term: remove common formatting characters for flexible matching
      const normalizedSearch = search.replace(/[\s\-\(\)]/g, '');
      const searchPattern = `%${search}%`;
      const normalizedPattern = `%${normalizedSearch}%`;
      
      queryBuilder.andWhere(
        '(vehicle.make ILIKE :search OR vehicle.model ILIKE :search OR vehicle.vin ILIKE :search OR vehicle.code ILIKE :search) OR (vehicle.licensePlate IS NOT NULL AND UPPER(REPLACE(REPLACE(TRIM(vehicle.licensePlate), \' \', \'\'), \'-\', \'\')) LIKE UPPER(:normalizedSearch))',
        { search: searchPattern, normalizedSearch: normalizedPattern }
      );
    }

    if (customerId) {
      queryBuilder.andWhere('vehicle.customerId = :customerId', { customerId });
    }

    const [data, total] = await queryBuilder
      .orderBy('vehicle.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['customer', 'jobs'],
    });

    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    return vehicle;
  }

  async findByCode(code: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { code },
      relations: ['customer', 'jobs'],
    });

    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    return vehicle;
  }

  async findByCustomerId(customerId: string): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByLicensePlate(licensePlate: string): Promise<Vehicle> {
    // Normalize: trim, uppercase, and remove spaces/hyphens for flexible matching
    const normalizedPlate = licensePlate.trim().toUpperCase().replace(/[\s-]/g, '');
    const vehicle = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.customer', 'customer')
      .where('vehicle.licensePlate IS NOT NULL')
      .andWhere('UPPER(REPLACE(REPLACE(TRIM(vehicle.licensePlate), \' \', \'\'), \'-\', \'\')) = :plate', { plate: normalizedPlate })
      .getOne();

    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    return vehicle;
  }

  async findByVin(vin: string): Promise<Vehicle> {
    const normalizedVin = vin.trim().toUpperCase();
    const vehicle = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.customer', 'customer')
      .where('UPPER(vehicle.vin) = :vin', { vin: normalizedVin })
      .getOne();

    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    return vehicle;
  }

  async create(data: CreateVehicleDto): Promise<Vehicle> {
    // Verify customer exists
    const customer = await this.customerRepository.findOne({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Check for duplicate VIN if provided
    if (data.vin) {
      const existingVin = await this.vehicleRepository.findOne({
        where: { vin: data.vin },
      });
      if (existingVin) {
        throw new ConflictError('Vehicle with this VIN already exists');
      }
    }

    // Check for duplicate license plate if provided
    if (data.licensePlate) {
      const existingPlate = await this.vehicleRepository.findOne({
        where: { licensePlate: data.licensePlate },
      });
      if (existingPlate) {
        throw new ConflictError('Vehicle with this license plate already exists');
      }
    }

    const code = await generateCode('vehicles', CODE_PREFIXES.VEHICLE);

    const vehicle = this.vehicleRepository.create({
      ...data,
      code,
    });

    return this.vehicleRepository.save(vehicle);
  }

  async update(id: string, data: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findById(id);

    // Check for duplicate VIN if being updated
    if (data.vin && data.vin !== vehicle.vin) {
      const existing = await this.vehicleRepository.findOne({
        where: { vin: data.vin },
      });
      if (existing) {
        throw new ConflictError('Vehicle with this VIN already exists');
      }
    }

    // Check for duplicate license plate if being updated
    if (data.licensePlate && data.licensePlate !== vehicle.licensePlate) {
      const existing = await this.vehicleRepository.findOne({
        where: { licensePlate: data.licensePlate },
      });
      if (existing) {
        throw new ConflictError('Vehicle with this license plate already exists');
      }
    }

    Object.assign(vehicle, data);
    return this.vehicleRepository.save(vehicle);
  }

  async updateMileage(id: string, mileage: number): Promise<Vehicle> {
    const vehicle = await this.findById(id);
    vehicle.mileage = mileage;
    return this.vehicleRepository.save(vehicle);
  }

  async delete(id: string): Promise<void> {
    const vehicle = await this.findById(id);

    // Check if vehicle has jobs
    if (vehicle.jobs && vehicle.jobs.length > 0) {
      throw new ConflictError('Cannot delete vehicle with associated jobs');
    }

    await this.vehicleRepository.remove(vehicle);
  }

  async transferToCustomer(vehicleId: string, newCustomerId: string): Promise<Vehicle> {
    const vehicle = await this.findById(vehicleId);

    // Verify new customer exists
    const customer = await this.customerRepository.findOne({
      where: { id: newCustomerId },
    });

    if (!customer) {
      throw new NotFoundError('New customer not found');
    }

    vehicle.customerId = newCustomerId;
    return this.vehicleRepository.save(vehicle);
  }
}

