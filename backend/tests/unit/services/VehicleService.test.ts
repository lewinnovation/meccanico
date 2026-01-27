import { VehicleService, CreateVehicleDto, CreateVehicleBulkDto, UpdateVehicleDto } from '../../../src/services/VehicleService';
import { Vehicle } from '../../../src/models/Vehicle';
import { Customer } from '../../../src/models/Customer';
import { NotFoundError, ConflictError, VersionConflictError, BadRequestError } from '../../../src/middleware/errorHandler';
import { OptimisticLockVersionMismatchError } from 'typeorm';

// Mock the database
jest.mock('../../../src/config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    query: jest.fn(),
  },
}));

// Mock code generator
jest.mock('../../../src/utils/codeGenerator', () => ({
  generateCode: jest.fn().mockResolvedValue('V001'),
  CODE_PREFIXES: { VEHICLE: 'V' },
}));

import { AppDataSource } from '../../../src/config/database';

describe('VehicleService', () => {
  let vehicleService: VehicleService;
  let mockVehicleRepository: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let mockCustomerRepository: {
    findOne: jest.Mock;
    find: jest.Mock;
  };
  let mockVehicleOwnerRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    count: jest.Mock;
    remove: jest.Mock;
  };
  let mockAuditLogRepository: {
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(() => {
    mockVehicleRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((data) => ({ ...data })),
      save: jest.fn((data) => Promise.resolve({ id: 'test-id', ...data })),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockCustomerRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    mockVehicleOwnerRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((data) => ({ ...data })),
      save: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      remove: jest.fn(),
    };

    mockAuditLogRepository = {
      create: jest.fn((data) => ({ ...data })),
      save: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === Vehicle) return mockVehicleRepository;
      if (entity === Customer) return mockCustomerRepository;
      if (entity.name === 'VehicleOwner') return mockVehicleOwnerRepository;
      if (entity.name === 'AuditLog') return mockAuditLogRepository;
      return {};
    });

    vehicleService = new VehicleService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated vehicles without search', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [{ id: '1', make: 'Toyota', model: 'Camry' }],
          1,
        ]),
      };
      mockVehicleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await vehicleService.findAll(1, 50);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
    });

    it('should return paginated vehicles with search', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [{ id: '1', make: 'Toyota', model: 'Camry' }],
          1,
        ]),
      };
      mockVehicleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await vehicleService.findAll(1, 50, 'Toyota');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
    });

    it('should filter by customerId', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      mockVehicleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await vehicleService.findAll(1, 50, undefined, 'customer-123');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'owner.id = :customerId',
        { customerId: 'customer-123' }
      );
    });
  });

  describe('findById', () => {
    it('should return vehicle when found', async () => {
      const mockVehicle = {
        id: 'test-id',
        code: 'V001',
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
      };
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);

      const result = await vehicleService.findById('test-id');

      expect(result).toEqual(mockVehicle);
      expect(mockVehicleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        relations: ['vehicleOwners', 'vehicleOwners.customer', 'jobs'],
      });
    });

    it('should throw NotFoundError when vehicle not found', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(null);

      await expect(vehicleService.findById('non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('findByCode', () => {
    it('should return vehicle when found by code', async () => {
      const mockVehicle = {
        id: 'test-id',
        code: 'V001',
        make: 'Honda',
        model: 'Civic',
      };
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);

      const result = await vehicleService.findByCode('V001');

      expect(result).toEqual(mockVehicle);
      expect(mockVehicleRepository.findOne).toHaveBeenCalledWith({
        where: { code: 'V001' },
        relations: ['vehicleOwners', 'vehicleOwners.customer', 'jobs'],
      });
    });

    it('should throw NotFoundError when vehicle code not found', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(null);

      await expect(vehicleService.findByCode('V999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('findByCustomerId', () => {
    it('should return vehicles for customer', async () => {
      const mockVehicles = [
        { id: '1', make: 'Toyota', model: 'Camry', vehicleOwners: [] },
        { id: '2', make: 'Honda', model: 'Civic', vehicleOwners: [] },
      ];
      mockVehicleOwnerRepository.find.mockResolvedValue([
        { vehicle: mockVehicles[0] },
        { vehicle: mockVehicles[1] },
      ]);

      const result = await vehicleService.findByCustomerId('customer-123');

      expect(result).toEqual(mockVehicles);
      expect(mockVehicleOwnerRepository.find).toHaveBeenCalledWith({
        where: { customerId: 'customer-123' },
        relations: ['vehicle', 'vehicle.vehicleOwners', 'vehicle.vehicleOwners.customer'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('create', () => {
    it('should create vehicle with generated code', async () => {
      const createDto: CreateVehicleDto = {
        customerIds: ['customer-123'],
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
      };

      mockCustomerRepository.find.mockResolvedValue([{ id: 'customer-123', name: 'John' }]);
      mockVehicleRepository.findOne.mockResolvedValue({
        id: 'new-id',
        code: 'V001',
        make: 'Toyota',
        model: 'Camry',
        vehicleOwners: [],
        jobs: [],
      });
      mockVehicleRepository.create.mockReturnValue({ ...createDto, code: 'V001' });
      mockVehicleRepository.save.mockResolvedValue({ id: 'new-id', ...createDto, code: 'V001' });
      mockVehicleOwnerRepository.save.mockResolvedValue([]);

      const result = await vehicleService.create(createDto);

      expect(result.code).toBe('V001');
      expect(result.make).toBe('Toyota');
      expect(result.model).toBe('Camry');
    });

    it('should throw NotFoundError when customer does not exist', async () => {
      const createDto: CreateVehicleDto = {
        customerIds: ['non-existent'],
        make: 'Toyota',
        model: 'Camry',
      };

      mockCustomerRepository.find.mockResolvedValue([]);

      await expect(vehicleService.create(createDto)).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError for duplicate VIN', async () => {
      const createDto: CreateVehicleDto = {
        customerIds: ['customer-123'],
        make: 'Toyota',
        model: 'Camry',
        vin: 'ABC123456789DEF01',
      };

      mockCustomerRepository.find.mockResolvedValue([{ id: 'customer-123' }]);
      mockVehicleRepository.findOne.mockResolvedValue({ id: 'existing', vin: 'ABC123456789DEF01' });

      await expect(vehicleService.create(createDto)).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError for duplicate license plate', async () => {
      const createDto: CreateVehicleDto = {
        customerIds: ['customer-123'],
        make: 'Toyota',
        model: 'Camry',
        vin: undefined, // No VIN to check
        licensePlate: 'ABC123',
      };

      mockCustomerRepository.find.mockResolvedValue([{ id: 'customer-123' }]);
      // Only licensePlate check happens since no VIN
      mockVehicleRepository.findOne.mockResolvedValue({ id: 'existing', licensePlate: 'ABC123' });

      await expect(vehicleService.create(createDto)).rejects.toThrow(ConflictError);
    });
  });

  describe('update', () => {
    it('should update vehicle fields', async () => {
      const existingVehicle = {
        id: 'test-id',
        code: 'V001',
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
        vin: null,
        licensePlate: null,
        version: 0,
        jobs: [],
      };
      mockVehicleRepository.findOne.mockResolvedValue(existingVehicle);
      mockVehicleRepository.save.mockResolvedValue({
        ...existingVehicle,
        year: 2024,
        color: 'Blue',
      });

      const updateDto: UpdateVehicleDto = { year: 2024, color: 'Blue' };
      const result = await vehicleService.update('test-id', updateDto);

      expect(result.year).toBe(2024);
      expect(result.color).toBe('Blue');
    });

    it('should throw NotFoundError when vehicle to update not found', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(null);

      await expect(vehicleService.update('non-existent', { make: 'Honda' })).rejects.toThrow(NotFoundError);
    });

    it('should throw VersionConflictError when version mismatch', async () => {
      const existingVehicle = {
        id: 'test-id',
        code: 'V001',
        make: 'Toyota',
        model: 'Camry',
        version: 1,
        jobs: [],
      };
      mockVehicleRepository.findOne.mockResolvedValue(existingVehicle);

      await expect(vehicleService.update('test-id', { make: 'Honda', version: 0 }))
        .rejects
        .toThrow(VersionConflictError);
    });

    it('should handle OptimisticLockVersionMismatchError from TypeORM', async () => {
      const existingVehicle = {
        id: 'test-id',
        code: 'V001',
        make: 'Toyota',
        model: 'Camry',
        version: 0,
        jobs: [],
      };
      mockVehicleRepository.findOne.mockResolvedValue(existingVehicle);
      mockVehicleRepository.save.mockRejectedValue(new OptimisticLockVersionMismatchError('Vehicle', 1, 2));

      await expect(vehicleService.update('test-id', { make: 'Honda' }))
        .rejects
        .toThrow(VersionConflictError);
    });

    it('should throw ConflictError when updating to existing VIN', async () => {
      const existingVehicle = {
        id: 'test-id',
        code: 'V001',
        make: 'Toyota',
        model: 'Camry',
        vin: 'OLD123456789DEF01',
        licensePlate: null,
        version: 0,
        jobs: [],
      };
      mockVehicleRepository.findOne
        .mockResolvedValueOnce(existingVehicle) // findById
        .mockResolvedValueOnce({ id: 'other', vin: 'NEW123456789DEF01' }); // VIN check

      await expect(
        vehicleService.update('test-id', { vin: 'NEW123456789DEF01' })
      ).rejects.toThrow(ConflictError);
    });

    it('should allow updating to same VIN', async () => {
      const existingVehicle = {
        id: 'test-id',
        code: 'V001',
        make: 'Toyota',
        model: 'Camry',
        vin: 'ABC123456789DEF01',
        licensePlate: null,
        jobs: [],
      };
      mockVehicleRepository.findOne.mockResolvedValue(existingVehicle);
      mockVehicleRepository.save.mockResolvedValue(existingVehicle);

      const result = await vehicleService.update('test-id', { vin: 'ABC123456789DEF01' });

      expect(result.vin).toBe('ABC123456789DEF01');
    });
  });

  describe('updateOdometer', () => {
    it('should update vehicle odometer', async () => {
      const existingVehicle = {
        id: 'test-id',
        code: 'V001',
        make: 'Toyota',
        model: 'Camry',
        odometer: 50000,
        jobs: [],
      };
      mockVehicleRepository.findOne.mockResolvedValue(existingVehicle);
      mockVehicleRepository.save.mockResolvedValue({ ...existingVehicle, odometer: 55000 });

      const result = await vehicleService.updateOdometer('test-id', 55000);

      expect(result.odometer).toBe(55000);
    });
  });

  describe('delete', () => {
    it('should delete vehicle without jobs', async () => {
      const mockVehicle = {
        id: 'test-id',
        code: 'V001',
        make: 'Toyota',
        model: 'Camry',
        jobs: [],
      };
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);
      mockVehicleRepository.remove.mockResolvedValue(mockVehicle);

      await vehicleService.delete('test-id');

      expect(mockVehicleRepository.remove).toHaveBeenCalledWith(mockVehicle);
    });

    it('should throw NotFoundError when vehicle to delete not found', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(null);

      await expect(vehicleService.delete('non-existent')).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when vehicle has jobs', async () => {
      const mockVehicle = {
        id: 'test-id',
        code: 'V001',
        make: 'Toyota',
        model: 'Camry',
        jobs: [{ id: 'job-1' }],
      };
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);

      await expect(vehicleService.delete('test-id')).rejects.toThrow(ConflictError);
    });
  });

  describe('createBulk', () => {
    it('should throw BadRequestError when items array is empty', async () => {
      await expect(vehicleService.createBulk([]))
        .rejects
        .toThrow(BadRequestError);
    });

    it('should throw BadRequestError when more than 100 items', async () => {
      const items = Array(101).fill({ customerIds: ['customer-1'], make: 'Toyota', model: 'Camry' });
      await expect(vehicleService.createBulk(items))
        .rejects
        .toThrow('Cannot create more than 100 vehicles at once');
    });
  });

});

