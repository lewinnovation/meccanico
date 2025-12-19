import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Path,
  Query,
  Route,
  Tags,
  Security,
  SuccessResponse,
  Request,
} from 'tsoa';
import {
  JobService,
  CreateJobDto,
  UpdateJobDto,
  CreateLineItemDto,
  UpdateLineItemDto,
  PaginatedResult,
} from '../services/JobService';
import { Job, JobStatus } from '../models/Job';
import { LineItem } from '../models/LineItem';
import { User } from '../models/User';

@Route('api/jobs')
@Tags('Jobs')
@Security('jwt')
export class JobController extends Controller {
  private jobService = new JobService();

  /**
   * Get all jobs with pagination and filters
   */
  @Get('/')
  public async getJobs(
    @Query() page: number = 1,
    @Query() limit: number = 50,
    @Query() search?: string,
    @Query() status?: JobStatus,
    @Query() customerId?: string,
    @Query() vehicleId?: string,
    @Query() assignedTo?: string,
    @Query() startDate?: string,
    @Query() endDate?: string,
    @Query() hasInvoice?: boolean,
    @Query() invoicePaid?: boolean
  ): Promise<PaginatedResult<Job>> {
    return this.jobService.findAll(
      page,
      limit,
      search,
      status,
      customerId,
      vehicleId,
      assignedTo,
      startDate,
      endDate,
      hasInvoice,
      invoicePaid
    );
  }

  /**
   * Get a job by ID
   */
  @Get('/{id}')
  public async getJob(@Path() id: string): Promise<Job> {
    return this.jobService.findById(id);
  }

  /**
   * Get a job by code
   */
  @Get('/code/{code}')
  public async getJobByCode(@Path() code: string): Promise<Job> {
    return this.jobService.findByCode(code);
  }

  /**
   * Create a new job
   */
  @Post('/')
  @SuccessResponse(201, 'Created')
  public async createJob(
    @Body() body: CreateJobDto,
    @Request() request: { user: User }
  ): Promise<Job> {
    this.setStatus(201);
    return this.jobService.create(body, request.user?.id);
  }

  /**
   * Update a job
   */
  @Patch('/{id}')
  public async updateJob(
    @Path() id: string,
    @Body() body: UpdateJobDto,
    @Request() request: { user: User }
  ): Promise<Job> {
    console.log('DEBUG: updateJob called with id:', id);
    console.log('DEBUG: updateJob body:', JSON.stringify(body, null, 2));
    return this.jobService.update(id, body, request.user?.id);
  }

  /**
   * Update job status
   */
  @Post('/{id}/status')
  public async updateJobStatus(
    @Path() id: string,
    @Body() body: { status: JobStatus },
    @Request() request: { user: User }
  ): Promise<Job> {
    return this.jobService.updateStatus(id, body.status, request.user?.id);
  }

  /**
   * Delete a job (only if in ESTIMATE status)
   */
  @Delete('/{id}')
  @SuccessResponse(204, 'Deleted')
  public async deleteJob(@Path() id: string): Promise<void> {
    this.setStatus(204);
    return this.jobService.delete(id);
  }

  /**
   * Duplicate a job as a new estimate
   */
  @Post('/{id}/duplicate')
  @SuccessResponse(201, 'Created')
  public async duplicateJob(@Path() id: string): Promise<Job> {
    this.setStatus(201);
    return this.jobService.duplicate(id);
  }

  /**
   * Apply a template to a job
   */
  @Post('/{id}/apply-template/{templateId}')
  public async applyTemplate(
    @Path() id: string,
    @Path() templateId: string
  ): Promise<Job> {
    return this.jobService.applyTemplate(id, templateId);
  }

  // Line Item Endpoints

  /**
   * Get all line items for a job
   */
  @Get('/{id}/line-items')
  public async getLineItems(@Path() id: string): Promise<LineItem[]> {
    const job = await this.jobService.findById(id);
    return job.lineItems || [];
  }

  /**
   * Add a line item to a job
   */
  @Post('/{id}/line-items')
  @SuccessResponse(201, 'Created')
  public async addLineItem(
    @Path() id: string,
    @Body() body: CreateLineItemDto,
    @Request() request: { user: User }
  ): Promise<LineItem> {
    this.setStatus(201);
    return this.jobService.addLineItem(id, body, request.user?.id);
  }

  /**
   * Add multiple line items to a job
   */
  @Post('/{id}/line-items/bulk')
  @SuccessResponse(201, 'Created')
  public async addLineItemsBulk(
    @Path() id: string,
    @Body() body: { items: CreateLineItemDto[] },
    @Request() request: { user: User }
  ): Promise<LineItem[]> {
    this.setStatus(201);
    return this.jobService.addLineItemsBulk(id, body.items, request.user?.id);
  }

  /**
   * Update a line item
   */
  @Patch('/{id}/line-items/{lineItemId}')
  public async updateLineItem(
    @Path() id: string,
    @Path() lineItemId: string,
    @Body() body: UpdateLineItemDto,
    @Request() request: { user: User }
  ): Promise<LineItem> {
    return this.jobService.updateLineItem(id, lineItemId, body, request.user?.id);
  }

  /**
   * Delete a line item
   */
  @Delete('/{id}/line-items/{lineItemId}')
  @SuccessResponse(204, 'Deleted')
  public async deleteLineItem(
    @Path() id: string,
    @Path() lineItemId: string,
    @Request() request: { user: User }
  ): Promise<void> {
    this.setStatus(204);
    return this.jobService.deleteLineItem(id, lineItemId, request.user?.id);
  }

  /**
   * Reorder line items
   */
  @Post('/{id}/line-items/reorder')
  public async reorderLineItems(
    @Path() id: string,
    @Body() body: { items: { id: string; sortOrder: number }[] }
  ): Promise<LineItem[]> {
    return this.jobService.reorderLineItems(id, body.items);
  }
}

