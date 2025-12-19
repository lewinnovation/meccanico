import {
  JobService,
  CreateJobDto,
  UpdateJobDto,
  CreateLineItemDto,
} from '../../../src/services/JobService';
import { Job, JobStatus } from '../../../src/models/Job';
import { LineItem, LineItemType } from '../../../src/models/LineItem';
import { NotFoundError, ConflictError, BadRequestError } from '../../../src/middleware/errorHandler';
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

  const mockJob: Partial<Job> = {
    id: 'job-1',
    code: 'J001',
    customerId: 'customer-1',
    vehicleId: 'vehicle-1',
    status: JobStatus.ESTIMATE,
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

    const { AppDataSource } = require('../../../src/config/database');
    AppDataSource.getRepository.mockImplementation((entity: any) => {
      if (entity.name === 'Job') return mockJobRepository;
      if (entity.name === 'LineItem') return mockLineItemRepository;
      if (entity.name === 'Template') return mockTemplateRepository;
      if (entity.name === 'Vehicle') return mockVehicleRepository;
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

      await jobService.findAll(1, 50, undefined, JobStatus.ESTIMATE);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('job.status = :status', {
        status: JobStatus.ESTIMATE,
      });
    });

    it('should filter by search term', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      mockJobRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await jobService.findAll(1, 50, 'toyota');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(job.code ILIKE :search OR customer.name ILIKE :search OR vehicle.make ILIKE :search OR vehicle.model ILIKE :search)',
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
        relations: ['customer', 'vehicle', 'assignee', 'lineItems'],
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
        relations: ['customer', 'vehicle', 'assignee', 'lineItems'],
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
      const mockVehicle = { id: 'vehicle-1', customerId: 'customer-1' };
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);
      mockGenerateJobCode.mockResolvedValue('J001');
      mockJobRepository.create.mockReturnValue(mockJob);
      mockJobRepository.save.mockResolvedValue(mockJob);
      mockJobRepository.findOne.mockResolvedValue(mockJob);

      const result = await jobService.create(createDto);

      expect(result).toEqual(mockJob);
      expect(mockVehicleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'vehicle-1' },
      });
      expect(mockGenerateJobCode).toHaveBeenCalled();
    });

    it('should throw NotFoundError when vehicle not found', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(null);

      await expect(jobService.create(createDto)).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when vehicle belongs to different customer', async () => {
      const mockVehicle = { id: 'vehicle-1', customerId: 'different-customer' };
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);

      await expect(jobService.create(createDto)).rejects.toThrow(BadRequestError);
    });
  });

  describe('update', () => {
    it('should update job notes', async () => {
      mockJobRepository.findOne.mockResolvedValue({ ...mockJob });
      mockJobRepository.save.mockResolvedValue({ ...mockJob, notes: 'Updated notes' });

      const result = await jobService.update('job-1', { notes: 'Updated notes' });

      expect(mockJobRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestError when both discount types are provided', async () => {
      mockJobRepository.findOne.mockResolvedValue({ ...mockJob });

      await expect(
        jobService.update('job-1', { discountAmount: 10, discountPercent: 5 })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('updateStatus', () => {
    it('should transition from ESTIMATE to APPROVED', async () => {
      const estimateJob = { ...mockJob, status: JobStatus.ESTIMATE };
      mockJobRepository.findOne
        .mockResolvedValueOnce(estimateJob)
        .mockResolvedValueOnce({ ...estimateJob, status: JobStatus.APPROVED });
      mockJobRepository.save.mockResolvedValue({ ...estimateJob, status: JobStatus.APPROVED });

      const result = await jobService.updateStatus('job-1', JobStatus.APPROVED);

      expect(mockJobRepository.save).toHaveBeenCalled();
    });

    it('should transition from APPROVED to IN_PROGRESS and set startedAt', async () => {
      const approvedJob = { ...mockJob, status: JobStatus.APPROVED, startedAt: null };
      mockJobRepository.findOne
        .mockResolvedValueOnce(approvedJob)
        .mockResolvedValueOnce({ ...approvedJob, status: JobStatus.IN_PROGRESS });
      mockJobRepository.save.mockImplementation((job: any) => {
        expect(job.startedAt).toBeDefined();
        return Promise.resolve(job);
      });

      await jobService.updateStatus('job-1', JobStatus.IN_PROGRESS);
    });

    it('should transition from IN_PROGRESS to INVOICED and set timestamps', async () => {
      const inProgressJob = { ...mockJob, status: JobStatus.IN_PROGRESS };
      mockJobRepository.findOne
        .mockResolvedValueOnce(inProgressJob)
        .mockResolvedValueOnce({ ...inProgressJob, status: JobStatus.INVOICED });
      mockJobRepository.save.mockImplementation((job: any) => {
        expect(job.completedAt).toBeDefined();
        expect(job.invoicedAt).toBeDefined();
        return Promise.resolve(job);
      });

      await jobService.updateStatus('job-1', JobStatus.INVOICED);
    });

    it('should transition from INVOICED to PAID and set paidAt', async () => {
      const invoicedJob = { ...mockJob, status: JobStatus.INVOICED };
      mockJobRepository.findOne
        .mockResolvedValueOnce(invoicedJob)
        .mockResolvedValueOnce({ ...invoicedJob, status: JobStatus.PAID });
      mockJobRepository.save.mockImplementation((job: any) => {
        expect(job.paidAt).toBeDefined();
        return Promise.resolve(job);
      });

      await jobService.updateStatus('job-1', JobStatus.PAID);
    });

    it('should throw BadRequestError for invalid transition', async () => {
      const paidJob = { ...mockJob, status: JobStatus.PAID };
      mockJobRepository.findOne.mockResolvedValue(paidJob);

      await expect(jobService.updateStatus('job-1', JobStatus.ESTIMATE)).rejects.toThrow(
        BadRequestError
      );
    });

    it('should throw BadRequestError when transitioning PAID to any status', async () => {
      const paidJob = { ...mockJob, status: JobStatus.PAID };
      mockJobRepository.findOne.mockResolvedValue(paidJob);

      await expect(jobService.updateStatus('job-1', JobStatus.APPROVED)).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe('delete', () => {
    it('should delete job in ESTIMATE status', async () => {
      const estimateJob = { ...mockJob, status: JobStatus.ESTIMATE };
      mockJobRepository.findOne.mockResolvedValue(estimateJob);
      mockJobRepository.remove.mockResolvedValue(undefined);

      await jobService.delete('job-1');

      expect(mockJobRepository.remove).toHaveBeenCalledWith(estimateJob);
    });

    it('should throw ConflictError when deleting job not in ESTIMATE status', async () => {
      const approvedJob = { ...mockJob, status: JobStatus.APPROVED };
      mockJobRepository.findOne.mockResolvedValue(approvedJob);

      await expect(jobService.delete('job-1')).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError when deleting IN_PROGRESS job', async () => {
      const inProgressJob = { ...mockJob, status: JobStatus.IN_PROGRESS };
      mockJobRepository.findOne.mockResolvedValue(inProgressJob);

      await expect(jobService.delete('job-1')).rejects.toThrow(ConflictError);
    });
  });

  describe('duplicate', () => {
    it('should create a new ESTIMATE job from existing job', async () => {
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
        status: JobStatus.ESTIMATE,
      });
      mockJobRepository.save.mockResolvedValue({ id: 'job-2' });
      mockLineItemRepository.create.mockReturnValue(mockLineItem);
      mockLineItemRepository.save.mockResolvedValue([mockLineItem]);

      const result = await jobService.duplicate('job-1');

      expect(mockGenerateJobCode).toHaveBeenCalled();
      expect(mockJobRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: JobStatus.ESTIMATE,
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

    it('should add line item to job in ESTIMATE status', async () => {
      const estimateJob = { ...mockJob, status: JobStatus.ESTIMATE, lineItems: [] };
      mockJobRepository.findOne.mockResolvedValue(estimateJob);
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

    it('should throw ConflictError when adding to non-ESTIMATE job', async () => {
      const approvedJob = { ...mockJob, status: JobStatus.APPROVED };
      mockJobRepository.findOne.mockResolvedValue(approvedJob);

      await expect(jobService.addLineItem('job-1', lineItemDto)).rejects.toThrow(ConflictError);
    });

    it('should set correct sortOrder for new items', async () => {
      const jobWithItems = {
        ...mockJob,
        status: JobStatus.ESTIMATE,
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
    it('should update line item on ESTIMATE job', async () => {
      const estimateJob = { ...mockJob, status: JobStatus.ESTIMATE };
      mockJobRepository.findOne.mockResolvedValue(estimateJob);
      mockLineItemRepository.findOne.mockResolvedValue(mockLineItem);
      mockLineItemRepository.save.mockResolvedValue({ ...mockLineItem, quantity: 5 });

      const result = await jobService.updateLineItem('job-1', 'item-1', { quantity: 5 });

      expect(mockLineItemRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictError when updating item on non-ESTIMATE job', async () => {
      const inProgressJob = { ...mockJob, status: JobStatus.IN_PROGRESS };
      mockJobRepository.findOne.mockResolvedValue(inProgressJob);

      await expect(
        jobService.updateLineItem('job-1', 'item-1', { quantity: 5 })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw NotFoundError when line item not found', async () => {
      const estimateJob = { ...mockJob, status: JobStatus.ESTIMATE };
      mockJobRepository.findOne.mockResolvedValue(estimateJob);
      mockLineItemRepository.findOne.mockResolvedValue(null);

      await expect(
        jobService.updateLineItem('job-1', 'nonexistent', { quantity: 5 })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteLineItem', () => {
    it('should delete line item from ESTIMATE job', async () => {
      const estimateJob = { ...mockJob, status: JobStatus.ESTIMATE };
      mockJobRepository.findOne.mockResolvedValue(estimateJob);
      mockLineItemRepository.delete.mockResolvedValue({ affected: 1 });

      await jobService.deleteLineItem('job-1', 'item-1');

      expect(mockLineItemRepository.delete).toHaveBeenCalledWith({
        id: 'item-1',
        jobId: 'job-1',
      });
    });

    it('should throw ConflictError when deleting from non-ESTIMATE job', async () => {
      const invoicedJob = { ...mockJob, status: JobStatus.INVOICED };
      mockJobRepository.findOne.mockResolvedValue(invoicedJob);

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
    it('should apply template to ESTIMATE job', async () => {
      const estimateJob = { ...mockJob, status: JobStatus.ESTIMATE, lineItems: [] };
      const mockTemplate = {
        id: 'template-1',
        items: [
          { itemType: LineItemType.INVENTORY, itemId: 'inv-1', description: 'Part', quantity: 1, unitPrice: 20 },
        ],
      };

      mockJobRepository.findOne
        .mockResolvedValueOnce(estimateJob)
        .mockResolvedValueOnce(estimateJob);
      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);
      mockLineItemRepository.create.mockReturnValue({});
      mockLineItemRepository.save.mockResolvedValue([]);

      await jobService.applyTemplate('job-1', 'template-1');

      expect(mockTemplateRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        relations: ['items'],
      });
    });

    it('should throw ConflictError when applying template to non-ESTIMATE job', async () => {
      const approvedJob = { ...mockJob, status: JobStatus.APPROVED };
      mockJobRepository.findOne.mockResolvedValue(approvedJob);

      await expect(jobService.applyTemplate('job-1', 'template-1')).rejects.toThrow(ConflictError);
    });

    it('should throw NotFoundError when template not found', async () => {
      const estimateJob = { ...mockJob, status: JobStatus.ESTIMATE };
      mockJobRepository.findOne.mockResolvedValue(estimateJob);
      mockTemplateRepository.findOne.mockResolvedValue(null);

      await expect(jobService.applyTemplate('job-1', 'nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('addLineItemsBulk', () => {
    it('should add multiple line items at once', async () => {
      const estimateJob = { ...mockJob, status: JobStatus.ESTIMATE, lineItems: [] };
      mockJobRepository.findOne.mockResolvedValue(estimateJob);
      mockLineItemRepository.create.mockImplementation((data: any) => data);
      mockLineItemRepository.save.mockResolvedValue([]);

      const items: CreateLineItemDto[] = [
        { type: LineItemType.INVENTORY, description: 'Part 1', quantity: 1, unitPrice: 10 },
        { type: LineItemType.LABOUR, description: 'Labour 1', quantity: 2, unitPrice: 50 },
      ];

      await jobService.addLineItemsBulk('job-1', items);

      expect(mockLineItemRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictError when adding to non-ESTIMATE job', async () => {
      const inProgressJob = { ...mockJob, status: JobStatus.IN_PROGRESS };
      mockJobRepository.findOne.mockResolvedValue(inProgressJob);

      await expect(
        jobService.addLineItemsBulk('job-1', [
          { type: LineItemType.TEXT, description: 'Note', quantity: 1, unitPrice: 0 },
        ])
      ).rejects.toThrow(ConflictError);
    });
  });
});

