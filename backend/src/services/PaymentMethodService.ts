import { AppDataSource } from '../config/database';
import { PaymentMethod } from '../models/PaymentMethod';
import { Payment } from '../models/Payment';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

export interface CreatePaymentMethodDto {
  name: string;
}

export interface UpdatePaymentMethodDto {
  name?: string;
  isActive?: boolean;
}

export class PaymentMethodService {
  private repository = AppDataSource.getRepository(PaymentMethod);
  private paymentRepository = AppDataSource.getRepository(Payment);

  /**
   * Get all active payment methods
   */
  async findAll(): Promise<PaymentMethod[]> {
    return await this.repository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Get all payment methods including inactive (for admin management)
   */
  async findAllIncludingInactive(): Promise<PaymentMethod[]> {
    return await this.repository.find({
      order: { name: 'ASC' },
    });
  }

  /**
   * Get payment method by ID
   */
  async findById(id: string): Promise<PaymentMethod> {
    const paymentMethod = await this.repository.findOne({
      where: { id },
    });

    if (!paymentMethod) {
      throw new NotFoundError('Payment method not found');
    }

    return paymentMethod;
  }

  /**
   * Create a new payment method
   */
  async create(data: CreatePaymentMethodDto): Promise<PaymentMethod> {
    // Check if name already exists
    const existing = await this.repository.findOne({
      where: { name: data.name },
    });

    if (existing) {
      throw new BadRequestError(`Payment method "${data.name}" already exists`);
    }

    const paymentMethod = this.repository.create({
      name: data.name.trim(),
      isActive: true,
    });

    return await this.repository.save(paymentMethod);
  }

  /**
   * Update a payment method
   */
  async update(id: string, data: UpdatePaymentMethodDto): Promise<PaymentMethod> {
    const paymentMethod = await this.findById(id);

    // If updating name, check for duplicates
    if (data.name && data.name !== paymentMethod.name) {
      const existing = await this.repository.findOne({
        where: { name: data.name.trim() },
      });

      if (existing && existing.id !== id) {
        throw new BadRequestError(`Payment method "${data.name}" already exists`);
      }

      paymentMethod.name = data.name.trim();
    }

    if (data.isActive !== undefined) {
      paymentMethod.isActive = data.isActive;
    }

    return await this.repository.save(paymentMethod);
  }

  /**
   * Delete a payment method (soft delete - sets isActive to false)
   * Cannot delete if payment method has been used in any payments
   */
  async delete(id: string): Promise<void> {
    const paymentMethod = await this.findById(id);

    // Check if payment method has been used
    const usageCount = await this.paymentRepository.count({
      where: { paymentMethodId: id },
    });

    if (usageCount > 0) {
      throw new BadRequestError(
        `Cannot delete payment method "${paymentMethod.name}" because it has been used in ${usageCount} payment(s)`
      );
    }

    // Soft delete by setting isActive to false
    paymentMethod.isActive = false;
    await this.repository.save(paymentMethod);
  }

  /**
   * Get usage count for a payment method
   */
  async getUsageCount(id: string): Promise<number> {
    return await this.paymentRepository.count({
      where: { paymentMethodId: id },
    });
  }
}
