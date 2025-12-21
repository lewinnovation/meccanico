import { AppDataSource } from '../config/database';
import { CreditNote } from '../models/CreditNote';
import { Invoice, InvoiceStatus } from '../models/Invoice';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { PaymentService } from './PaymentService';
import { PaymentMethodService } from './PaymentMethodService';

export interface CreateCreditNoteDto {
  invoiceId: string;
  amount: number;
  reason?: string;
  creditDate?: Date;
}

export class CreditNoteService {
  private repository = AppDataSource.getRepository(CreditNote);
  private invoiceRepository = AppDataSource.getRepository(Invoice);
  private _paymentService: PaymentService | null = null;
  private paymentMethodService = new PaymentMethodService();

  private get paymentService(): PaymentService {
    if (!this._paymentService) {
      this._paymentService = new PaymentService();
    }
    return this._paymentService;
  }

  /**
   * Generate credit note number in format CN-{YYYYMMDD}-{NNN}
   */
  private async generateCreditNoteNumber(): Promise<string> {
    const today = new Date();
    const yy = today.getFullYear().toString().slice(-2);
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    const datePrefix = `CN-${yy}${mm}${dd}`;

    // Get the highest credit note number for today
    const result = await AppDataSource.query(`
      SELECT "credit_note_number" FROM credit_notes
      WHERE "credit_note_number" LIKE '${datePrefix}%'
      ORDER BY "credit_note_number" DESC
      LIMIT 1
    `);

    let nextNumber = 1;
    if (result.length > 0) {
      const lastNumber = result[0].credit_note_number as string;
      const numberPart = lastNumber.substring(11); // After "CN-YYMMDD-"
      const lastNum = parseInt(numberPart, 10);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }

    const paddedNumber = nextNumber.toString().padStart(3, '0');
    return `${datePrefix}-${paddedNumber}`;
  }

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
   * Calculate total credit notes for an invoice (pre-tax amount)
   */
  async getTotalCredits(invoiceId: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('creditNote')
      .select('SUM(creditNote.amount)', 'total')
      .where('creditNote.invoiceId = :invoiceId', { invoiceId })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  /**
   * Calculate remaining balance for an invoice
   * Remaining = Invoice Total - Total Payments - Total Credit Notes (post-tax)
   * This method now delegates to PaymentService which handles both payments and credit notes
   */
  async getRemainingBalance(invoiceId: string): Promise<number> {
    return this.paymentService.getRemainingBalance(invoiceId);
  }

  /**
   * Create a credit note for an invoice
   */
  async create(data: CreateCreditNoteDto): Promise<CreditNote> {
    // Validate invoice exists
    const invoice = await this.invoiceRepository.findOne({
      where: { id: data.invoiceId },
      relations: ['job', 'job.lineItems', 'creditNotes'],
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    // Validate amount is positive
    if (data.amount <= 0) {
      throw new BadRequestError('Credit note amount must be greater than zero');
    }

    // Calculate invoice total (post-tax) and existing credits (pre-tax)
    const invoiceTotal = this.calculateInvoiceTotal(invoice); // Post-tax
    const taxRate = invoice.job?.taxRate || 0;
    const totalCreditsPreTax = invoice.creditNotes?.reduce(
      (sum, cn) => sum + parseFloat(cn.amount.toString()),
      0
    ) || 0;
    
    // Convert existing credits to post-tax for comparison
    const totalCreditsPostTax = totalCreditsPreTax * (1 + taxRate / 100);
    
    // Calculate remaining balance before this credit note
    const remainingBalanceBefore = Math.max(0, invoiceTotal - totalCreditsPostTax);
    
    // Convert new credit note (pre-tax) to post-tax for validation
    // Round to 2 decimal places to avoid floating point precision issues
    const newCreditPostTax = Math.round((data.amount * (1 + taxRate / 100)) * 100) / 100;
    
    // Round remaining balance to 2 decimal places for comparison
    const remainingBalanceRounded = Math.round(remainingBalanceBefore * 100) / 100;
    
    // Validate that new credit doesn't exceed remaining balance
    // Allow up to the full remaining balance (with tolerance for floating point precision and rounding)
    // We allow values that are within 0.01 of the remaining balance to account for rounding differences
    if (newCreditPostTax > remainingBalanceRounded + 0.01) {
      // Calculate the maximum pre-tax credit that would result in remaining balance = 0
      const maxPreTaxCredit = remainingBalanceBefore / (1 + taxRate / 100);
      
      throw new BadRequestError(
        `Credit note amount (${data.amount.toFixed(2)} pre-tax = ${newCreditPostTax.toFixed(2)} post-tax) would exceed remaining balance. ` +
        `Invoice total: ${invoiceTotal.toFixed(2)}, Existing credits: ${totalCreditsPostTax.toFixed(2)} post-tax, ` +
        `Remaining: ${remainingBalanceBefore.toFixed(2)}. Maximum pre-tax credit: ${maxPreTaxCredit.toFixed(2)}`
      );
    }

    const creditNoteNumber = await this.generateCreditNoteNumber();
    const creditDate = data.creditDate || new Date();

    const creditNote = this.repository.create({
      creditNoteNumber,
      invoiceId: data.invoiceId,
      amount: data.amount,
      reason: data.reason || null,
      creditDate,
    });

    const savedCreditNote = await this.repository.save(creditNote);

    // Update invoice status based on payments and credit notes
    // The PaymentService.updateInvoiceStatus will be called automatically
    // when we check remaining balance, but we need to trigger it manually here
    // since we're not creating a payment
    // Re-fetch invoice to get updated credit notes
    const updatedInvoice = await this.invoiceRepository.findOne({
      where: { id: data.invoiceId },
      relations: ['job', 'job.lineItems'],
    });

    if (updatedInvoice) {
      const invoiceTotal = this.calculateInvoiceTotal(updatedInvoice);
      const totalPaid = await this.paymentService.getTotalPaid(data.invoiceId);
      const totalCreditsPreTax = await this.getTotalCredits(data.invoiceId);
      const taxRate = updatedInvoice.job?.taxRate || 0;
      const totalCreditsPostTax = totalCreditsPreTax * (1 + taxRate / 100);
      const totalCreditsAndPayments = totalPaid + totalCreditsPostTax;

      if (totalCreditsAndPayments >= invoiceTotal - 0.01) {
        updatedInvoice.status = InvoiceStatus.PAID;
      } else {
        updatedInvoice.status = InvoiceStatus.UNPAID;
      }

      await this.invoiceRepository.save(updatedInvoice);
    }

    return savedCreditNote;
  }

  /**
   * Get all credit notes for an invoice
   */
  async findByInvoiceId(invoiceId: string): Promise<CreditNote[]> {
    return await this.repository.find({
      where: { invoiceId },
      order: { creditDate: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Get credit note by ID
   */
  async findById(id: string): Promise<CreditNote> {
    const creditNote = await this.repository.findOne({
      where: { id },
      relations: ['invoice'],
    });

    if (!creditNote) {
      throw new NotFoundError('Credit note not found');
    }

    return creditNote;
  }

  /**
   * Delete a credit note and update invoice status if needed
   */
  async delete(id: string): Promise<void> {
    const creditNote = await this.findById(id);
    const invoiceId = creditNote.invoiceId;

    // Delete the credit note
    await this.repository.remove(creditNote);

    // Update invoice status based on payments and credit notes
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['job', 'job.lineItems'],
    });

    if (invoice) {
      const invoiceTotal = this.calculateInvoiceTotal(invoice);
      const totalPaid = await this.paymentService.getTotalPaid(invoiceId);
      const totalCreditsPreTax = await this.getTotalCredits(invoiceId);
      const taxRate = invoice.job?.taxRate || 0;
      const totalCreditsPostTax = totalCreditsPreTax * (1 + taxRate / 100);
      const totalCreditsAndPayments = totalPaid + totalCreditsPostTax;

      if (totalCreditsAndPayments >= invoiceTotal - 0.01) {
        invoice.status = InvoiceStatus.PAID;
      } else {
        invoice.status = InvoiceStatus.UNPAID;
      }

      await this.invoiceRepository.save(invoice);
    }
  }
}
