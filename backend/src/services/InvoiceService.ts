import { AppDataSource } from '../config/database';
import { Invoice, InvoiceStatus } from '../models/Invoice';
import { Job, JobStatus } from '../models/Job';
import { NotFoundError, ConflictError, BadRequestError } from '../middleware/errorHandler';
import { SettingsService } from './SettingsService';
import { PaymentService } from './PaymentService';
import { In } from 'typeorm';

export interface CreateInvoiceFromJobDto {
  jobId: string;
}

export interface CreateInvoiceFromJobBulkDto {
  jobIds: string[];
}

export class InvoiceService {
  private repository = AppDataSource.getRepository(Invoice);
  private jobRepository = AppDataSource.getRepository(Job);
  private settingsService = new SettingsService();
  private paymentService = new PaymentService();

  /**
   * Generate invoice number in format INV-{YYYYMMDD}-{NNN}
   */
  private async generateInvoiceNumber(): Promise<string> {
    const today = new Date();
    const yy = today.getFullYear().toString().slice(-2);
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    const datePrefix = `INV-${yy}${mm}${dd}`;

    // Get the highest invoice number for today
    const result = await AppDataSource.query(`
      SELECT "invoiceNumber" FROM invoices
      WHERE "invoiceNumber" LIKE '${datePrefix}%'
      ORDER BY "invoiceNumber" DESC
      LIMIT 1
    `);

    let nextNumber = 1;
    if (result.length > 0) {
      const lastNumber = result[0].invoiceNumber as string;
      const numberPart = lastNumber.substring(11); // After "INV-YYMMDD-"
      const lastNum = parseInt(numberPart, 10);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }

    const paddedNumber = nextNumber.toString().padStart(3, '0');
    return `${datePrefix}-${paddedNumber}`;
  }

  /**
   * Calculate due date from invoice date and payment terms
   */
  private async calculateDueDate(invoiceDate: Date): Promise<Date> {
    const paymentTermsSetting = await this.settingsService.findByKey('invoice.payment_terms_days');
    const paymentTermsDays = typeof paymentTermsSetting.value === 'number' 
      ? paymentTermsSetting.value 
      : 14; // Default to 14 days

    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + paymentTermsDays);
    return dueDate;
  }

  /**
   * Create an invoice from a completed job
   */
  async createFromJob(jobId: string): Promise<Invoice> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId },
      relations: ['customer', 'vehicle'],
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (job.status !== JobStatus.COMPLETED) {
      throw new BadRequestError('Only completed jobs can be converted to invoices');
    }

    // Check if invoice already exists for this job
    const existingInvoice = await this.repository.findOne({
      where: { jobId },
    });

    if (existingInvoice) {
      throw new ConflictError('Invoice already exists for this job');
    }

    const invoiceDate = new Date();
    const invoiceNumber = await this.generateInvoiceNumber();
    const dueDate = await this.calculateDueDate(invoiceDate);

    const invoice = this.repository.create({
      invoiceNumber,
      jobId: job.id,
      status: InvoiceStatus.UNPAID,
      invoiceDate,
      dueDate,
    });

    const savedInvoice = await this.repository.save(invoice);

    // Update job to link to invoice
    job.invoiceId = savedInvoice.id;
    await this.jobRepository.save(job);

    return this.findById(savedInvoice.id);
  }

  /**
   * Get remaining balance for an invoice
   * This includes payments and credit notes
   */
  async getRemainingBalance(invoiceId: string): Promise<number> {
    return this.paymentService.getRemainingBalance(invoiceId);
  }

  /**
   * Find invoice by ID
   */
  async findById(id: string): Promise<Invoice> {
    const invoice = await this.repository.findOne({
      where: { id },
      relations: ['job', 'job.customer', 'job.vehicle', 'job.lineItems', 'creditNotes', 'payments', 'payments.paymentMethod'],
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    return invoice;
  }

  /**
   * Find invoice by job ID
   */
  async findByJobId(jobId: string): Promise<Invoice | null> {
    const invoice = await this.repository.findOne({
      where: { jobId },
      relations: ['job', 'job.customer', 'job.vehicle', 'job.lineItems', 'creditNotes', 'payments', 'payments.paymentMethod'],
    });

    return invoice;
  }

  /**
   * Get all invoices with pagination
   */
  async findAll(
    page: number = 1,
    limit: number = 50,
    status?: InvoiceStatus
  ): Promise<{ data: Invoice[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.repository.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.job', 'job')
      .leftJoinAndSelect('job.customer', 'customer')
      .leftJoinAndSelect('job.vehicle', 'vehicle');

    if (status) {
      queryBuilder.andWhere('invoice.status = :status', { status });
    }

    const [data, total] = await queryBuilder
      .orderBy('invoice.invoiceDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async createBulkFromJobs(jobIds: string[]): Promise<Invoice[]> {
    if (jobIds.length === 0) {
      throw new BadRequestError('At least one job ID is required');
    }
    if (jobIds.length > 100) {
      throw new BadRequestError('Cannot create more than 100 invoices at once');
    }

    // Validate all jobs exist and are completed (outside transaction for better error messages)
    const jobs = await this.jobRepository.find({
      where: { id: In(jobIds) },
      relations: ['customer', 'vehicle'],
    });

    if (jobs.length !== jobIds.length) {
      throw new NotFoundError('One or more jobs not found');
    }

    // Check for jobs that are not completed
    const incompleteJobs = jobs.filter(job => job.status !== JobStatus.COMPLETED);
    if (incompleteJobs.length > 0) {
      throw new BadRequestError(
        `Jobs ${incompleteJobs.map(j => j.code).join(', ')} are not completed`
      );
    }

    // Check for existing invoices
    const existingInvoices = await this.repository.find({
      where: { jobId: In(jobIds) },
    });

    const existingJobIds = new Set(existingInvoices.map(inv => inv.jobId));
    const duplicateJobIds = jobIds.filter(id => existingJobIds.has(id));
    if (duplicateJobIds.length > 0) {
      throw new ConflictError(
        `Invoices already exist for jobs: ${duplicateJobIds.join(', ')}`
      );
    }

    // Generate invoice numbers and due dates (outside transaction for advisory locks)
    const invoiceData = [];
    for (const job of jobs) {
      const invoiceDate = new Date();
      const invoiceNumber = await this.generateInvoiceNumber();
      const dueDate = await this.calculateDueDate(invoiceDate);
      invoiceData.push({ job, invoiceNumber, invoiceDate, dueDate });
    }

    // Create invoices in a transaction
    const createdInvoices: Invoice[] = [];
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const { job, invoiceNumber, invoiceDate, dueDate } of invoiceData) {
        const invoice = queryRunner.manager.create(Invoice, {
          invoiceNumber,
          jobId: job.id,
          status: InvoiceStatus.UNPAID,
          invoiceDate,
          dueDate,
        });

        const savedInvoice = await queryRunner.manager.save(invoice);

        // Update job to link to invoice
        job.invoiceId = savedInvoice.id;
        await queryRunner.manager.save(job);

        createdInvoices.push(savedInvoice);
      }

      await queryRunner.commitTransaction();

      // Load full invoice details with relations
      const invoiceIds = createdInvoices.map(inv => inv.id);
      const fullInvoices = await this.repository.find({
        where: { id: In(invoiceIds) },
        relations: ['job', 'job.customer', 'job.vehicle', 'job.lineItems', 'creditNotes', 'payments', 'payments.paymentMethod'],
      });

      return fullInvoices;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

