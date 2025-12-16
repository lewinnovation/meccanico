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
    @Query() assignedTo?: string
  ): Promise<PaginatedResult<Job>> {
    return this.jobService.findAll(
      page,
      limit,
      search,
      status,
      customerId,
      vehicleId,
      assignedTo
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
  public async createJob(@Body() body: CreateJobDto): Promise<Job> {
    this.setStatus(201);
    return this.jobService.create(body);
  }

  /**
   * Update a job
   */
  @Patch('/{id}')
  public async updateJob(
    @Path() id: string,
    @Body() body: UpdateJobDto
  ): Promise<Job> {
    return this.jobService.update(id, body);
  }

  /**
   * Update job status
   */
  @Post('/{id}/status')
  public async updateJobStatus(
    @Path() id: string,
    @Body() body: { status: JobStatus }
  ): Promise<Job> {
    return this.jobService.updateStatus(id, body.status);
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
    @Body() body: CreateLineItemDto
  ): Promise<LineItem> {
    this.setStatus(201);
    return this.jobService.addLineItem(id, body);
  }

  /**
   * Add multiple line items to a job
   */
  @Post('/{id}/line-items/bulk')
  @SuccessResponse(201, 'Created')
  public async addLineItemsBulk(
    @Path() id: string,
    @Body() body: { items: CreateLineItemDto[] }
  ): Promise<LineItem[]> {
    this.setStatus(201);
    return this.jobService.addLineItemsBulk(id, body.items);
  }

  /**
   * Update a line item
   */
  @Patch('/{id}/line-items/{lineItemId}')
  public async updateLineItem(
    @Path() id: string,
    @Path() lineItemId: string,
    @Body() body: UpdateLineItemDto
  ): Promise<LineItem> {
    return this.jobService.updateLineItem(id, lineItemId, body);
  }

  /**
   * Delete a line item
   */
  @Delete('/{id}/line-items/{lineItemId}')
  @SuccessResponse(204, 'Deleted')
  public async deleteLineItem(
    @Path() id: string,
    @Path() lineItemId: string
  ): Promise<void> {
    this.setStatus(204);
    return this.jobService.deleteLineItem(id, lineItemId);
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

