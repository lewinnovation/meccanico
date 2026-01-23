import {
  JobService,
  CreateJobDto,
  UpdateJobDto,
  CreateLineItemDto,
} from '../../../src/services/JobService';
import { Job, JobStatus } from '../../../src/models/Job';
import { LineItem, LineItemType } from '../../../src/models/LineItem';
import { NotFoundError, ConflictError, BadRequestError, VersionConflictError } from '../../../src/middleware/errorHandler';
import { OptimisticLockVersionMismatchError } from 'typeorm';
import { generateJobCode, CODE_PREFIXES } from '../../../src/utils/codeGenerator';

// Mock dependencies
jest.mock('../../../src/utils/codeGenerator');
jest.mock('../../../src/config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    query: jest.fn(),
  },
}));

const mockGenerateJobCode = generateJobCode as jest.Mock;

describe('JobService', () => {
  let jobService: JobService;
  let mockJobRepository: any;
  let mockLineItemRepository: any;
  let mockTemplateRepository: any;
  let mockVehicleRepository: any;
  let mockVehicleOwnerRepository: any;
  let mockOdometerReadingRepository: any;
  let mockAuditLogRepository: any;
  let mockInvoiceRepository: any;

  const mockJob: Partial<Job> = {
    id: 'job-1',
    code: 'J001',
    customerId: 'customer-1',
    vehicleId: 'vehicle-1',
    status: JobStatus.BOOKED,
    notes: 'Test notes',
    taxRate: 10,
    discountAmount: 0,
    discountPercent: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    lineItems: [],
    customer: { id: 'customer-1', name: 'Test Customer', code: 'CTEST001' } as any,
    vehicle: { id: 'vehicle-1', make: 'Toyota', model: 'Camry', customerId: 'customer-1' } as any,
  };

  const mockLineItem: Partial<LineItem> = {
    id: 'item-1',
    jobId: 'job-1',
    type: LineItemType.INVENTORY,
    description: 'Brake pads',
    quantity: 2,
    unitPrice: 50,
    sortOrder: 0,
    version: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockJobRepository = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    mockLineItemRepository = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };

    mockTemplateRepository = {
      findOne: jest.fn(),
    };

    mockVehicleRepository = {
      findOne: jest.fn(),
    };

    mockVehicleOwnerRepository = {
      findOne: jest.fn(),
      create: jest.fn((data) => ({ ...data })),
      save: jest.fn(),
    };

    mockOdometerReadingRepository = {
      create: jest.fn((data) => ({ ...data })),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    mockAuditLogRepository = {
      create: jest.fn((data) => ({ ...data })),
      save: jest.fn(),
    };

    mockInvoiceRepository = {
      delete: jest.fn(),
    };

    const { AppDataSource } = require('../../../src/config/database');
    AppDataSource.getRepository.mockImplementation((entity: any) => {
      if (entity.name === 'Job') return mockJobRepository;
      if (entity.name === 'LineItem') return mockLineItemRepository;
      if (entity.name === 'Template') return mockTemplateRepository;
      if (entity.name === 'Vehicle') return mockVehicleRepository;
      if (entity.name === 'VehicleOwner') return mockVehicleOwnerRepository;
      if (entity.name === 'VehicleOdometerReading') return mockOdometerReadingRepository;
      if (entity.name === 'AuditLog') return mockAuditLogRepository;
      if (entity.name === 'Invoice') return mockInvoiceRepository;
      return mockJobRepository;
    });

    jobService = new JobService();
  });

  describe('findAll', () => {
    it('should return paginated jobs without filters', async () => {
      const mockJobs = [mockJob];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockJobs, 1]),
      };
      mockJobRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await jobService.findAll(1, 50);

      expect(result).toEqual({
        data: mockJobs,
        total: 1,
        page: 1,
        limit: 50,
      });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('job.createdAt', 'DESC');
    });

    it('should filter by status', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      mockJobRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await jobService.findAll(1, 50, undefined, JobStatus.BOOKED);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('job.status = :status', {
        status: JobStatus.BOOKED,
      });
    });

    it('should filter by search term', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      mockJobRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await jobService.findAll(1, 50, 'toyota');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(job.code ILIKE :search OR customer.name ILIKE :search OR vehicle.make ILIKE :search OR vehicle.model ILIKE :search OR owner.name ILIKE :search)',
        { search: '%toyota%' }
      );
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
      mockJobRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await jobService.findAll(1, 50, undefined, undefined, 'customer-1');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('job.customerId = :customerId', {
        customerId: 'customer-1',
      });
    });
  });

  describe('findById', () => {
    it('should return a job when found', async () => {
      mockJobRepository.findOne.mockResolvedValue(mockJob);

      const result = await jobService.findById('job-1');

      expect(result).toEqual(mockJob);
      expect(mockJobRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        relations: ['customer', 'vehicle', 'assignee', 'lineItems', 'invoice'],
        order: { lineItems: { sortOrder: 'ASC' } },
      });
    });

    it('should throw NotFoundError when job not found', async () => {
      mockJobRepository.findOne.mockResolvedValue(null);

      await expect(jobService.findById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('findByCode', () => {
    it('should return a job when found by code', async () => {
      mockJobRepository.findOne.mockResolvedValue(mockJob);

      const result = await jobService.findByCode('J001');

      expect(result).toEqual(mockJob);
      expect(mockJobRepository.findOne).toHaveBeenCalledWith({
        where: { code: 'J001' },
        relations: ['customer', 'vehicle', 'assignee', 'lineItems', 'invoice'],
        order: { lineItems: { sortOrder: 'ASC' } },
      });
    });

    it('should throw NotFoundError when job not found by code', async () => {
      mockJobRepository.findOne.mockResolvedValue(null);

      await expect(jobService.findByCode('J999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    const createDto: CreateJobDto = {
      customerId: 'customer-1',
      vehicleId: 'vehicle-1',
      notes: 'Test notes',
    };

    it('should create a new job successfully', async () => {
      const mockVehicle = {
        id: 'vehicle-1',
        vehicleOwners: [{ customerId: 'customer-1', isPrimary: true }],
      };
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);
      mockGenerateJobCode.mockResolvedValue('J001');
      mockJobRepository.create.mockReturnValue(mockJob);
      mockJobRepository.save.mockResolvedValue(mockJob);
      mockJobRepository.findOne.mockResolvedValue(mockJob);

      const result = await jobService.create(createDto);

      expect(result).toEqual(mockJob);
      expect(mockVehicleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'vehicle-1' },
        relations: ['vehicleOwners', 'vehicleOwners.customer'],
      });
      expect(mockGenerateJobCode).toHaveBeenCalled();
    });

    it('should throw NotFoundError when vehicle not found', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(null);

      await expect(jobService.create(createDto)).rejects.toThrow(NotFoundError);
    });

    it('should add customer as owner when not already an owner', async () => {
      const mockVehicle = {
        id: 'vehicle-1',
        vehicleOwners: [{ customerId: 'different-customer', isPrimary: true }],
      };
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);
      mockVehicleOwnerRepository.findOne.mockResolvedValue(null);
      mockVehicleOwnerRepository.save.mockResolvedValue(undefined);
      mockGenerateJobCode.mockResolvedValue('J001');
      mockJobRepository.create.mockReturnValue(mockJob);
      mockJobRepository.save.mockResolvedValue(mockJob);
      mockJobRepository.findOne.mockResolvedValue(mockJob);

      const result = await jobService.create(createDto);

      expect(result).toEqual(mockJob);
      expect(mockVehicleOwnerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleId: 'vehicle-1',
          customerId: 'customer-1',
          isPrimary: false,
        })
      );
    });
  });

  describe('update', () => {
    it('should update job notes', async () => {
      mockJobRepository.findOne.mockResolvedValue({ ...mockJob });
      mockJobRepository.save.mockResolvedValue({ ...mockJob, notes: 'Updated notes' });
      const mockReloadQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ ...mockJob, notes: 'Updated notes' }),
      };
      mockJobRepository.createQueryBuilder.mockReturnValue(mockReloadQueryBuilder);

      const result = await jobService.update('job-1', { notes: 'Updated notes' });

      expect(mockJobRepository.save).toHaveBeenCalled();
      expect(result.notes).toBe('Updated notes');
    });

    it('should throw BadRequestError when both discount types are provided', async () => {
      mockJobRepository.findOne.mockResolvedValue({ ...mockJob });

      await expect(
        jobService.update('job-1', { discountAmount: 10, discountPercent: 5 })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('updateStatus', () => {
    it('should allow flexible transitions between any statuses', async () => {
      const bookedJob = { ...mockJob, status: JobStatus.BOOKED };
      mockJobRepository.findOne
        .mockResolvedValueOnce(bookedJob)
        .mockResolvedValueOnce({ ...bookedJob, status: JobStatus.IN_PROGRESS });
      mockJobRepository.save.mockResolvedValue({ ...bookedJob, status: JobStatus.IN_PROGRESS });

      const result = await jobService.updateStatus('job-1', JobStatus.IN_PROGRESS);

      expect(mockJobRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(JobStatus.IN_PROGRESS);
    });

    it('should set startedAt when transitioning to IN_PROGRESS', async () => {
      const bookedJob = { ...mockJob, status: JobStatus.BOOKED, startedAt: null };
      mockJobRepository.findOne
        .mockResolvedValueOnce(bookedJob)
        .mockResolvedValueOnce({ ...bookedJob, status: JobStatus.IN_PROGRESS });
      mockJobRepository.save.mockImplementation((job: any) => {
        expect(job.startedAt).toBeDefined();
        return Promise.resolve(job);
      });

      await jobService.updateStatus('job-1', JobStatus.IN_PROGRESS);
    });

    it('should set completedAt when transitioning to COMPLETED', async () => {
      const inProgressJob = { ...mockJob, status: JobStatus.IN_PROGRESS, completedAt: null };
      mockJobRepository.findOne
        .mockResolvedValueOnce(inProgressJob)
        .mockResolvedValueOnce({ ...inProgressJob, status: JobStatus.COMPLETED });
      mockJobRepository.save.mockImplementation((job: any) => {
        expect(job.completedAt).toBeDefined();
        return Promise.resolve(job);
      });

      await jobService.updateStatus('job-1', JobStatus.COMPLETED);
    });

    it('should allow transition from any status to any other status', async () => {
      const pendingJob = { ...mockJob, status: JobStatus.PENDING };
      mockJobRepository.findOne
        .mockResolvedValueOnce(pendingJob)
        .mockResolvedValueOnce({ ...pendingJob, status: JobStatus.AWAITING_PICKUP });
      mockJobRepository.save.mockResolvedValue({ ...pendingJob, status: JobStatus.AWAITING_PICKUP });

      const result = await jobService.updateStatus('job-1', JobStatus.AWAITING_PICKUP);

      expect(mockJobRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(JobStatus.AWAITING_PICKUP);
    });
  });

  describe('delete', () => {
    it('should delete job in BOOKED status', async () => {
      const bookedJob = { ...mockJob, status: JobStatus.BOOKED };
      mockJobRepository.findOne.mockResolvedValue(bookedJob);
      mockJobRepository.remove.mockResolvedValue(undefined);

      await jobService.delete('job-1');

      expect(mockJobRepository.remove).toHaveBeenCalledWith(bookedJob);
    });

    it('should throw ConflictError when deleting job not in BOOKED status', async () => {
      const inProgressJob = { ...mockJob, status: JobStatus.IN_PROGRESS };
      mockJobRepository.findOne.mockResolvedValue(inProgressJob);

      await expect(jobService.delete('job-1')).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError when deleting COMPLETED job', async () => {
      const completedJob = { ...mockJob, status: JobStatus.COMPLETED };
      mockJobRepository.findOne.mockResolvedValue(completedJob);

      await expect(jobService.delete('job-1')).rejects.toThrow(ConflictError);
    });
  });

  describe('duplicate', () => {
    it('should create a new BOOKED job from existing job', async () => {
      const originalJob = {
        ...mockJob,
        lineItems: [mockLineItem],
      };
      mockJobRepository.findOne
        .mockResolvedValueOnce(originalJob)
        .mockResolvedValueOnce({ ...originalJob, id: 'job-2', code: 'J002' });
      mockGenerateJobCode.mockResolvedValue('J002');
      mockJobRepository.create.mockReturnValue({
        ...mockJob,
        id: 'job-2',
        code: 'J002',
        status: JobStatus.BOOKED,
      });
      mockJobRepository.save.mockResolvedValue({ id: 'job-2' });
      mockLineItemRepository.create.mockReturnValue(mockLineItem);
      mockLineItemRepository.save.mockResolvedValue([mockLineItem]);

      const result = await jobService.duplicate('job-1');

      expect(mockGenerateJobCode).toHaveBeenCalled();
      expect(mockJobRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: JobStatus.BOOKED,
        })
      );
    });
  });

  describe('addLineItem', () => {
    const lineItemDto: CreateLineItemDto = {
      type: LineItemType.INVENTORY,
      description: 'New part',
      quantity: 1,
      unitPrice: 25,
    };

    it('should add line item to job not in COMPLETED status', async () => {
      const bookedJob = { ...mockJob, status: JobStatus.BOOKED, lineItems: [] };
      mockJobRepository.findOne.mockResolvedValue(bookedJob);
      mockLineItemRepository.create.mockReturnValue({ ...lineItemDto, id: 'new-item' });
      mockLineItemRepository.save.mockResolvedValue({ ...lineItemDto, id: 'new-item' });

      const result = await jobService.addLineItem('job-1', lineItemDto);

      expect(mockLineItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: 'job-1',
          type: LineItemType.INVENTORY,
          description: 'New part',
        })
      );
    });

    it('should throw ConflictError when adding to COMPLETED job', async () => {
      const completedJob = { ...mockJob, status: JobStatus.COMPLETED };
      mockJobRepository.findOne.mockResolvedValue(completedJob);

      await expect(jobService.addLineItem('job-1', lineItemDto)).rejects.toThrow(ConflictError);
    });

    it('should set correct sortOrder for new items', async () => {
      const jobWithItems = {
        ...mockJob,
        status: JobStatus.BOOKED,
        lineItems: [{ ...mockLineItem, sortOrder: 5 }],
      };
      mockJobRepository.findOne.mockResolvedValue(jobWithItems);
      mockLineItemRepository.create.mockImplementation((data: any) => {
        expect(data.sortOrder).toBe(6);
        return data;
      });
      mockLineItemRepository.save.mockResolvedValue({ ...lineItemDto });

      await jobService.addLineItem('job-1', lineItemDto);
    });
  });

  describe('updateLineItem', () => {
    it('should update line item on non-COMPLETED job', async () => {
      const bookedJob = { ...mockJob, status: JobStatus.BOOKED };
      mockJobRepository.findOne.mockResolvedValue(bookedJob);
      mockLineItemRepository.findOne.mockResolvedValue({ ...mockLineItem, version: 0 });
      mockLineItemRepository.save.mockResolvedValue({ ...mockLineItem, quantity: 5, version: 1 });

      const result = await jobService.updateLineItem('job-1', 'item-1', { quantity: 5 });

      expect(mockLineItemRepository.save).toHaveBeenCalled();
    });

    it('should throw VersionConflictError when line item version mismatch', async () => {
      const bookedJob = { ...mockJob, status: JobStatus.BOOKED };
      mockJobRepository.findOne.mockResolvedValue(bookedJob);
      mockLineItemRepository.findOne.mockResolvedValue({ ...mockLineItem, version: 1 });

      await expect(jobService.updateLineItem('job-1', 'item-1', { quantity: 5, version: 0 }))
        .rejects
        .toThrow(VersionConflictError);
    });

    it('should throw ConflictError when updating item on COMPLETED job', async () => {
      const completedJob = { ...mockJob, status: JobStatus.COMPLETED };
      mockJobRepository.findOne.mockResolvedValue(completedJob);

      await expect(
        jobService.updateLineItem('job-1', 'item-1', { quantity: 5 })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw NotFoundError when line item not found', async () => {
      const bookedJob = { ...mockJob, status: JobStatus.BOOKED };
      mockJobRepository.findOne.mockResolvedValue(bookedJob);
      mockLineItemRepository.findOne.mockResolvedValue(null);

      await expect(
        jobService.updateLineItem('job-1', 'nonexistent', { quantity: 5 })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteLineItem', () => {
    it('should delete line item from non-COMPLETED job', async () => {
      const bookedJob = { ...mockJob, status: JobStatus.BOOKED };
      mockJobRepository.findOne.mockResolvedValue(bookedJob);
      mockLineItemRepository.delete.mockResolvedValue({ affected: 1 });

      await jobService.deleteLineItem('job-1', 'item-1');

      expect(mockLineItemRepository.delete).toHaveBeenCalledWith({
        id: 'item-1',
        jobId: 'job-1',
      });
    });

    it('should throw ConflictError when deleting from COMPLETED job', async () => {
      const completedJob = { ...mockJob, status: JobStatus.COMPLETED };
      mockJobRepository.findOne.mockResolvedValue(completedJob);

      await expect(jobService.deleteLineItem('job-1', 'item-1')).rejects.toThrow(ConflictError);
    });
  });

  describe('reorderLineItems', () => {
    it('should reorder line items', async () => {
      mockJobRepository.findOne.mockResolvedValue({
        ...mockJob,
        lineItems: [
          { id: 'item-1', sortOrder: 0 },
          { id: 'item-2', sortOrder: 1 },
        ],
      });
      mockLineItemRepository.update.mockResolvedValue({ affected: 1 });

      const reorderData = [
        { id: 'item-2', sortOrder: 0 },
        { id: 'item-1', sortOrder: 1 },
      ];

      const result = await jobService.reorderLineItems('job-1', reorderData);

      expect(mockLineItemRepository.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('applyTemplate', () => {
    it('should apply template to non-COMPLETED job', async () => {
      const bookedJob = { ...mockJob, status: JobStatus.BOOKED, lineItems: [] };
      const mockTemplate = {
        id: 'template-1',
        items: [
          { itemType: LineItemType.INVENTORY, itemId: 'inv-1', description: 'Part', quantity: 1, unitPrice: 20 },
        ],
      };

      mockJobRepository.findOne
        .mockResolvedValueOnce(bookedJob)
        .mockResolvedValueOnce(bookedJob);
      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);
      mockLineItemRepository.create.mockReturnValue({});
      mockLineItemRepository.save.mockResolvedValue([]);

      await jobService.applyTemplate('job-1', 'template-1');

      expect(mockTemplateRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        relations: ['items'],
      });
    });

    it('should throw ConflictError when applying template to COMPLETED job', async () => {
      const completedJob = { ...mockJob, status: JobStatus.COMPLETED };
      mockJobRepository.findOne.mockResolvedValue(completedJob);

      await expect(jobService.applyTemplate('job-1', 'template-1')).rejects.toThrow(ConflictError);
    });

    it('should throw NotFoundError when template not found', async () => {
      const bookedJob = { ...mockJob, status: JobStatus.BOOKED };
      mockJobRepository.findOne.mockResolvedValue(bookedJob);
      mockTemplateRepository.findOne.mockResolvedValue(null);

      await expect(jobService.applyTemplate('job-1', 'nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('addLineItemsBulk', () => {
    it('should add multiple line items at once', async () => {
      const bookedJob = { ...mockJob, status: JobStatus.BOOKED, lineItems: [] };
      mockJobRepository.findOne.mockResolvedValue(bookedJob);
      mockLineItemRepository.create.mockImplementation((data: any) => data);
      mockLineItemRepository.save.mockResolvedValue([]);

      const items: CreateLineItemDto[] = [
        { type: LineItemType.INVENTORY, description: 'Part 1', quantity: 1, unitPrice: 10 },
        { type: LineItemType.LABOUR, description: 'Labour 1', quantity: 2, unitPrice: 50 },
      ];

      await jobService.addLineItemsBulk('job-1', items);

      expect(mockLineItemRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictError when adding to COMPLETED job', async () => {
      const completedJob = { ...mockJob, status: JobStatus.COMPLETED };
      mockJobRepository.findOne.mockResolvedValue(completedJob);

      await expect(
        jobService.addLineItemsBulk('job-1', [
          { type: LineItemType.TEXT, description: 'Note', quantity: 1, unitPrice: 0 },
        ])
      ).rejects.toThrow(ConflictError);
    });
  });
});

