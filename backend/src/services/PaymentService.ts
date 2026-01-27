import { AppDataSource } from '../config/database';
import { Payment } from '../models/Payment';
import { Invoice, InvoiceStatus } from '../models/Invoice';
import { PaymentMethod } from '../models/PaymentMethod';
import { CreditNote } from '../models/CreditNote';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { In } from 'typeorm';

export interface CreatePaymentDto {
  invoiceId: string;
  paymentMethodId: string;
  amount: number;
  paymentDate?: Date;
  paymentNote?: string;
}

export interface CreatePaymentBulkDto extends Omit<CreatePaymentDto, 'invoiceId'> {
  // invoiceId is provided in the path, not in the DTO
}

export interface BulkCreatePaymentsDto {
  items: CreatePaymentBulkDto[];
}

export class PaymentService {
  private repository = AppDataSource.getRepository(Payment);
  private invoiceRepository = AppDataSource.getRepository(Invoice);
  private paymentMethodRepository = AppDataSource.getRepository(PaymentMethod);
  private creditNoteRepository = AppDataSource.getRepository(CreditNote);

  /**
   * Calculate invoice total from job line items
   */
  private calculateInvoiceTotal(invoice: Invoice): number {
    if (!invoice.job || !invoice.job.lineItems) {
      return 0;
    }

    const subtotal = invoice.job.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    let discount = 0;
    if (invoice.job.discountPercent && invoice.job.discountPercent > 0) {
      discount = subtotal * (invoice.job.discountPercent / 100);
    } else {
      discount = invoice.job.discountAmount || 0;
    }

    const afterDiscount = Math.max(0, subtotal - discount);
    const gst = afterDiscount * ((invoice.job.taxRate || 0) / 100);
    const total = afterDiscount + gst;

    return total;
  }

  /**
   * Get total payments for an invoice
   */
  async getTotalPaid(invoiceId: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.invoiceId = :invoiceId', { invoiceId })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  /**
   * Calculate remaining balance for an invoice
   * Remaining = Invoice Total - Total Payments - Total Credit Notes (post-tax)
   */
  async getRemainingBalance(invoiceId: string): Promise<number> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['job', 'job.lineItems'],
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    const invoiceTotal = this.calculateInvoiceTotal(invoice); // Post-tax
    const totalPaid = await this.getTotalPaid(invoiceId);
    
    // Get credit notes total (post-tax) - query directly to avoid circular dependency
    const totalCreditsResult = await this.creditNoteRepository
      .createQueryBuilder('creditNote')
      .select('SUM(creditNote.amount)', 'total')
      .where('creditNote.invoiceId = :invoiceId', { invoiceId })
      .getRawOne();
    const totalCreditsPreTax = parseFloat(totalCreditsResult?.total || '0');
    const taxRate = invoice.job?.taxRate || 0;
    const totalCreditsPostTax = totalCreditsPreTax * (1 + taxRate / 100);
    
    const remaining = Math.max(0, invoiceTotal - totalPaid - totalCreditsPostTax);

    return remaining;
  }

  /**
   * Update invoice status based on payments and credit notes
   */
  private async updateInvoiceStatus(invoiceId: string): Promise<void> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['job', 'job.lineItems'],
    });

    if (!invoice) {
      return;
    }

    const invoiceTotal = this.calculateInvoiceTotal(invoice);
    const totalPaid = await this.getTotalPaid(invoiceId);
    
    // Get credit notes total (post-tax) - query directly to avoid circular dependency
    const totalCreditsResult = await this.creditNoteRepository
      .createQueryBuilder('creditNote')
      .select('SUM(creditNote.amount)', 'total')
      .where('creditNote.invoiceId = :invoiceId', { invoiceId })
      .getRawOne();
    const totalCreditsPreTax = parseFloat(totalCreditsResult?.total || '0');
    const taxRate = invoice.job?.taxRate || 0;
    const totalCreditsPostTax = totalCreditsPreTax * (1 + taxRate / 100);
    
    const totalCreditsAndPayments = totalPaid + totalCreditsPostTax;

    // If total payments + credits >= invoice total, mark as PAID
    // Otherwise, mark as UNPAID
    if (totalCreditsAndPayments >= invoiceTotal - 0.01) {
      invoice.status = InvoiceStatus.PAID;
    } else {
      invoice.status = InvoiceStatus.UNPAID;
    }

    await this.invoiceRepository.save(invoice);
  }

  /**
   * Create a payment for an invoice
   */
  async create(data: CreatePaymentDto): Promise<Payment> {
    // Validate invoice exists
    const invoice = await this.invoiceRepository.findOne({
      where: { id: data.invoiceId },
      relations: ['job', 'job.lineItems'],
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    // Validate payment method exists and is active
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: data.paymentMethodId },
    });

    if (!paymentMethod) {
      throw new NotFoundError('Payment method not found');
    }

    if (!paymentMethod.isActive) {
      throw new BadRequestError('Payment method is not active');
    }

    // Validate amount is positive
    if (data.amount <= 0) {
      throw new BadRequestError('Payment amount must be greater than zero');
    }

    // Calculate remaining balance
    const remainingBalance = await this.getRemainingBalance(data.invoiceId);
    
    // Round values for comparison
    const paymentAmountRounded = Math.round(data.amount * 100) / 100;
    const remainingBalanceRounded = Math.round(remainingBalance * 100) / 100;

    // Validate that payment doesn't exceed remaining balance
    if (paymentAmountRounded > remainingBalanceRounded + 0.01) {
      throw new BadRequestError(
        `Payment amount (${data.amount.toFixed(2)}) exceeds remaining balance (${remainingBalance.toFixed(2)})`
      );
    }

    const payment = this.repository.create({
      invoiceId: data.invoiceId,
      paymentMethodId: data.paymentMethodId,
      amount: data.amount,
      paymentDate: data.paymentDate || new Date(),
      paymentNote: data.paymentNote || null,
    });

    const savedPayment = await this.repository.save(payment);

    // Update invoice status
    await this.updateInvoiceStatus(data.invoiceId);

    return savedPayment;
  }

  /**
   * Get all payments for an invoice
   */
  async findByInvoiceId(invoiceId: string): Promise<Payment[]> {
    return await this.repository.find({
      where: { invoiceId },
      relations: ['paymentMethod'],
      order: { paymentDate: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Get payment by ID
   */
  async findById(id: string): Promise<Payment> {
    const payment = await this.repository.findOne({
      where: { id },
      relations: ['invoice', 'paymentMethod'],
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    return payment;
  }

  /**
   * Delete a payment and update invoice status
   */
  async delete(id: string): Promise<void> {
    const payment = await this.findById(id);
    const invoiceId = payment.invoiceId;

    await this.repository.remove(payment);

    // Update invoice status
    await this.updateInvoiceStatus(invoiceId);
  }

  async createBulk(invoiceId: string, items: CreatePaymentBulkDto[]): Promise<Payment[]> {
    if (items.length === 0) {
      throw new BadRequestError('At least one payment is required');
    }
    if (items.length > 100) {
      throw new BadRequestError('Cannot create more than 100 payments at once');
    }

    // Validate invoice exists
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['job', 'job.lineItems'],
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    const createdPayments: Payment[] = [];
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate all payment methods exist and are active
      const paymentMethodIds = [...new Set(items.map(item => item.paymentMethodId))];
      const paymentMethods = await queryRunner.manager.find(PaymentMethod, {
        where: { id: In(paymentMethodIds) },
      });

      if (paymentMethods.length !== paymentMethodIds.length) {
        throw new NotFoundError('One or more payment methods not found');
      }

      const inactiveMethods = paymentMethods.filter(pm => !pm.isActive);
      if (inactiveMethods.length > 0) {
        throw new BadRequestError(`Payment method(s) ${inactiveMethods.map(pm => pm.id).join(', ')} are not active`);
      }

      const paymentMethodMap = new Map(paymentMethods.map(pm => [pm.id, pm]));

      // Calculate remaining balance once
      const invoiceTotal = this.calculateInvoiceTotal(invoice);
      const existingPayments = await queryRunner.manager.find(Payment, {
        where: { invoiceId },
      });
      const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
      
      const totalCreditsResult = await queryRunner.manager
        .createQueryBuilder(CreditNote, 'creditNote')
        .select('SUM(creditNote.amount)', 'total')
        .where('creditNote.invoiceId = :invoiceId', { invoiceId })
        .getRawOne();
      const totalCreditsPreTax = parseFloat(totalCreditsResult?.total || '0');
      const taxRate = invoice.job?.taxRate || 0;
      const totalCreditsPostTax = totalCreditsPreTax * (1 + taxRate / 100);
      
      const remainingBalance = Math.max(0, invoiceTotal - totalPaid - totalCreditsPostTax);

      // Process each payment
      let cumulativeAmount = 0;
      for (const item of items) {
        // Validate amount is positive
        if (item.amount <= 0) {
          throw new BadRequestError('Payment amount must be greater than zero');
        }

        cumulativeAmount += item.amount;
        const cumulativeAmountRounded = Math.round(cumulativeAmount * 100) / 100;
        const remainingBalanceRounded = Math.round(remainingBalance * 100) / 100;

        // Validate that cumulative payments don't exceed remaining balance
        if (cumulativeAmountRounded > remainingBalanceRounded + 0.01) {
          throw new BadRequestError(
            `Cumulative payment amount (${cumulativeAmount.toFixed(2)}) exceeds remaining balance (${remainingBalance.toFixed(2)})`
          );
        }

        const payment = queryRunner.manager.create(Payment, {
          invoiceId,
          paymentMethodId: item.paymentMethodId,
          amount: item.amount,
          paymentDate: item.paymentDate || new Date(),
          paymentNote: item.paymentNote || null,
        });

        const savedPayment = await queryRunner.manager.save(payment);
        createdPayments.push(savedPayment);
      }

      await queryRunner.commitTransaction();

      // Update invoice status
      await this.updateInvoiceStatus(invoiceId);

      // Load full payment details with relations
      const paymentIds = createdPayments.map(p => p.id);
      const fullPayments = await this.repository.find({
        where: { id: In(paymentIds) },
        relations: ['paymentMethod'],
        order: { paymentDate: 'DESC', createdAt: 'DESC' },
      });

      return fullPayments;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
