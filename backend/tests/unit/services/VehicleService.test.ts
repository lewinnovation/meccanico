import { VehicleService, CreateVehicleDto, UpdateVehicleDto } from '../../../src/services/VehicleService';
import { Vehicle } from '../../../src/models/Vehicle';
import { Customer } from '../../../src/models/Customer';
import { NotFoundError, ConflictError } from '../../../src/middleware/errorHandler';

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
    };

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === Vehicle) return mockVehicleRepository;
      if (entity === Customer) return mockCustomerRepository;
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
        'vehicle.customerId = :customerId',
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
        relations: ['customer', 'jobs'],
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
        relations: ['customer', 'jobs'],
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
        { id: '1', make: 'Toyota', model: 'Camry' },
        { id: '2', make: 'Honda', model: 'Civic' },
      ];
      mockVehicleRepository.find.mockResolvedValue(mockVehicles);

      const result = await vehicleService.findByCustomerId('customer-123');

      expect(result).toEqual(mockVehicles);
      expect(mockVehicleRepository.find).toHaveBeenCalledWith({
        where: { customerId: 'customer-123' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('create', () => {
    it('should create vehicle with generated code', async () => {
      const createDto: CreateVehicleDto = {
        customerId: 'customer-123',
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
      };

      mockCustomerRepository.findOne.mockResolvedValue({ id: 'customer-123', name: 'John' });
      mockVehicleRepository.findOne.mockResolvedValue(null); // No duplicate VIN or plate
      mockVehicleRepository.create.mockReturnValue({ ...createDto, code: 'V001' });
      mockVehicleRepository.save.mockResolvedValue({ id: 'new-id', ...createDto, code: 'V001' });

      const result = await vehicleService.create(createDto);

      expect(result.code).toBe('V001');
      expect(result.make).toBe('Toyota');
      expect(result.model).toBe('Camry');
    });

    it('should throw NotFoundError when customer does not exist', async () => {
      const createDto: CreateVehicleDto = {
        customerId: 'non-existent',
        make: 'Toyota',
        model: 'Camry',
      };

      mockCustomerRepository.findOne.mockResolvedValue(null);

      await expect(vehicleService.create(createDto)).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError for duplicate VIN', async () => {
      const createDto: CreateVehicleDto = {
        customerId: 'customer-123',
        make: 'Toyota',
        model: 'Camry',
        vin: 'ABC123456789DEF01',
      };

      mockCustomerRepository.findOne.mockResolvedValue({ id: 'customer-123' });
      mockVehicleRepository.findOne.mockResolvedValue({ id: 'existing', vin: 'ABC123456789DEF01' });

      await expect(vehicleService.create(createDto)).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError for duplicate license plate', async () => {
      const createDto: CreateVehicleDto = {
        customerId: 'customer-123',
        make: 'Toyota',
        model: 'Camry',
        vin: undefined, // No VIN to check
        licensePlate: 'ABC123',
      };

      mockCustomerRepository.findOne.mockResolvedValue({ id: 'customer-123' });
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
      mockVehicleRepository.save.mockRejectedValue(new OptimisticLockVersionMismatchError('', ''));

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

  describe('updateMileage', () => {
    it('should update vehicle mileage', async () => {
      const existingVehicle = {
        id: 'test-id',
        code: 'V001',
        make: 'Toyota',
        model: 'Camry',
        mileage: 50000,
        jobs: [],
      };
      mockVehicleRepository.findOne.mockResolvedValue(existingVehicle);
      mockVehicleRepository.save.mockResolvedValue({ ...existingVehicle, mileage: 55000 });

      const result = await vehicleService.updateMileage('test-id', 55000);

      expect(result.mileage).toBe(55000);
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

  describe('transferToCustomer', () => {
    it('should transfer vehicle to new customer', async () => {
      const existingVehicle = {
        id: 'test-id',
        code: 'V001',
        make: 'Toyota',
        model: 'Camry',
        customerId: 'old-customer',
        jobs: [],
      };
      mockVehicleRepository.findOne.mockResolvedValue(existingVehicle);
      mockCustomerRepository.findOne.mockResolvedValue({ id: 'new-customer', name: 'Jane' });
      mockVehicleRepository.save.mockResolvedValue({ ...existingVehicle, customerId: 'new-customer' });

      const result = await vehicleService.transferToCustomer('test-id', 'new-customer');

      expect(result.customerId).toBe('new-customer');
    });

    it('should throw NotFoundError when new customer not found', async () => {
      const existingVehicle = {
        id: 'test-id',
        code: 'V001',
        make: 'Toyota',
        model: 'Camry',
        customerId: 'old-customer',
        jobs: [],
      };
      mockVehicleRepository.findOne.mockResolvedValue(existingVehicle);
      mockCustomerRepository.findOne.mockResolvedValue(null);

      await expect(
        vehicleService.transferToCustomer('test-id', 'non-existent')
      ).rejects.toThrow(NotFoundError);
    });
  });
});

