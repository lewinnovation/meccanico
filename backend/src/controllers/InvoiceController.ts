import {
  Controller,
  Get,
  Post,
  Patch,
  Route,
  Path,
  Query,
  Body,
  Tags,
  Security,
  Response,
  SuccessResponse,
} from 'tsoa';
import { InvoiceService, CreateInvoiceFromJobDto, MarkInvoicePaidDto } from '../services/InvoiceService';
import { Invoice } from '../models/Invoice';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

@Route('api/invoices')
@Tags('Invoices')
@Security('jwt')
export class InvoiceController extends Controller {
  private invoiceService = new InvoiceService();

  /**
   * Create an invoice from a completed job
   */
  @Post('from-job/{jobId}')
  @SuccessResponse('201', 'Invoice created')
  @Response<NotFoundError>(404, 'Job not found')
  @Response<BadRequestError>(400, 'Job is not completed')
  @Response<BadRequestError>(409, 'Invoice already exists for this job')
  public async createFromJob(@Path() jobId: string): Promise<Invoice> {
    return this.invoiceService.createFromJob(jobId);
  }

  /**
   * Mark an invoice as paid
   */
  @Patch('{id}/pay')
  @SuccessResponse('200', 'Invoice marked as paid')
  @Response<NotFoundError>(404, 'Invoice not found')
  @Response<BadRequestError>(400, 'Invoice is already paid')
  public async markAsPaid(
    @Path() id: string,
    @Body() body: MarkInvoicePaidDto
  ): Promise<Invoice> {
    return this.invoiceService.markAsPaid(id, body);
  }

  /**
   * Get invoice by ID
   */
  @Get('{id}')
  @SuccessResponse('200', 'Invoice found')
  @Response<NotFoundError>(404, 'Invoice not found')
  public async getInvoice(@Path() id: string): Promise<Invoice> {
    return this.invoiceService.findById(id);
  }

  /**
   * Get invoice for a job
   */
  @Get('job/{jobId}')
  @SuccessResponse('200', 'Invoice found')
  @Response<NotFoundError>(404, 'Invoice not found')
  public async getInvoiceByJob(@Path() jobId: string): Promise<Invoice | null> {
    return this.invoiceService.findByJobId(jobId);
  }

  /**
   * Get all invoices with pagination
   */
  @Get()
  @SuccessResponse('200', 'Invoices retrieved')
  public async getInvoices(
    @Query() page: number = 1,
    @Query() limit: number = 50,
    @Query() status?: string
  ): Promise<{ data: Invoice[]; total: number; page: number; limit: number }> {
    return this.invoiceService.findAll(page, limit, status as any);
  }
}

