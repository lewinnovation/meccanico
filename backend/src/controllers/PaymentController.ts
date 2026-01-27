import {
  Controller,
  Get,
  Post,
  Delete,
  Route,
  Path,
  Body,
  Tags,
  Security,
  Response,
  SuccessResponse,
} from 'tsoa';
import { PaymentService, CreatePaymentDto, CreatePaymentBulkDto, BulkCreatePaymentsDto } from '../services/PaymentService';
import { Payment } from '../models/Payment';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

@Route('api/invoices')
@Tags('Payments')
@Security('jwt')
export class PaymentController extends Controller {
  private paymentService = new PaymentService();

  /**
   * Create a payment for an invoice
   */
  @Post('/{invoiceId}/payments')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  @SuccessResponse('201', 'Payment created')
  @Response<NotFoundError>(404, 'Invoice or payment method not found')
  @Response<BadRequestError>(400, 'Invalid payment amount or exceeds remaining balance')
  public async createPayment(
    @Path() invoiceId: string,
    @Body() body: Omit<CreatePaymentDto, 'invoiceId'>
  ): Promise<Payment> {
    this.setStatus(201);
    return this.paymentService.create({
      ...body,
      invoiceId,
    });
  }

  /**
   * Bulk create payments for an invoice (admin only)
   */
  @Post('/{invoiceId}/payments/bulk')
  @Security('jwt', ['ADMIN'])
  @SuccessResponse('201', 'Payments created')
  @Response<NotFoundError>(404, 'Invoice or payment method not found')
  @Response<BadRequestError>(400, 'Invalid payment amount or exceeds remaining balance')
  public async createPaymentsBulk(
    @Path() invoiceId: string,
    @Body() body: BulkCreatePaymentsDto
  ): Promise<Payment[]> {
    if (body.items.length > 100) {
      throw new BadRequestError('Cannot create more than 100 payments at once');
    }
    this.setStatus(201);
    return this.paymentService.createBulk(invoiceId, body.items);
  }

  /**
   * Get all payments for an invoice
   */
  @Get('/{invoiceId}/payments')
  @SuccessResponse('200', 'Payments retrieved')
  @Response<NotFoundError>(404, 'Invoice not found')
  public async getPayments(@Path() invoiceId: string): Promise<Payment[]> {
    return this.paymentService.findByInvoiceId(invoiceId);
  }

  /**
   * Delete a payment
   */
  @Delete('/{invoiceId}/payments/{paymentId}')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  @SuccessResponse('204', 'Payment deleted')
  @Response<NotFoundError>(404, 'Payment not found')
  public async deletePayment(
    @Path() invoiceId: string,
    @Path() paymentId: string
  ): Promise<void> {
    this.setStatus(204);
    await this.paymentService.delete(paymentId);
  }
}
