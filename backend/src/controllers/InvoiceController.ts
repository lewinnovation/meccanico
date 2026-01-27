import {
  Controller,
  Get,
  Post,
  Delete,
  Route,
  Path,
  Query,
  Body,
  Tags,
  Security,
  Response,
  SuccessResponse,
} from 'tsoa';
import { InvoiceService, CreateInvoiceFromJobDto } from '../services/InvoiceService';
import { CreditNoteService, CreateCreditNoteDto } from '../services/CreditNoteService';
import { Invoice } from '../models/Invoice';
import { CreditNote } from '../models/CreditNote';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

@Route('api/invoices')
@Tags('Invoices')
@Security('jwt')
export class InvoiceController extends Controller {
  private invoiceService = new InvoiceService();
  private creditNoteService = new CreditNoteService();

  /**
   * Create an invoice from a completed job
   */
  @Post('/from-job/{jobId}')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  @SuccessResponse('201', 'Invoice created')
  @Response<NotFoundError>(404, 'Job not found')
  @Response<BadRequestError>(400, 'Job is not completed')
  @Response<BadRequestError>(409, 'Invoice already exists for this job')
  public async createFromJob(@Path() jobId: string): Promise<Invoice> {
    return this.invoiceService.createFromJob(jobId);
  }

  /**
   * Get invoice for a job
   */
  @Get('/job/{jobId}')
  @SuccessResponse('200', 'Invoice found')
  @Response<NotFoundError>(404, 'Invoice not found')
  public async getInvoiceByJob(@Path() jobId: string): Promise<Invoice | null> {
    return this.invoiceService.findByJobId(jobId);
  }

  /**
   * Get invoice by ID
   */
  @Get('/{id}')
  @SuccessResponse('200', 'Invoice found')
  @Response<NotFoundError>(404, 'Invoice not found')
  public async getInvoice(@Path() id: string): Promise<Invoice> {
    return this.invoiceService.findById(id);
  }

  /**
   * Get all invoices with pagination
   */
  @Get('/')
  @SuccessResponse('200', 'Invoices retrieved')
  public async getInvoices(
    @Query() page: number = 1,
    @Query() limit: number = 50,
    @Query() status?: string
  ): Promise<{ data: Invoice[]; total: number; page: number; limit: number }> {
    return this.invoiceService.findAll(page, limit, status as any);
  }

  /**
   * Create a credit note for an invoice
   */
  @Post('/{id}/credit-notes')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  @SuccessResponse('201', 'Credit note created')
  @Response<NotFoundError>(404, 'Invoice not found')
  @Response<BadRequestError>(400, 'Invalid credit note amount or exceeds invoice total')
  public async createCreditNote(
    @Path() id: string,
    @Body() body: Omit<CreateCreditNoteDto, 'invoiceId'>
  ): Promise<CreditNote> {
    this.setStatus(201);
    return this.creditNoteService.create({
      ...body,
      invoiceId: id,
    });
  }

  /**
   * Get all credit notes for an invoice
   */
  @Get('/{id}/credit-notes')
  @SuccessResponse('200', 'Credit notes retrieved')
  @Response<NotFoundError>(404, 'Invoice not found')
  public async getCreditNotes(@Path() id: string): Promise<CreditNote[]> {
    return this.creditNoteService.findByInvoiceId(id);
  }

  /**
   * Get remaining balance for an invoice (invoice total - payments - credit notes)
   */
  @Get('/{id}/remaining-balance')
  @SuccessResponse('200', 'Remaining balance calculated')
  @Response<NotFoundError>(404, 'Invoice not found')
  public async getRemainingBalance(@Path() id: string): Promise<{ remainingBalance: number }> {
    const remainingBalance = await this.invoiceService.getRemainingBalance(id);
    return { remainingBalance };
  }

  /**
   * Delete a credit note
   */
  @Delete('/{invoiceId}/credit-notes/{creditNoteId}')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  @SuccessResponse('204', 'Credit note deleted')
  @Response<NotFoundError>(404, 'Credit note not found')
  public async deleteCreditNote(
    @Path() invoiceId: string,
    @Path() creditNoteId: string
  ): Promise<void> {
    this.setStatus(204);
    await this.creditNoteService.delete(creditNoteId);
  }
}

