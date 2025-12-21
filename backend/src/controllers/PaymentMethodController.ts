import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Route,
  Path,
  Body,
  Tags,
  Security,
  Response,
  SuccessResponse,
} from 'tsoa';
import {
  PaymentMethodService,
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
} from '../services/PaymentMethodService';
import { PaymentMethod } from '../models/PaymentMethod';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

@Route('api/payment-methods')
@Tags('Payment Methods')
@Security('jwt')
export class PaymentMethodController extends Controller {
  private paymentMethodService = new PaymentMethodService();

  /**
   * Get all active payment methods
   */
  @Get('/')
  @SuccessResponse('200', 'Payment methods retrieved')
  public async getPaymentMethods(): Promise<PaymentMethod[]> {
    return this.paymentMethodService.findAll();
  }

  /**
   * Get all payment methods including inactive (Admin only)
   */
  @Get('/all')
  @Security('jwt', ['ADMIN'])
  @SuccessResponse('200', 'All payment methods retrieved')
  public async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    return this.paymentMethodService.findAllIncludingInactive();
  }

  /**
   * Get payment method by ID
   */
  @Get('/{id}')
  @SuccessResponse('200', 'Payment method found')
  @Response<NotFoundError>(404, 'Payment method not found')
  public async getPaymentMethod(@Path() id: string): Promise<PaymentMethod> {
    return this.paymentMethodService.findById(id);
  }

  /**
   * Create a new payment method (Admin only)
   */
  @Post('/')
  @Security('jwt', ['ADMIN'])
  @SuccessResponse('201', 'Payment method created')
  @Response<BadRequestError>(400, 'Payment method name already exists')
  public async createPaymentMethod(
    @Body() body: CreatePaymentMethodDto
  ): Promise<PaymentMethod> {
    this.setStatus(201);
    return this.paymentMethodService.create(body);
  }

  /**
   * Update a payment method (Admin only)
   */
  @Put('/{id}')
  @Security('jwt', ['ADMIN'])
  @SuccessResponse('200', 'Payment method updated')
  @Response<NotFoundError>(404, 'Payment method not found')
  @Response<BadRequestError>(400, 'Payment method name already exists')
  public async updatePaymentMethod(
    @Path() id: string,
    @Body() body: UpdatePaymentMethodDto
  ): Promise<PaymentMethod> {
    return this.paymentMethodService.update(id, body);
  }

  /**
   * Delete a payment method (Admin only)
   * Cannot delete if payment method has been used
   */
  @Delete('/{id}')
  @Security('jwt', ['ADMIN'])
  @SuccessResponse('204', 'Payment method deleted')
  @Response<NotFoundError>(404, 'Payment method not found')
  @Response<BadRequestError>(400, 'Cannot delete payment method that has been used')
  public async deletePaymentMethod(@Path() id: string): Promise<void> {
    this.setStatus(204);
    await this.paymentMethodService.delete(id);
  }

  /**
   * Get usage counts for all payment methods (Admin only)
   */
  @Get('/usage-counts')
  @Security('jwt', ['ADMIN'])
  @SuccessResponse('200', 'Usage counts retrieved')
  public async getUsageCounts(): Promise<Record<string, number>> {
    const methods = await this.paymentMethodService.findAllIncludingInactive();
    const counts: Record<string, number> = {};
    
    for (const method of methods) {
      counts[method.id] = await this.paymentMethodService.getUsageCount(method.id);
    }
    
    return counts;
  }
}
