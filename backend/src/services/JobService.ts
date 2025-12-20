import { AppDataSource } from '../config/database';
import { Job, JobStatus } from '../models/Job';
import { LineItem, LineItemType } from '../models/LineItem';
import { Template } from '../models/Template';
import { Vehicle } from '../models/Vehicle';
import { Customer } from '../models/Customer';
import { Invoice } from '../models/Invoice';
import { VehicleOwner } from '../models/VehicleOwner';
import { generateJobCode } from '../utils/codeGenerator';
import { NotFoundError, ConflictError, BadRequestError } from '../middleware/errorHandler';
import { PaginatedResult } from '../types/common';
import { createAuditLog } from '../utils/auditLogger';
import { AuditAction } from '../models/AuditLog';
import { PdfService } from './PdfService';
import { buildJobHtmlTemplate } from '../utils/jobHtmlTemplate';
import { SettingsService } from './SettingsService';

export interface CreateJobDto {
  customerId: string;
  vehicleId?: string;
  assignedTo?: string;
  notes?: string;
  taxRate?: number;
}

export interface UpdateJobDto {
  customerId?: string;
  vehicleId?: string;
  assignedTo?: string;
  notes?: string;
  internalNotes?: string;
  taxRate?: number;
  discountAmount?: number;
  discountPercent?: number;
  dueDate?: string;
}

export interface CreateLineItemDto {
  type: LineItemType;
  referenceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  sortOrder?: number;
}

export interface UpdateLineItemDto {
  description?: string;
  quantity?: number;
  unitPrice?: number;
  notes?: string;
}

export { PaginatedResult };

export class JobService {
  private repository = AppDataSource.getRepository(Job);
  private lineItemRepository = AppDataSource.getRepository(LineItem);
  private templateRepository = AppDataSource.getRepository(Template);
  private vehicleRepository = AppDataSource.getRepository(Vehicle);
  private vehicleOwnerRepository = AppDataSource.getRepository(VehicleOwner);
  private pdfService = new PdfService();
  private settingsService = new SettingsService();

  async findAll(
    page: number = 1,
    limit: number = 50,
    search?: string,
    status?: JobStatus,
    customerId?: string,
    vehicleId?: string,
    assignedTo?: string,
    startDate?: string,
    endDate?: string,
    hasInvoice?: boolean,
    invoicePaid?: boolean
  ): Promise<PaginatedResult<Job>> {
    const queryBuilder = this.repository.createQueryBuilder('job')
      .leftJoinAndSelect('job.customer', 'customer')
      .leftJoinAndSelect('job.vehicle', 'vehicle')
      .leftJoinAndSelect('job.assignee', 'assignee')
      .leftJoinAndSelect('job.lineItems', 'lineItems')
      .leftJoinAndSelect('job.invoice', 'invoice');

    if (search) {
      queryBuilder.leftJoin('vehicle.vehicleOwners', 'vehicleOwner')
        .leftJoin('vehicleOwner.customer', 'owner');
      queryBuilder.andWhere(
        '(job.code ILIKE :search OR customer.name ILIKE :search OR vehicle.make ILIKE :search OR vehicle.model ILIKE :search OR owner.name ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (status) {
      queryBuilder.andWhere('job.status = :status', { status });
    }

    if (customerId) {
      queryBuilder.andWhere('job.customerId = :customerId', { customerId });
    }

    if (vehicleId) {
      queryBuilder.andWhere('job.vehicleId = :vehicleId', { vehicleId });
    }

    if (assignedTo) {
      queryBuilder.andWhere('job.assignedTo = :assignedTo', { assignedTo });
    }

    // Date range filtering
    if (startDate) {
      queryBuilder.andWhere('job.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      // Add one day to endDate to include the entire end date
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      queryBuilder.andWhere('job.createdAt < :endDate', { endDate: endDateObj });
    }

    // Invoice filtering
    if (hasInvoice !== undefined) {
      if (hasInvoice) {
        queryBuilder.andWhere('job.invoiceId IS NOT NULL');
      } else {
        queryBuilder.andWhere('job.invoiceId IS NULL');
      }
    }

    // Invoice paid status filtering
    if (invoicePaid !== undefined) {
      if (invoicePaid) {
        queryBuilder.andWhere('invoice.status = :paidStatus', { paidStatus: 'PAID' });
      } else {
        queryBuilder.andWhere('(invoice.status IS NULL OR invoice.status != :paidStatus)', { paidStatus: 'PAID' });
      }
    }

    const [data, total] = await queryBuilder
      .orderBy('job.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Job> {
    const job = await this.repository.findOne({
      where: { id },
      relations: ['customer', 'vehicle', 'assignee', 'lineItems', 'invoice'],
      order: { lineItems: { sortOrder: 'ASC' } },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    return job;
  }

  async findByCode(code: string): Promise<Job> {
    const job = await this.repository.findOne({
      where: { code },
      relations: ['customer', 'vehicle', 'assignee', 'lineItems', 'invoice'],
      order: { lineItems: { sortOrder: 'ASC' } },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    return job;
  }

  async create(data: CreateJobDto, userId?: string | null): Promise<Job> {
    let customerId = data.customerId;

    // If vehicle is provided, validate and potentially set default customer
    if (data.vehicleId) {
      const vehicle = await this.vehicleRepository.findOne({
        where: { id: data.vehicleId },
        relations: ['vehicleOwners', 'vehicleOwners.customer'],
      });

      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      // If customerId not provided, use last job's customer or first/primary owner
      if (!customerId) {
        // Find the most recent job for this vehicle
        const lastJob = await this.repository.findOne({
          where: { vehicleId: data.vehicleId },
          order: { createdAt: 'DESC' },
        });

        if (lastJob) {
          customerId = lastJob.customerId;
        } else {
          // No jobs exist, use primary owner or first owner
          const primaryOwner = vehicle.vehicleOwners?.find(vo => vo.isPrimary);
          if (primaryOwner) {
            customerId = primaryOwner.customerId;
          } else if (vehicle.vehicleOwners && vehicle.vehicleOwners.length > 0) {
            customerId = vehicle.vehicleOwners[0].customerId;
          } else {
            throw new BadRequestError('Vehicle has no owners');
          }
        }
      }

      // Validate that customer is in vehicle's owners list
      const isOwner = vehicle.vehicleOwners?.some(
        vo => vo.customerId === customerId
      );

      if (!isOwner) {
        throw new BadRequestError('Customer must be an owner of the specified vehicle');
      }
    } else if (!customerId) {
      throw new BadRequestError('Customer is required when vehicle is not specified');
    }

    const code = await generateJobCode();

    const job = this.repository.create({
      code,
      customerId,
      vehicleId: data.vehicleId || null,
      assignedTo: data.assignedTo,
      notes: data.notes,
      taxRate: data.taxRate ?? 0,
      status: JobStatus.BOOKED,
    });

    const savedJob = await this.repository.save(job);
    
    // Create audit log
    await createAuditLog(
      userId || null,
      AuditAction.CREATE,
      'Job',
      savedJob.id,
      null,
      {
        code: savedJob.code,
        customerId: savedJob.customerId,
        vehicleId: savedJob.vehicleId,
        status: savedJob.status,
      }
    );
    
    return this.findById(savedJob.id);
  }

  async update(id: string, data: UpdateJobDto, userId?: string | null): Promise<Job> {
    const job = await this.findById(id);
    
    // Prevent editing cancelled jobs
    if (job.status === JobStatus.CANCELLED) {
      throw new ConflictError('Cannot edit cancelled jobs');
    }
    
    // Store old values for audit log
    const oldValue = {
      customerId: job.customerId,
      vehicleId: job.vehicleId,
      assignedTo: job.assignedTo,
      notes: job.notes,
      internalNotes: job.internalNotes,
      taxRate: job.taxRate,
      discountAmount: job.discountAmount,
      discountPercent: job.discountPercent,
      dueDate: job.dueDate,
      status: job.status,
    };

    // Check if both discount types are provided
    if (data.discountAmount && data.discountPercent) {
      throw new BadRequestError('Cannot have both discount amount and discount percent');
    }

    // Customer and vehicle can only be changed in BOOKED status
    const isChangingCustomer = data.customerId && data.customerId !== job.customerId;
    const isChangingVehicle = data.vehicleId && data.vehicleId !== job.vehicleId;

    if ((isChangingCustomer || isChangingVehicle) && job.status !== JobStatus.BOOKED) {
      throw new ConflictError('Customer and vehicle can only be changed when job is in BOOKED status');
    }

    // If changing customer, verify customer exists
    if (isChangingCustomer) {
      const customerRepository = AppDataSource.getRepository(Customer);
      const customer = await customerRepository.findOne({
        where: { id: data.customerId },
      });

      if (!customer) {
        throw new NotFoundError('Customer not found');
      }
    }

    // If changing vehicle, verify it exists and customer is an owner
    if (isChangingVehicle) {
      const vehicle = await this.vehicleRepository.findOne({
        where: { id: data.vehicleId },
        relations: ['vehicleOwners'],
      });

      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      const targetCustomerId = data.customerId || job.customerId;
      const isOwner = vehicle.vehicleOwners?.some(
        vo => vo.customerId === targetCustomerId
      );

      if (!isOwner) {
        throw new BadRequestError('Customer must be an owner of the selected vehicle');
      }
    }

    // If changing customer and vehicle is set, verify customer is an owner
    if (isChangingCustomer && job.vehicleId) {
      const vehicle = await this.vehicleRepository.findOne({
        where: { id: job.vehicleId },
        relations: ['vehicleOwners'],
      });

      if (vehicle) {
        const isOwner = vehicle.vehicleOwners?.some(
          vo => vo.customerId === data.customerId
        );

        if (!isOwner) {
          throw new BadRequestError('Customer must be an owner of the vehicle');
        }
      }
    }

    // If only changing customer (no vehicle specified), clear vehicle
    if (isChangingCustomer && !data.vehicleId) {
      job.vehicleId = null;
    }

    // Explicitly set customer and vehicle IDs if provided
    if (data.customerId !== undefined) {
      job.customerId = data.customerId;
    }
    if (data.vehicleId !== undefined) {
      job.vehicleId = data.vehicleId;
    }

    // Update other fields
    if (data.assignedTo !== undefined) {
      job.assignedTo = data.assignedTo;
    }
    if (data.notes !== undefined) {
      job.notes = data.notes || null;
    }
    if (data.internalNotes !== undefined) {
      job.internalNotes = data.internalNotes || null;
    }
    if (data.taxRate !== undefined) {
      job.taxRate = data.taxRate;
    }
    if (data.discountAmount !== undefined) {
      job.discountAmount = data.discountAmount;
    }
    if (data.discountPercent !== undefined) {
      job.discountPercent = data.discountPercent;
    }
    if (data.dueDate !== undefined) {
      job.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    await this.repository.save(job);
    
    // Create audit log
    const newValue = {
      customerId: job.customerId,
      vehicleId: job.vehicleId,
      assignedTo: job.assignedTo,
      notes: job.notes,
      internalNotes: job.internalNotes,
      taxRate: job.taxRate,
      discountAmount: job.discountAmount,
      discountPercent: job.discountPercent,
      dueDate: job.dueDate,
      status: job.status,
    };
    
    await createAuditLog(
      userId || null,
      AuditAction.UPDATE,
      'Job',
      id,
      oldValue,
      newValue
    );
    
    return this.findById(id);
  }

  async updateStatus(id: string, newStatus: JobStatus, userId?: string | null): Promise<Job> {
    const job = await this.findById(id);
    
    const oldStatus = job.status;

    // If transitioning to CANCELLED, remove the invoice if it exists
    if (newStatus === JobStatus.CANCELLED && job.invoiceId) {
      const invoiceRepository = AppDataSource.getRepository(Invoice);
      await invoiceRepository.delete({ id: job.invoiceId });
      job.invoiceId = null;
    }

    // Flexible transitions - allow any status to transition to any other status
    // Set timestamps based on transition
    const now = new Date();
    if (newStatus === JobStatus.IN_PROGRESS && !job.startedAt) {
      job.startedAt = now;
    }
    if (newStatus === JobStatus.COMPLETED && !job.completedAt) {
      job.completedAt = now;
    }

    job.status = newStatus;
    await this.repository.save(job);
    
    // Create audit log for status change
    await createAuditLog(
      userId || null,
      AuditAction.UPDATE,
      'Job',
      id,
      { status: oldStatus },
      { status: newStatus }
    );
    
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const job = await this.findById(id);

    if (job.status !== JobStatus.BOOKED) {
      throw new ConflictError('Can only delete jobs in BOOKED status');
    }

    await this.repository.remove(job);
  }

  async duplicate(id: string): Promise<Job> {
    const original = await this.findById(id);
    const code = await generateJobCode();

    const newJob = this.repository.create({
      code,
      customerId: original.customerId,
      vehicleId: original.vehicleId,
      assignedTo: original.assignedTo,
      notes: original.notes,
      taxRate: original.taxRate,
      status: JobStatus.BOOKED,
    });

    const savedJob = await this.repository.save(newJob);

    // Copy line items
    if (original.lineItems && original.lineItems.length > 0) {
      const lineItems = original.lineItems.map((item) =>
        this.lineItemRepository.create({
          jobId: savedJob.id,
          type: item.type,
          referenceId: item.referenceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          sortOrder: item.sortOrder,
          notes: item.notes,
        })
      );
      await this.lineItemRepository.save(lineItems);
    }

    return this.findById(savedJob.id);
  }

  // Line Item Methods
  async addLineItem(jobId: string, data: CreateLineItemDto, userId?: string | null): Promise<LineItem> {
    const job = await this.findById(jobId);

    // Allow adding items to jobs that are not yet completed or cancelled
    if (job.status === JobStatus.COMPLETED) {
      throw new ConflictError('Cannot add items to completed jobs');
    }
    if (job.status === JobStatus.CANCELLED) {
      throw new ConflictError('Cannot add items to cancelled jobs');
    }

    // Get max sort order
    const maxSortOrder = job.lineItems?.reduce(
      (max, i) => Math.max(max, i.sortOrder),
      -1
    ) ?? -1;

    const lineItem = this.lineItemRepository.create({
      jobId,
      type: data.type,
      referenceId: data.referenceId || null,
      description: data.description,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      notes: data.notes,
      sortOrder: data.sortOrder ?? maxSortOrder + 1,
    });

    const savedItem = await this.lineItemRepository.save(lineItem);
    
    // Create audit log
    await createAuditLog(
      userId || null,
      AuditAction.CREATE,
      'LineItem',
      savedItem.id,
      null,
      {
        jobId: savedItem.jobId,
        type: savedItem.type,
        description: savedItem.description,
        quantity: savedItem.quantity,
        unitPrice: savedItem.unitPrice,
      }
    );
    
    return savedItem;
  }

  async updateLineItem(
    jobId: string,
    lineItemId: string,
    data: UpdateLineItemDto,
    userId?: string | null
  ): Promise<LineItem> {
    const job = await this.findById(jobId);

    // Allow updating items on jobs that are not yet completed or cancelled
    if (job.status === JobStatus.COMPLETED) {
      throw new ConflictError('Cannot update items on completed jobs');
    }
    if (job.status === JobStatus.CANCELLED) {
      throw new ConflictError('Cannot update items on cancelled jobs');
    }

    const lineItem = await this.lineItemRepository.findOne({
      where: { id: lineItemId, jobId },
    });

    if (!lineItem) {
      throw new NotFoundError('Line item not found');
    }

    // Store old values for audit log
    const oldValue = {
      jobId: lineItem.jobId,
      type: lineItem.type,
      description: lineItem.description,
      quantity: lineItem.quantity,
      unitPrice: lineItem.unitPrice,
    };

    Object.assign(lineItem, data);
    const savedItem = await this.lineItemRepository.save(lineItem);
    
    // Create audit log
    await createAuditLog(
      userId || null,
      AuditAction.UPDATE,
      'LineItem',
      lineItemId,
      oldValue,
      {
        jobId: savedItem.jobId,
        type: savedItem.type,
        description: savedItem.description,
        quantity: savedItem.quantity,
        unitPrice: savedItem.unitPrice,
      }
    );
    
    return savedItem;
  }

  async deleteLineItem(jobId: string, lineItemId: string, userId?: string | null): Promise<void> {
    const job = await this.findById(jobId);

    // Allow deleting items from jobs that are not yet completed or cancelled
    if (job.status === JobStatus.COMPLETED) {
      throw new ConflictError('Cannot delete items from completed jobs');
    }
    if (job.status === JobStatus.CANCELLED) {
      throw new ConflictError('Cannot delete items from cancelled jobs');
    }

    // Get line item before deletion for audit log
    const lineItem = await this.lineItemRepository.findOne({
      where: { id: lineItemId, jobId },
    });

    if (lineItem) {
      // Create audit log before deletion
      await createAuditLog(
        userId || null,
        AuditAction.DELETE,
        'LineItem',
        lineItemId,
        {
          jobId: lineItem.jobId,
          type: lineItem.type,
          description: lineItem.description,
          quantity: lineItem.quantity,
          unitPrice: lineItem.unitPrice,
        },
        null
      );
    }

    await this.lineItemRepository.delete({ id: lineItemId, jobId });
  }

  async reorderLineItems(
    jobId: string,
    items: { id: string; sortOrder: number }[]
  ): Promise<LineItem[]> {
    const job = await this.findById(jobId);
    
    // Prevent reordering items on cancelled jobs
    if (job.status === JobStatus.CANCELLED) {
      throw new ConflictError('Cannot reorder items on cancelled jobs');
    }

    for (const item of items) {
      await this.lineItemRepository.update(
        { id: item.id, jobId },
        { sortOrder: item.sortOrder }
      );
    }

    return (await this.findById(jobId)).lineItems;
  }

  async applyTemplate(jobId: string, templateId: string): Promise<Job> {
    const job = await this.findById(jobId);

    // Allow applying templates to jobs that are not yet completed or cancelled
    if (job.status === JobStatus.COMPLETED) {
      throw new ConflictError('Cannot apply templates to completed jobs');
    }
    if (job.status === JobStatus.CANCELLED) {
      throw new ConflictError('Cannot apply templates to cancelled jobs');
    }

    const template = await this.templateRepository.findOne({
      where: { id: templateId },
      relations: ['items'],
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    // Get max sort order from existing line items
    const maxSortOrder = job.lineItems?.reduce(
      (max, i) => Math.max(max, i.sortOrder),
      -1
    ) ?? -1;

    // Add template items as line items
    if (template.items && template.items.length > 0) {
      const lineItems = template.items.map((item, index) =>
        this.lineItemRepository.create({
          jobId,
          type: item.itemType,
          referenceId: item.itemId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          sortOrder: maxSortOrder + 1 + index,
        })
      );
      await this.lineItemRepository.save(lineItems);
    }

    return this.findById(jobId);
  }

  async addLineItemsBulk(
    jobId: string,
    items: CreateLineItemDto[],
    userId?: string | null
  ): Promise<LineItem[]> {
    const job = await this.findById(jobId);

    // Allow adding items to jobs that are not yet completed
    if (job.status === JobStatus.COMPLETED) {
      throw new ConflictError('Cannot add items to completed jobs');
    }

    const maxSortOrder = job.lineItems?.reduce(
      (max, i) => Math.max(max, i.sortOrder),
      -1
    ) ?? -1;

    const lineItems = items.map((item, index) =>
      this.lineItemRepository.create({
        jobId,
        type: item.type,
        referenceId: item.referenceId || null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        notes: item.notes,
        sortOrder: item.sortOrder ?? maxSortOrder + 1 + index,
      })
    );

    const savedItems = await this.lineItemRepository.save(lineItems);
    
    // Create audit logs for each item
    for (const savedItem of savedItems) {
      await createAuditLog(
        userId || null,
        AuditAction.CREATE,
        'LineItem',
        savedItem.id,
        null,
        {
          jobId: savedItem.jobId,
          type: savedItem.type,
          description: savedItem.description,
          quantity: savedItem.quantity,
          unitPrice: savedItem.unitPrice,
        }
      );
    }
    
    return savedItems;
  }

  /**
   * Generate PDF for a job (estimate or invoice)
   */
  async generatePdf(jobId: string, type: 'estimate' | 'invoice'): Promise<Buffer> {
    const job = await this.findById(jobId);

    // Validate type
    if (type === 'invoice' && !job.invoiceId) {
      throw new BadRequestError('Job does not have an invoice');
    }

    // Fetch invoice if needed
    let invoice: Invoice | null = null;
    if (type === 'invoice' && job.invoiceId) {
      const invoiceRepository = AppDataSource.getRepository(Invoice);
      invoice = await invoiceRepository.findOne({
        where: { id: job.invoiceId },
      });
    }

    // Get settings
    const shopName = (await this.settingsService.findByKey('shop.name')).value as string || 'Meccanico';
    const shopAddress = (await this.settingsService.findByKey('shop.address')).value as string || '';
    const shopPhone = (await this.settingsService.findByKey('shop.phone')).value as string || '';
    const shopEmail = (await this.settingsService.findByKey('shop.email')).value as string || '';
    const invoiceTerms = (await this.settingsService.findByKey('invoice.terms')).value as string || '';
    const invoiceFooter = (await this.settingsService.findByKey('invoice.footer')).value as string || '';
    const currencySymbol = (await this.settingsService.findByKey('currency.symbol')).value as string || '$';
    const taxName = (await this.settingsService.findByKey('tax.name')).value as string || 'GST';

    // Calculate totals
    const subtotal = job.lineItems?.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) || 0;
    let discountTotal = 0;
    if (job.discountPercent > 0) {
      discountTotal = subtotal * (job.discountPercent / 100);
    } else {
      discountTotal = job.discountAmount || 0;
    }
    const afterDiscount = subtotal - discountTotal;
    const taxTotal = afterDiscount * (job.taxRate / 100);
    const grandTotal = afterDiscount + taxTotal;

    // Build HTML template
    const html = buildJobHtmlTemplate({
      job,
      invoice,
      shopName,
      shopAddress,
      shopPhone,
      shopEmail,
      invoiceTerms,
      invoiceFooter,
      currencySymbol,
      taxName,
      type,
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
    });

    // Generate PDF
    const pdfBuffer = await this.pdfService.generateFromHtml(html);

    return pdfBuffer;
  }
}

