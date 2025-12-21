import { AppDataSource } from '../config/database';
import { Vehicle } from '../models/Vehicle';
import { Customer } from '../models/Customer';
import { VehicleOwner } from '../models/VehicleOwner';
import { generateCode, CODE_PREFIXES } from '../utils/codeGenerator';
import { NotFoundError, ConflictError, BadRequestError, VersionConflictError } from '../middleware/errorHandler';
import { OptimisticLockVersionMismatchError } from 'typeorm';
import { PaginatedResult } from '../types/common';
import { In } from 'typeorm';

export interface CreateVehicleDto {
  customerIds: string[];
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
  version?: number;
}

export class VehicleService {
  private vehicleRepository = AppDataSource.getRepository(Vehicle);
  private customerRepository = AppDataSource.getRepository(Customer);
  private vehicleOwnerRepository = AppDataSource.getRepository(VehicleOwner);

  async findAll(
    page: number = 1,
    limit: number = 50,
    search?: string,
    customerId?: string
  ): Promise<PaginatedResult<Vehicle>> {
    const queryBuilder = this.vehicleRepository.createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.vehicleOwners', 'vehicleOwner')
      .leftJoinAndSelect('vehicleOwner.customer', 'owner');

    if (search) {
      // Normalize search term: remove common formatting characters for flexible matching
      const normalizedSearch = search.replace(/[\s\-\(\)]/g, '');
      const searchPattern = `%${search}%`;
      const normalizedPattern = `%${normalizedSearch}%`;
      
      queryBuilder.andWhere(
        '(vehicle.make ILIKE :search OR vehicle.model ILIKE :search OR vehicle.vin ILIKE :search OR vehicle.code ILIKE :search OR owner.name ILIKE :search) OR (vehicle.licensePlate IS NOT NULL AND UPPER(REPLACE(REPLACE(TRIM(vehicle.licensePlate), \' \', \'\'), \'-\', \'\')) LIKE UPPER(:normalizedSearch))',
        { search: searchPattern, normalizedSearch: normalizedPattern }
      );
    }

    if (customerId) {
      queryBuilder.andWhere('owner.id = :customerId', { customerId });
    }

    const [data, total] = await queryBuilder
      .orderBy('vehicle.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Load owners for each vehicle
    for (const vehicle of data) {
      vehicle.owners = vehicle.vehicleOwners?.map(vo => vo.customer) || [];
    }

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['vehicleOwners', 'vehicleOwners.customer', 'jobs'],
    });

    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    // Populate owners array
    vehicle.owners = vehicle.vehicleOwners?.map(vo => vo.customer) || [];

    return vehicle;
  }

  async findByCode(code: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { code },
      relations: ['vehicleOwners', 'vehicleOwners.customer', 'jobs'],
    });

    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    // Populate owners array
    vehicle.owners = vehicle.vehicleOwners?.map(vo => vo.customer) || [];

    return vehicle;
  }

  async findByCustomerId(customerId: string): Promise<Vehicle[]> {
    const vehicleOwners = await this.vehicleOwnerRepository.find({
      where: { customerId },
      relations: ['vehicle', 'vehicle.vehicleOwners', 'vehicle.vehicleOwners.customer'],
      order: { createdAt: 'DESC' },
    });

    const vehicles = vehicleOwners.map(vo => vo.vehicle);
    
    // Populate owners for each vehicle
    for (const vehicle of vehicles) {
      vehicle.owners = vehicle.vehicleOwners?.map(vo => vo.customer) || [];
    }

    return vehicles;
  }

  async findByLicensePlate(licensePlate: string): Promise<Vehicle> {
    // Normalize: trim, uppercase, and remove spaces/hyphens for flexible matching
    const normalizedPlate = licensePlate.trim().toUpperCase().replace(/[\s-]/g, '');
    const vehicle = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.vehicleOwners', 'vehicleOwner')
      .leftJoinAndSelect('vehicleOwner.customer', 'owner')
      .where('vehicle.licensePlate IS NOT NULL')
      .andWhere('UPPER(REPLACE(REPLACE(TRIM(vehicle.licensePlate), \' \', \'\'), \'-\', \'\')) = :plate', { plate: normalizedPlate })
      .getOne();

    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    // Populate owners array
    vehicle.owners = vehicle.vehicleOwners?.map(vo => vo.customer) || [];

    return vehicle;
  }

  async findByVin(vin: string): Promise<Vehicle> {
    const normalizedVin = vin.trim().toUpperCase();
    const vehicle = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.vehicleOwners', 'vehicleOwner')
      .leftJoinAndSelect('vehicleOwner.customer', 'owner')
      .where('UPPER(vehicle.vin) = :vin', { vin: normalizedVin })
      .getOne();

    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    // Populate owners array
    vehicle.owners = vehicle.vehicleOwners?.map(vo => vo.customer) || [];

    return vehicle;
  }

  async create(data: CreateVehicleDto): Promise<Vehicle> {
    if (!data.customerIds || data.customerIds.length === 0) {
      throw new BadRequestError('At least one customer must be specified');
    }

    // Verify all customers exist
    const customers = await this.customerRepository.find({
      where: { id: In(data.customerIds) },
    });
    if (customers.length !== data.customerIds.length) {
      throw new NotFoundError('One or more customers not found');
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

    // Create vehicle without customerId
    const { customerIds, ...vehicleData } = data;
    const vehicle = this.vehicleRepository.create({
      ...vehicleData,
      code,
    });

    const savedVehicle = await this.vehicleRepository.save(vehicle);

    // Create VehicleOwner records
    const vehicleOwners = customerIds.map((customerId, index) => {
      return this.vehicleOwnerRepository.create({
        vehicleId: savedVehicle.id,
        customerId,
        isPrimary: index === 0, // First customer is primary
      });
    });

    await this.vehicleOwnerRepository.save(vehicleOwners);

    // Load and return vehicle with owners
    return this.findById(savedVehicle.id);
  }

  async update(id: string, data: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findById(id);

    // Check version if provided
    if (data.version !== undefined && data.version !== vehicle.version) {
      throw new VersionConflictError(
        'This vehicle has been modified by another user. Please refresh and try again.'
      );
    }

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
    
    try {
      return await this.vehicleRepository.save(vehicle);
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new VersionConflictError(
          'This vehicle has been modified by another user. Please refresh and try again.'
        );
      }
      throw error;
    }
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

  async addOwner(vehicleId: string, customerId: string, isPrimary: boolean = false): Promise<Vehicle> {
    const vehicle = await this.findById(vehicleId);

    // Verify customer exists
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Check if owner already exists
    const existingOwner = await this.vehicleOwnerRepository.findOne({
      where: { vehicleId, customerId },
    });

    if (existingOwner) {
      throw new ConflictError('Customer is already an owner of this vehicle');
    }

    // If setting as primary, unset other primary owners
    if (isPrimary) {
      await this.vehicleOwnerRepository.update(
        { vehicleId },
        { isPrimary: false }
      );
    }

    // Create new owner record
    const vehicleOwner = this.vehicleOwnerRepository.create({
      vehicleId,
      customerId,
      isPrimary,
    });

    await this.vehicleOwnerRepository.save(vehicleOwner);

    return this.findById(vehicleId);
  }

  async removeOwner(vehicleId: string, customerId: string): Promise<Vehicle> {
    const vehicle = await this.findById(vehicleId);

    // Check if this is the only owner
    const ownerCount = await this.vehicleOwnerRepository.count({
      where: { vehicleId },
    });

    if (ownerCount <= 1) {
      throw new ConflictError('Cannot remove the last owner. A vehicle must have at least one owner.');
    }

    // Find and remove the owner
    const vehicleOwner = await this.vehicleOwnerRepository.findOne({
      where: { vehicleId, customerId },
    });

    if (!vehicleOwner) {
      throw new NotFoundError('Customer is not an owner of this vehicle');
    }

    await this.vehicleOwnerRepository.remove(vehicleOwner);

    // If the removed owner was primary, set the first remaining owner as primary
    if (vehicleOwner.isPrimary) {
      const remainingOwners = await this.vehicleOwnerRepository.find({
        where: { vehicleId },
        order: { createdAt: 'ASC' },
      });

      if (remainingOwners.length > 0) {
        remainingOwners[0].isPrimary = true;
        await this.vehicleOwnerRepository.save(remainingOwners[0]);
      }
    }

    return this.findById(vehicleId);
  }

  async setPrimaryOwner(vehicleId: string, customerId: string): Promise<Vehicle> {
    const vehicle = await this.findById(vehicleId);

    // Verify customer is an owner
    const vehicleOwner = await this.vehicleOwnerRepository.findOne({
      where: { vehicleId, customerId },
    });

    if (!vehicleOwner) {
      throw new NotFoundError('Customer is not an owner of this vehicle');
    }

    // Unset all primary owners
    await this.vehicleOwnerRepository.update(
      { vehicleId },
      { isPrimary: false }
    );

    // Set this owner as primary
    vehicleOwner.isPrimary = true;
    await this.vehicleOwnerRepository.save(vehicleOwner);

    return this.findById(vehicleId);
  }
}

