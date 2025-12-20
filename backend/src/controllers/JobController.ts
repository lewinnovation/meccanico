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
  Response,
} from 'tsoa';
import { Readable } from 'stream';
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
import { BadRequestError } from '../middleware/errorHandler';
import { EmailService } from '../services/EmailService';
import { CommunicationTemplateService } from '../services/CommunicationTemplateService';
import { CommunicationTemplateType, CommunicationTemplateAction } from '../models/CommunicationTemplate';
import { buildTemplateVariables, renderTemplate } from '../utils/templateRenderer';
import { SettingsService } from '../services/SettingsService';

@Route('api/jobs')
@Tags('Jobs')
@Security('jwt')
export class JobController extends Controller {
  private jobService = new JobService();
  private emailService = new EmailService();
  private templateService = new CommunicationTemplateService();
  private settingsService = new SettingsService();

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

  /**
   * Download PDF for a job (estimate or invoice)
   */
  @Get('/{id}/pdf')
  @Response<BadRequestError>(400, 'Invalid type or job does not have invoice')
  public async downloadPdf(
    @Path() id: string,
    @Query() type: 'estimate' | 'invoice'
  ): Promise<Readable> {
    try {
      console.log(`Generating PDF for job ${id}, type: ${type}`);
      const job = await this.jobService.findById(id);
      console.log(`Job found: ${job.code}`);
      
      const pdfBuffer = await this.jobService.generatePdf(id, type);
      console.log(`PDF generated, size: ${pdfBuffer.length} bytes`);
      
      const filename = `${type}-${job.code}.pdf`;
      
      // Set response headers for PDF download
      this.setHeader('Content-Type', 'application/pdf');
      this.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      this.setHeader('Content-Length', pdfBuffer.length.toString());
      
      // Convert Buffer to Readable stream for TSOA to handle binary data correctly
      const stream = Readable.from(pdfBuffer);
      console.log(`PDF stream created successfully`);
      
      return stream;
    } catch (error) {
      console.error('Error generating PDF:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        jobId: id,
        type,
      });
      // Re-throw to let error handler process it
      throw error;
    }
  }

  /**
   * Send PDF via email for a job (estimate or invoice)
   */
  @Post('/{id}/email')
  @Response<BadRequestError>(400, 'Invalid type, job does not have invoice, or customer email missing')
  @SuccessResponse(200, 'Email sent successfully')
  public async sendEmail(
    @Path() id: string,
    @Body() body: { type: 'estimate' | 'invoice'; recipientEmail?: string; customMessage?: string }
  ): Promise<{ message: string }> {
    try {
      const job = await this.jobService.findById(id);

      // Validate type
      if (body.type === 'invoice' && !job.invoiceId) {
        throw new BadRequestError('Job does not have an invoice');
      }

      // Determine recipient email
      const recipientEmail = body.recipientEmail || job.customer?.email;
      if (!recipientEmail) {
        throw new BadRequestError('Customer email is required. Please provide recipientEmail.');
      }

      // Get template based on type
      const templateAction = body.type === 'invoice' 
        ? CommunicationTemplateAction.EMAIL_INVOICE 
        : CommunicationTemplateAction.EMAIL_ESTIMATE;
      
      const template = await this.templateService.findByActionAndType(
        templateAction,
        CommunicationTemplateType.EMAIL
      );

      if (!template) {
        throw new BadRequestError(`Email template for ${body.type} not found. Please create a template in Settings.`);
      }

      // Build template variables
      const variables = await buildTemplateVariables(job, this.settingsService, body.type);

      // Render subject and body
      const subject = template.subject ? renderTemplate(template.subject, variables) : `${body.type === 'invoice' ? 'Invoice' : 'Estimate'} - ${job.code}`;
      const bodyText = body.customMessage || renderTemplate(template.body, variables);

      // Generate PDF
      const pdfBuffer = await this.jobService.generatePdf(id, body.type);
      const filename = `${body.type}-${job.code}.pdf`;

      // Send email with PDF attachment
      await this.emailService.sendEmail(
        recipientEmail,
        subject,
        bodyText,
        [
          {
            filename,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ]
      );

      return { message: `Email sent successfully to ${recipientEmail}` };
    } catch (error) {
      console.error('Error sending email:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        jobId: id,
        type: body.type,
      });
      throw error;
    }
  }
}

