import { AppDataSource } from '../config/database';
import { Invoice, InvoiceStatus } from '../models/Invoice';
import { Job, JobStatus } from '../models/Job';
import { NotFoundError, ConflictError, BadRequestError } from '../middleware/errorHandler';
import { SettingsService } from './SettingsService';

export interface CreateInvoiceFromJobDto {
  jobId: string;
}

export interface MarkInvoicePaidDto {
  paymentNote?: string;
}

export class InvoiceService {
  private repository = AppDataSource.getRepository(Invoice);
  private jobRepository = AppDataSource.getRepository(Job);
  private settingsService = new SettingsService();

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
      paymentNote: null,
      paidAt: null,
    });

    const savedInvoice = await this.repository.save(invoice);

    // Update job to link to invoice
    job.invoiceId = savedInvoice.id;
    await this.jobRepository.save(job);

    return this.findById(savedInvoice.id);
  }

  /**
   * Mark an invoice as paid
   */
  async markAsPaid(invoiceId: string, data: MarkInvoicePaidDto): Promise<Invoice> {
    const invoice = await this.findById(invoiceId);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestError('Invoice is already paid');
    }

    invoice.status = InvoiceStatus.PAID;
    invoice.paidAt = new Date();
    if (data.paymentNote) {
      invoice.paymentNote = data.paymentNote;
    }

    await this.repository.save(invoice);
    return this.findById(invoiceId);
  }

  /**
   * Mark an invoice as unpaid
   */
  async markAsUnpaid(invoiceId: string): Promise<Invoice> {
    const invoice = await this.findById(invoiceId);

    if (invoice.status === InvoiceStatus.UNPAID) {
      return invoice; // Already unpaid, no change needed
    }

    invoice.status = InvoiceStatus.UNPAID;
    invoice.paidAt = null;
    // Keep payment note for audit trail, but status is unpaid

    await this.repository.save(invoice);
    return this.findById(invoiceId);
  }

  /**
   * Find invoice by ID
   */
  async findById(id: string): Promise<Invoice> {
    const invoice = await this.repository.findOne({
      where: { id },
      relations: ['job', 'job.customer', 'job.vehicle', 'job.lineItems', 'creditNotes'],
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
      relations: ['job', 'job.customer', 'job.vehicle', 'job.lineItems', 'creditNotes'],
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
}

