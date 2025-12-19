import { AppDataSource } from '../config/database';
import { Job, JobStatus } from '../models/Job';
import { LineItem, LineItemType } from '../models/LineItem';
import { Template } from '../models/Template';
import { Vehicle } from '../models/Vehicle';
import { Customer } from '../models/Customer';
import { generateJobCode } from '../utils/codeGenerator';
import { NotFoundError, ConflictError, BadRequestError } from '../middleware/errorHandler';
import { PaginatedResult } from '../types/common';

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
      queryBuilder.andWhere(
        '(job.code ILIKE :search OR customer.name ILIKE :search OR vehicle.make ILIKE :search OR vehicle.model ILIKE :search)',
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

  async create(data: CreateJobDto): Promise<Job> {
    // Verify vehicle belongs to customer if vehicleId is provided
    if (data.vehicleId) {
      const vehicle = await this.vehicleRepository.findOne({
        where: { id: data.vehicleId },
      });

      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      if (vehicle.customerId !== data.customerId) {
        throw new BadRequestError('Vehicle does not belong to the specified customer');
      }
    }

    const code = await generateJobCode();

    const job = this.repository.create({
      code,
      customerId: data.customerId,
      vehicleId: data.vehicleId || null,
      assignedTo: data.assignedTo,
      notes: data.notes,
      taxRate: data.taxRate ?? 0,
      status: JobStatus.BOOKED,
    });

    const savedJob = await this.repository.save(job);
    return this.findById(savedJob.id);
  }

  async update(id: string, data: UpdateJobDto): Promise<Job> {
    const job = await this.findById(id);

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

    // If changing vehicle, verify it exists and belongs to the (potentially new) customer
    if (isChangingVehicle) {
      const vehicle = await this.vehicleRepository.findOne({
        where: { id: data.vehicleId },
      });

      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      const targetCustomerId = data.customerId || job.customerId;
      if (vehicle.customerId !== targetCustomerId) {
        throw new BadRequestError('Vehicle must belong to the selected customer');
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
    return this.findById(id);
  }

  async updateStatus(id: string, newStatus: JobStatus): Promise<Job> {
    const job = await this.findById(id);

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
  async addLineItem(jobId: string, data: CreateLineItemDto): Promise<LineItem> {
    const job = await this.findById(jobId);

    // Allow adding items to jobs that are not yet completed
    if (job.status === JobStatus.COMPLETED) {
      throw new ConflictError('Cannot add items to completed jobs');
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

    return this.lineItemRepository.save(lineItem);
  }

  async updateLineItem(
    jobId: string,
    lineItemId: string,
    data: UpdateLineItemDto
  ): Promise<LineItem> {
    const job = await this.findById(jobId);

    // Allow updating items on jobs that are not yet completed
    if (job.status === JobStatus.COMPLETED) {
      throw new ConflictError('Cannot update items on completed jobs');
    }

    const lineItem = await this.lineItemRepository.findOne({
      where: { id: lineItemId, jobId },
    });

    if (!lineItem) {
      throw new NotFoundError('Line item not found');
    }

    Object.assign(lineItem, data);
    return this.lineItemRepository.save(lineItem);
  }

  async deleteLineItem(jobId: string, lineItemId: string): Promise<void> {
    const job = await this.findById(jobId);

    // Allow deleting items from jobs that are not yet completed
    if (job.status === JobStatus.COMPLETED) {
      throw new ConflictError('Cannot delete items from completed jobs');
    }

    await this.lineItemRepository.delete({ id: lineItemId, jobId });
  }

  async reorderLineItems(
    jobId: string,
    items: { id: string; sortOrder: number }[]
  ): Promise<LineItem[]> {
    await this.findById(jobId);

    for (const item of items) {
      await this.lineItemRepository.update(
        { id: item.id, jobId },
        { sortOrder: item.sortOrder }
      );
    }

    const job = await this.findById(jobId);
    return job.lineItems;
  }

  async applyTemplate(jobId: string, templateId: string): Promise<Job> {
    const job = await this.findById(jobId);

    // Allow applying templates to jobs that are not yet completed
    if (job.status === JobStatus.COMPLETED) {
      throw new ConflictError('Cannot apply templates to completed jobs');
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
    items: CreateLineItemDto[]
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

    return this.lineItemRepository.save(lineItems);
  }
}

