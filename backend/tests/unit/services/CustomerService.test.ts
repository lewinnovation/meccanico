import { CustomerService, CreateCustomerDto, UpdateCustomerDto } from '../../../src/services/CustomerService';
import { Customer } from '../../../src/models/Customer';
import { NotFoundError, ConflictError } from '../../../src/middleware/errorHandler';
import { generateCustomerCode } from '../../../src/utils/codeGenerator';

// Mock dependencies
jest.mock('../../../src/utils/codeGenerator');
jest.mock('../../../src/config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    query: jest.fn(),
  },
}));

const mockGenerateCustomerCode = generateCustomerCode as jest.Mock;

describe('CustomerService', () => {
  let customerService: CustomerService;
  let mockRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock repository
    mockRepository = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    // Mock AppDataSource.getRepository
    const { AppDataSource } = require('../../../src/config/database');
    AppDataSource.getRepository.mockReturnValue(mockRepository);

    customerService = new CustomerService();
  });

  describe('findAll', () => {
    it('should return paginated customers without search', async () => {
      const mockCustomers = [
        { id: '1', code: 'CJOHNS001', name: 'John Smith' },
        { id: '2', code: 'CALIC001', name: 'Alice Brown' },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockCustomers, 2]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await customerService.findAll(1, 50);

      expect(result).toEqual({
        data: mockCustomers,
        total: 2,
        page: 1,
        limit: 50,
      });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('customer.createdAt', 'DESC');
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(50);
    });

    it('should return paginated customers with search', async () => {
      const mockCustomers = [{ id: '1', code: 'CJOHNS001', name: 'John Smith' }];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockCustomers, 1]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await customerService.findAll(1, 50, 'john');

      expect(result.data).toEqual(mockCustomers);
      expect(result.total).toBe(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'customer.name ILIKE :search OR customer.email ILIKE :search OR customer.phone ILIKE :search OR customer.code ILIKE :search',
        { search: '%john%' }
      );
    });

    it('should handle pagination correctly', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 100]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await customerService.findAll(3, 20);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(40); // (3-1) * 20
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });

    it('should use default pagination values', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await customerService.findAll();

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(50);
    });
  });

  describe('findById', () => {
    it('should return customer when found', async () => {
      const mockCustomer = {
        id: '123',
        code: 'CJOHNS001',
        name: 'John Smith',
        email: 'john@example.com',
        vehicles: [],
      };
      mockRepository.findOne.mockResolvedValue(mockCustomer);

      const result = await customerService.findById('123');

      expect(result).toEqual(mockCustomer);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
        relations: ['vehicles'],
      });
    });

    it('should throw NotFoundError when customer not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(customerService.findById('nonexistent'))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should throw NotFoundError with correct message', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(customerService.findById('123'))
        .rejects
        .toThrow('Customer not found');
    });
  });

  describe('findByCode', () => {
    it('should return customer when found by code', async () => {
      const mockCustomer = {
        id: '123',
        code: 'CJOHNS001',
        name: 'John Smith',
        vehicles: [],
      };
      mockRepository.findOne.mockResolvedValue(mockCustomer);

      const result = await customerService.findByCode('CJOHNS001');

      expect(result).toEqual(mockCustomer);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { code: 'CJOHNS001' },
        relations: ['vehicles'],
      });
    });

    it('should throw NotFoundError when customer code not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(customerService.findByCode('CNONEX001'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    const createDto: CreateCustomerDto = {
      name: 'John Smith',
      email: 'john@example.com',
      phone: '555-1234',
    };

    it('should create customer with generated code', async () => {
      mockGenerateCustomerCode.mockResolvedValue('CJOHNS001');
      mockRepository.findOne.mockResolvedValue(null); // No existing customer with email
      mockRepository.create.mockReturnValue({ ...createDto, code: 'CJOHNS001' });
      mockRepository.save.mockResolvedValue({ 
        id: '123', 
        ...createDto, 
        code: 'CJOHNS001' 
      });

      const result = await customerService.create(createDto);

      expect(mockGenerateCustomerCode).toHaveBeenCalledWith('John Smith');
      expect(result.code).toBe('CJOHNS001');
      expect(result.name).toBe('John Smith');
    });

    it('should throw ConflictError for duplicate email', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 'existing', email: 'john@example.com' });

      await expect(customerService.create(createDto))
        .rejects
        .toThrow(ConflictError);
    });

    it('should throw ConflictError with correct message', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 'existing', email: 'john@example.com' });

      await expect(customerService.create(createDto))
        .rejects
        .toThrow('Customer with this email already exists');
    });

    it('should create customer without email (no duplicate check)', async () => {
      const dtoWithoutEmail: CreateCustomerDto = {
        name: 'John Smith',
        phone: '555-1234',
      };
      mockGenerateCustomerCode.mockResolvedValue('CJOHNS001');
      mockRepository.create.mockReturnValue({ ...dtoWithoutEmail, code: 'CJOHNS001' });
      mockRepository.save.mockResolvedValue({ 
        id: '123', 
        ...dtoWithoutEmail, 
        code: 'CJOHNS001' 
      });

      const result = await customerService.create(dtoWithoutEmail);

      expect(mockRepository.findOne).not.toHaveBeenCalled();
      expect(result.code).toBe('CJOHNS001');
    });

    it('should create customer with all optional fields', async () => {
      const fullDto: CreateCustomerDto = {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '555-1234',
        address: '123 Main St',
        notes: 'VIP customer',
      };
      mockGenerateCustomerCode.mockResolvedValue('CJOHNS001');
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ ...fullDto, code: 'CJOHNS001' });
      mockRepository.save.mockResolvedValue({ id: '123', ...fullDto, code: 'CJOHNS001' });

      const result = await customerService.create(fullDto);

      expect(result.address).toBe('123 Main St');
      expect(result.notes).toBe('VIP customer');
    });
  });

  describe('update', () => {
    const existingCustomer = {
      id: '123',
      code: 'CJOHNS001',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '555-1234',
      vehicles: [],
    };

    it('should update customer fields', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(existingCustomer) // findById
        .mockResolvedValueOnce(null); // email check
      mockRepository.save.mockImplementation((customer: any) => Promise.resolve(customer));

      const updateDto: UpdateCustomerDto = { name: 'John Updated' };
      const result = await customerService.update('123', updateDto);

      expect(result.name).toBe('John Updated');
    });

    it('should throw NotFoundError when customer to update not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(customerService.update('nonexistent', { name: 'Test' }))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should throw ConflictError when updating to existing email', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(existingCustomer) // findById
        .mockResolvedValueOnce({ id: 'other', email: 'other@example.com' }); // email check

      await expect(customerService.update('123', { email: 'other@example.com' }))
        .rejects
        .toThrow(ConflictError);
    });

    it('should allow updating to same email', async () => {
      mockRepository.findOne.mockResolvedValue(existingCustomer);
      mockRepository.save.mockImplementation((customer: any) => Promise.resolve(customer));

      const result = await customerService.update('123', { email: 'john@example.com' });

      expect(result.email).toBe('john@example.com');
    });

    it('should update multiple fields at once', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(existingCustomer)
        .mockResolvedValueOnce(null);
      mockRepository.save.mockImplementation((customer: any) => Promise.resolve(customer));

      const updateDto: UpdateCustomerDto = {
        name: 'John Updated',
        phone: '555-9999',
        notes: 'Updated notes',
      };
      const result = await customerService.update('123', updateDto);

      expect(result.name).toBe('John Updated');
      expect(result.phone).toBe('555-9999');
      expect(result.notes).toBe('Updated notes');
    });
  });

  describe('delete', () => {
    it('should delete customer without vehicles', async () => {
      const customerWithoutVehicles = {
        id: '123',
        code: 'CJOHNS001',
        name: 'John Smith',
        vehicles: [],
      };
      mockRepository.findOne.mockResolvedValue(customerWithoutVehicles);
      mockRepository.remove.mockResolvedValue(customerWithoutVehicles);

      await customerService.delete('123');

      expect(mockRepository.remove).toHaveBeenCalledWith(customerWithoutVehicles);
    });

    it('should throw NotFoundError when customer to delete not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(customerService.delete('nonexistent'))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should throw ConflictError when customer has vehicles', async () => {
      const customerWithVehicles = {
        id: '123',
        code: 'CJOHNS001',
        name: 'John Smith',
        vehicles: [{ id: 'v1', make: 'Toyota' }],
      };
      mockRepository.findOne.mockResolvedValue(customerWithVehicles);

      await expect(customerService.delete('123'))
        .rejects
        .toThrow(ConflictError);
    });

    it('should throw ConflictError with correct message for vehicles', async () => {
      const customerWithVehicles = {
        id: '123',
        code: 'CJOHNS001',
        name: 'John Smith',
        vehicles: [{ id: 'v1' }],
      };
      mockRepository.findOne.mockResolvedValue(customerWithVehicles);

      await expect(customerService.delete('123'))
        .rejects
        .toThrow('Cannot delete customer with vehicles. Remove vehicles first.');
    });
  });
});

