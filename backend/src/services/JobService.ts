import { AppDataSource } from '../config/database';
import { Job, JobStatus } from '../models/Job';
import { LineItem, LineItemType } from '../models/LineItem';
import { Template } from '../models/Template';
import { Vehicle } from '../models/Vehicle';
import { Customer } from '../models/Customer';
import { Invoice } from '../models/Invoice';
import { VehicleOwner } from '../models/VehicleOwner';
import { VehicleOdometerReading } from '../models/VehicleOdometerReading';
import { generateJobCode } from '../utils/codeGenerator';
import { NotFoundError, ConflictError, BadRequestError, VersionConflictError, UnauthorizedError } from '../middleware/errorHandler';
import { OptimisticLockVersionMismatchError } from 'typeorm';
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
  odometer?: number;
  odometerUnit?: string;
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
  odometer?: number;
  odometerUnit?: string;
  version?: number;
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
  version?: number;
}

export { PaginatedResult };

export class JobService {
  private repository = AppDataSource.getRepository(Job);
  private lineItemRepository = AppDataSource.getRepository(LineItem);
  private templateRepository = AppDataSource.getRepository(Template);
  private vehicleRepository = AppDataSource.getRepository(Vehicle);
  private vehicleOwnerRepository = AppDataSource.getRepository(VehicleOwner);
  private odometerReadingRepository = AppDataSource.getRepository(VehicleOdometerReading);
  private pdfService = new PdfService();
  private settingsService = new SettingsService();

  /**
   * Convert odometer reading to base unit (km)
   */
  private convertToBaseUnit(value: number, unit: string): number {
    switch (unit.toLowerCase()) {
      case 'miles':
        return Math.round(value * 1.60934); // Convert miles to km
      case 'hours':
        return value; // Hours are stored as-is (no conversion)
      case 'km':
      default:
        return value;
    }
  }

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
    invoicePaid?: boolean,
    userId?: string,
    userRole?: string
  ): Promise<PaginatedResult<Job>> {
    const queryBuilder = this.repository.createQueryBuilder('job')
      .leftJoinAndSelect('job.customer', 'customer')
      .leftJoinAndSelect('job.vehicle', 'vehicle')
      .leftJoinAndSelect('job.assignee', 'assignee')
      .leftJoinAndSelect('job.lineItems', 'lineItems')
      .leftJoinAndSelect('job.invoice', 'invoice');

    // VIEWER can see all jobs (read-only access)
    // No filtering needed - VIEWER restrictions are enforced at the endpoint level

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

    // Only apply assignedTo filter if user is not VIEWER (VIEWER filter already applied above)
    if (assignedTo && userRole !== 'VIEWER') {
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

  async findById(id: string, userId?: string, userRole?: string): Promise<Job> {
    const job = await this.repository.findOne({
      where: { id },
      relations: ['customer', 'vehicle', 'assignee', 'lineItems', 'invoice'],
      order: { lineItems: { sortOrder: 'ASC' } },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // VIEWER can view all jobs (read-only access)
    // Edit restrictions are enforced at the endpoint level

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

      // Check if customer is in vehicle's owners list
      const isOwner = vehicle.vehicleOwners?.some(
        vo => vo.customerId === customerId
      );

      // If customer is not an owner, automatically add them as an owner
      if (!isOwner) {
        const vehicleOwnerRepository = AppDataSource.getRepository(VehicleOwner);
        // Check if relationship already exists (race condition protection)
        const existingOwner = await vehicleOwnerRepository.findOne({
          where: {
            vehicleId: data.vehicleId,
            customerId: customerId,
          },
        });
        
        if (!existingOwner) {
          const vehicleOwner = vehicleOwnerRepository.create({
            vehicleId: data.vehicleId,
            customerId: customerId,
            isPrimary: false, // Don't make new owners primary by default
          });
          await vehicleOwnerRepository.save(vehicleOwner);
        }
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
      odometer: data.odometer || null,
      odometerUnit: data.odometerUnit || null,
    });

    const savedJob = await this.repository.save(job);
    
    // Handle odometer reading if provided
    if (data.odometer !== undefined && data.odometer !== null && data.odometerUnit && savedJob.vehicleId) {
      const readingInBaseUnit = this.convertToBaseUnit(data.odometer, data.odometerUnit);
      
      // Check for decreasing odometer
      const vehicle = await this.vehicleRepository.findOne({
        where: { id: savedJob.vehicleId },
      });
      
      let warning: string | undefined;
      if (vehicle && vehicle.odometer !== null && readingInBaseUnit < vehicle.odometer) {
        warning = `Warning: Job odometer reading (${data.odometer} ${data.odometerUnit}) is less than current vehicle odometer (${vehicle.odometer} km).`;
      }
      
      // Create odometer reading record
      const odometerReading = this.odometerReadingRepository.create({
        vehicleId: savedJob.vehicleId,
        jobId: savedJob.id,
        reading: readingInBaseUnit,
        unit: data.odometerUnit,
        source: 'job',
        notes: null,
        createdBy: userId || null,
      });
      
      await this.odometerReadingRepository.save(odometerReading);
      
      // Note: We don't automatically update vehicle odometer from job readings
      // The vehicle odometer is updated separately via ad-hoc entries
    }
    
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
        odometer: savedJob.odometer,
        odometerUnit: savedJob.odometerUnit,
      }
    );
    
    return this.findById(savedJob.id);
  }

  async update(id: string, data: UpdateJobDto, userId?: string | null): Promise<Job> {
    console.log('DEBUG: update called with:', { id, data });
    // Load job WITHOUT relations first to ensure TypeORM tracks changes to foreign key columns
    // If we load with relations, TypeORM might not detect changes to customerId/vehicleId
    const job = await this.repository.findOne({
      where: { id },
    });
    
    if (!job) {
      throw new NotFoundError('Job not found');
    }
    
    console.log('DEBUG: found job (no relations):', { id: job.id, customerId: job.customerId, vehicleId: job.vehicleId, version: job.version });
    
    // Check version if provided
    if (data.version !== undefined && data.version !== job.version) {
      throw new VersionConflictError(
        'This job has been modified by another user. Please refresh and try again.'
      );
    }
    
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
      odometer: job.odometer,
      odometerUnit: job.odometerUnit,
    };

    // Check if both discount types are provided
    if (data.discountAmount && data.discountPercent) {
      throw new BadRequestError('Cannot have both discount amount and discount percent');
    }

    // Customer and vehicle can only be changed in BOOKED status
    const isChangingCustomer = data.customerId !== undefined && data.customerId !== job.customerId;
    const isChangingVehicle = data.vehicleId !== undefined && data.vehicleId !== (job.vehicleId || null);

    if ((isChangingCustomer || isChangingVehicle) && job.status !== JobStatus.BOOKED) {
      throw new ConflictError('Customer and vehicle can only be changed when job is in BOOKED status');
    }

    // Verify customer exists if provided
    if (data.customerId !== undefined) {
      const customerRepository = AppDataSource.getRepository(Customer);
      const customer = await customerRepository.findOne({
        where: { id: data.customerId },
      });

      if (!customer) {
        throw new NotFoundError('Customer not found');
      }
    }

    // Verify vehicle exists if provided
    if (data.vehicleId !== undefined && data.vehicleId !== null) {
      const vehicle = await this.vehicleRepository.findOne({
        where: { id: data.vehicleId },
      });

      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }
    }

    // Update the job entity using TypeORM entity methods
    // Explicitly set customer and vehicle IDs if provided
    if (data.customerId !== undefined) {
      console.log('DEBUG: Setting customerId from', job.customerId, 'to', data.customerId);
      job.customerId = data.customerId;
    }
    if (data.vehicleId !== undefined) {
      console.log('DEBUG: Setting vehicleId from', job.vehicleId, 'to', data.vehicleId);
      job.vehicleId = data.vehicleId;
    }

    // If only changing customer (no vehicle specified), clear vehicle
    if (isChangingCustomer && data.vehicleId === undefined && !isChangingVehicle) {
      job.vehicleId = null;
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
    if (data.odometer !== undefined) {
      job.odometer = data.odometer || null;
    }
    if (data.odometerUnit !== undefined) {
      job.odometerUnit = data.odometerUnit || null;
    }

    console.log('DEBUG: Before save - job entity:', {
      id: job.id,
      customerId: job.customerId,
      vehicleId: job.vehicleId,
      taxRate: job.taxRate,
    });

    // Save using TypeORM entity save method
    // TypeORM will automatically increment version on save
    let savedJob: Job;
    try {
      savedJob = await this.repository.save(job);
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new VersionConflictError(
          'This job has been modified by another user. Please refresh and try again.'
        );
      }
      throw error;
    }
    
    console.log('DEBUG: After save - saved job:', {
      id: savedJob.id,
      customerId: savedJob.customerId,
      vehicleId: savedJob.vehicleId,
      taxRate: savedJob.taxRate,
      version: savedJob.version,
    });
    
    // Handle odometer reading if provided and vehicle exists
    if (data.odometer !== undefined && data.odometer !== null && data.odometerUnit && savedJob.vehicleId) {
      const readingInBaseUnit = this.convertToBaseUnit(data.odometer, data.odometerUnit);
      
      // Check if odometer reading already exists for this job
      const existingReading = await this.odometerReadingRepository.findOne({
        where: { jobId: savedJob.id },
      });
      
      if (existingReading) {
        // Update existing reading
        existingReading.reading = readingInBaseUnit;
        existingReading.unit = data.odometerUnit;
        await this.odometerReadingRepository.save(existingReading);
      } else {
        // Create new reading
        const odometerReading = this.odometerReadingRepository.create({
          vehicleId: savedJob.vehicleId,
          jobId: savedJob.id,
          reading: readingInBaseUnit,
          unit: data.odometerUnit,
          source: 'job',
          notes: null,
          createdBy: userId || null,
        });
        
        await this.odometerReadingRepository.save(odometerReading);
      }
      
      // Check for decreasing odometer warning
      const vehicle = await this.vehicleRepository.findOne({
        where: { id: savedJob.vehicleId },
      });
      
      if (vehicle && vehicle.odometer !== null && readingInBaseUnit < vehicle.odometer) {
        // Warning is logged but doesn't prevent save
        console.warn(`Warning: Job ${savedJob.code} odometer reading (${data.odometer} ${data.odometerUnit}) is less than current vehicle odometer (${vehicle.odometer} km).`);
      }
    } else if (data.odometer === null && savedJob.vehicleId) {
      // Remove odometer reading if explicitly set to null
      const existingReading = await this.odometerReadingRepository.findOne({
        where: { jobId: savedJob.id },
      });
      
      if (existingReading) {
        await this.odometerReadingRepository.remove(existingReading);
      }
    }
    
    // Create audit log
    const newValue = {
      customerId: savedJob.customerId,
      vehicleId: savedJob.vehicleId,
      assignedTo: savedJob.assignedTo,
      notes: savedJob.notes,
      internalNotes: savedJob.internalNotes,
      taxRate: savedJob.taxRate,
      discountAmount: savedJob.discountAmount,
      discountPercent: savedJob.discountPercent,
      dueDate: savedJob.dueDate,
      status: savedJob.status,
      odometer: savedJob.odometer,
      odometerUnit: savedJob.odometerUnit,
    };
    
    await createAuditLog(
      userId || null,
      AuditAction.UPDATE,
      'Job',
      id,
      oldValue,
      newValue
    );
    
    // Reload the job with all relations to ensure we return fresh data
    // Use query builder to bypass any potential caching issues
    const updatedJob = await this.repository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.customer', 'customer')
      .leftJoinAndSelect('job.vehicle', 'vehicle')
      .leftJoinAndSelect('job.assignee', 'assignee')
      .leftJoinAndSelect('job.lineItems', 'lineItems')
      .leftJoinAndSelect('job.invoice', 'invoice')
      .where('job.id = :id', { id })
      .orderBy('lineItems.sortOrder', 'ASC')
      .getOne();

    if (!updatedJob) {
      throw new NotFoundError('Job not found after update');
    }

    console.log('DEBUG: After reload - updated job:', {
      id: updatedJob.id,
      customerId: updatedJob.customerId,
      vehicleId: updatedJob.vehicleId,
      customer: updatedJob.customer ? { id: updatedJob.customer.id, name: updatedJob.customer.name } : null,
      vehicle: updatedJob.vehicle ? { id: updatedJob.vehicle.id, make: updatedJob.vehicle.make, model: updatedJob.vehicle.model } : null,
    });

    return updatedJob;
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

    // Check version if provided
    if (data.version !== undefined && data.version !== lineItem.version) {
      throw new VersionConflictError(
        'This line item has been modified by another user. Please refresh and try again.'
      );
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
    
    let savedItem: LineItem;
    try {
      savedItem = await this.lineItemRepository.save(lineItem);
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new VersionConflictError(
          'This line item has been modified by another user. Please refresh and try again.'
        );
      }
      throw error;
    }
    
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
    const preInvoiceLabel = (await this.settingsService.findByKey('invoice.pre_invoice_label')).value as string || 'Pre Invoice';
    const invoiceLabel = (await this.settingsService.findByKey('invoice.invoice_label')).value as string || 'Invoice';

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
      preInvoiceLabel,
      invoiceLabel,
    });

    // Generate PDF
    const pdfBuffer = await this.pdfService.generateFromHtml(html);

    return pdfBuffer;
  }
}

