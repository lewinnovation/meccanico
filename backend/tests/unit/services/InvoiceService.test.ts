import { InvoiceService, CreateInvoiceFromJobDto } from '../../../src/services/InvoiceService';
import { Invoice, InvoiceStatus } from '../../../src/models/Invoice';
import { Job, JobStatus } from '../../../src/models/Job';
import { NotFoundError, ConflictError, BadRequestError } from '../../../src/middleware/errorHandler';
import { SettingsService } from '../../../src/services/SettingsService';
import { PaymentService } from '../../../src/services/PaymentService';

// Mock dependencies
jest.mock('../../../src/config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    query: jest.fn(),
  },
}));

jest.mock('../../../src/services/SettingsService', () => ({
  SettingsService: jest.fn(),
}));

jest.mock('../../../src/services/PaymentService', () => ({
  PaymentService: jest.fn(),
}));

describe('InvoiceService', () => {
  let invoiceService: InvoiceService;
  let mockInvoiceRepository: any;
  let mockJobRepository: any;
  let mockSettingsService: any;

  const mockJob: Partial<Job> = {
    id: 'job-1',
    code: 'J001',
    customerId: 'customer-1',
    vehicleId: 'vehicle-1',
    status: JobStatus.COMPLETED,
    completedAt: new Date(),
    invoiceId: null,
    customer: { id: 'customer-1', name: 'Test Customer' } as any,
    vehicle: { id: 'vehicle-1', make: 'Toyota', model: 'Camry' } as any,
    lineItems: [],
  };

  const mockInvoice: Partial<Invoice> = {
    id: 'invoice-1',
    invoiceNumber: 'INV-241216-001',
    jobId: 'job-1',
    status: InvoiceStatus.UNPAID,
    invoiceDate: new Date(),
    dueDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    job: mockJob as Job,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockInvoiceRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockJobRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockSettingsService = {
      findByKey: jest.fn().mockResolvedValue({ value: 14 }),
    };

    const { AppDataSource } = require('../../../src/config/database');
    AppDataSource.getRepository.mockImplementation((entity: any) => {
      if (entity.name === 'Invoice') return mockInvoiceRepository;
      if (entity.name === 'Job') return mockJobRepository;
      return mockInvoiceRepository;
    });

    // Mock AppDataSource.query for invoice number generation
    AppDataSource.query = jest.fn().mockResolvedValue([]);

    (SettingsService as jest.Mock).mockImplementation(() => mockSettingsService);

    invoiceService = new InvoiceService();
  });

  describe('createFromJob', () => {
    it('should create an invoice from a completed job', async () => {
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 14);

      const { AppDataSource } = require('../../../src/config/database');
      mockJobRepository.findOne.mockResolvedValue(mockJob);
      mockInvoiceRepository.findOne.mockResolvedValue(null);
      AppDataSource.query.mockResolvedValue([]);
      mockInvoiceRepository.create.mockReturnValue(mockInvoice);
      mockInvoiceRepository.save.mockResolvedValue(mockInvoice);
      mockJobRepository.save.mockResolvedValue({ ...mockJob, invoiceId: 'invoice-1' });
      mockInvoiceRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(mockInvoice);

      const result = await invoiceService.createFromJob('job-1');

      expect(mockJobRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        relations: ['customer', 'vehicle'],
      });
      expect(mockInvoiceRepository.create).toHaveBeenCalled();
      expect(mockInvoiceRepository.save).toHaveBeenCalled();
      expect(mockJobRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundError when job not found', async () => {
      mockJobRepository.findOne.mockResolvedValue(null);

      await expect(invoiceService.createFromJob('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when job is not completed', async () => {
      const inProgressJob = { ...mockJob, status: JobStatus.IN_PROGRESS };
      mockJobRepository.findOne.mockResolvedValue(inProgressJob);

      await expect(invoiceService.createFromJob('job-1')).rejects.toThrow(BadRequestError);
    });

    it('should throw ConflictError when invoice already exists', async () => {
      mockJobRepository.findOne.mockResolvedValue(mockJob);
      mockInvoiceRepository.findOne.mockResolvedValue(mockInvoice);

      await expect(invoiceService.createFromJob('job-1')).rejects.toThrow(ConflictError);
    });

    it('should generate invoice number with date prefix', async () => {
      const today = new Date();
      const yy = today.getFullYear().toString().slice(-2);
      const mm = (today.getMonth() + 1).toString().padStart(2, '0');
      const dd = today.getDate().toString().padStart(2, '0');
      const expectedPrefix = `INV-${yy}${mm}${dd}`;

      mockJobRepository.findOne.mockResolvedValue(mockJob);
      mockInvoiceRepository.findOne.mockResolvedValue(null);
      AppDataSource.query.mockResolvedValue([]);
      mockInvoiceRepository.create.mockReturnValue(mockInvoice);
      mockInvoiceRepository.save.mockResolvedValue(mockInvoice);
      mockJobRepository.save.mockResolvedValue(mockJob);
      mockInvoiceRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(mockInvoice);

      await invoiceService.createFromJob('job-1');

      expect(mockInvoiceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceNumber: expect.stringMatching(new RegExp(`^${expectedPrefix}-\\d{3}$`)),
        })
      );
    });

    it('should calculate due date from payment terms', async () => {
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 14);

      mockJobRepository.findOne.mockResolvedValue(mockJob);
      mockInvoiceRepository.findOne.mockResolvedValue(null);
      AppDataSource.query.mockResolvedValue([]);
      mockInvoiceRepository.create.mockReturnValue(mockInvoice);
      mockInvoiceRepository.save.mockResolvedValue(mockInvoice);
      mockJobRepository.save.mockResolvedValue(mockJob);
      mockInvoiceRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(mockInvoice);

      await invoiceService.createFromJob('job-1');

      expect(mockSettingsService.findByKey).toHaveBeenCalledWith('invoice.payment_terms_days');
      expect(mockInvoiceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dueDate: expect.any(Date),
        })
      );
    });
  });

  describe('markAsPaid', () => {
    it('should mark an invoice as paid', async () => {
      const paidInvoice = { ...mockInvoice, status: InvoiceStatus.PAID, paidAt: new Date() };
      mockInvoiceRepository.findOne
        .mockResolvedValueOnce(mockInvoice)
        .mockResolvedValueOnce(paidInvoice);
      mockInvoiceRepository.save.mockResolvedValue(paidInvoice);

      const result = await invoiceService.markAsPaid('invoice-1', { paymentNote: 'Paid via credit card' });

      expect(mockInvoiceRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(InvoiceStatus.PAID);
    });

    it('should throw NotFoundError when invoice not found', async () => {
      mockInvoiceRepository.findOne.mockResolvedValue(null);

      await expect(invoiceService.markAsPaid('nonexistent', {})).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when invoice is already paid', async () => {
      const paidInvoice = { ...mockInvoice, status: InvoiceStatus.PAID };
      mockInvoiceRepository.findOne.mockResolvedValue(paidInvoice);

      await expect(invoiceService.markAsPaid('invoice-1', {})).rejects.toThrow(BadRequestError);
    });

    it('should save payment note when provided', async () => {
      const paidInvoice = { ...mockInvoice, status: InvoiceStatus.PAID, paidAt: new Date(), paymentNote: 'Check #1234' };
      mockInvoiceRepository.findOne
        .mockResolvedValueOnce(mockInvoice)
        .mockResolvedValueOnce(paidInvoice);
      mockInvoiceRepository.save.mockResolvedValue(paidInvoice);

      await invoiceService.markAsPaid('invoice-1', { paymentNote: 'Check #1234' });

      expect(mockInvoiceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentNote: 'Check #1234',
        })
      );
    });
  });

  describe('findById', () => {
    it('should return invoice when found', async () => {
      mockInvoiceRepository.findOne.mockResolvedValue(mockInvoice);

      const result = await invoiceService.findById('invoice-1');

      expect(result).toEqual(mockInvoice);
      expect(mockInvoiceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'invoice-1' },
        relations: ['job', 'job.customer', 'job.vehicle', 'job.lineItems', 'creditNotes', 'payments', 'payments.paymentMethod'],
      });
    });

    it('should throw NotFoundError when invoice not found', async () => {
      mockInvoiceRepository.findOne.mockResolvedValue(null);

      await expect(invoiceService.findById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('findByJobId', () => {
    it('should return invoice when found by job ID', async () => {
      mockInvoiceRepository.findOne.mockResolvedValue(mockInvoice);

      const result = await invoiceService.findByJobId('job-1');

      expect(result).toEqual(mockInvoice);
      expect(mockInvoiceRepository.findOne).toHaveBeenCalledWith({
        where: { jobId: 'job-1' },
        relations: ['job', 'job.customer', 'job.vehicle', 'job.lineItems', 'creditNotes', 'payments', 'payments.paymentMethod'],
      });
    });

    it('should return null when invoice not found', async () => {
      mockInvoiceRepository.findOne.mockResolvedValue(null);

      const result = await invoiceService.findByJobId('job-1');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated invoices', async () => {
      const mockInvoices = [mockInvoice];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockInvoices, 1]),
      };
      mockInvoiceRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await invoiceService.findAll(1, 50);

      expect(result).toEqual({
        data: mockInvoices,
        total: 1,
        page: 1,
        limit: 50,
      });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('invoice.invoiceDate', 'DESC');
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
      mockInvoiceRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await invoiceService.findAll(1, 50, InvoiceStatus.UNPAID);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('invoice.status = :status', {
        status: InvoiceStatus.UNPAID,
      });
    });
  });
});

