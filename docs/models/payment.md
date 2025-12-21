# Payment Entity

> Payments represent individual payment transactions made against invoices.

---

## 📋 Overview

| Property | Value |
|----------|-------|
| **Table Name** | `payments` |
| **Color** | Green (`#E8F5E9` / `#4CAF50`) |
| **Audited** | Yes |

Payments track individual payment transactions made against invoices. Multiple payments can be made for a single invoice, allowing for partial payments using different payment methods.

---

## 🗄️ Database Schema

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_payment_method_id ON payments(payment_method_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
```

---

## 🔷 TypeORM Entity

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Invoice } from './Invoice';
import { PaymentMethod } from './PaymentMethod';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invoice_id', type: 'uuid' })
  invoiceId: string;

  @Column({ name: 'payment_method_id', type: 'uuid' })
  paymentMethodId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'payment_date', type: 'timestamptz' })
  paymentDate: Date;

  @Column({ name: 'payment_note', type: 'text', nullable: true })
  paymentNote: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Invoice, (invoice) => invoice.payments)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @ManyToOne(() => PaymentMethod)
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethod;
}
```

---

## 🔗 Relationships

| Relation | Type | Entity | Description |
|----------|------|--------|-------------|
| invoice | Many:1 | Invoice | The invoice this payment is for |
| paymentMethod | Many:1 | PaymentMethod | The payment method used for this payment |

### Cascade Rules
- Deleting an invoice: Payments are deleted (cascade)
- Deleting a payment method: Prevents deletion if payments exist (must soft-delete)

---

## ✅ Business Rules

### Validation
| Field | Rule |
|-------|------|
| invoiceId | Required, must reference an existing invoice |
| paymentMethodId | Required, must reference an active payment method |
| amount | Required, must be greater than 0, cannot exceed remaining balance |
| paymentDate | Required, defaults to current date |
| paymentNote | Optional, max 10000 characters |

### Business Logic
1. Payment amount must be positive
2. Payment amount cannot exceed the remaining balance (invoice total - existing payments - credit notes)
3. Payment method must be active
4. Invoice status is automatically recalculated after payment creation/deletion:
   - If total payments + credit notes >= invoice total: Status = PAID
   - Otherwise: Status = UNPAID
5. Multiple payments can be made for the same invoice
6. Payments can use different payment methods
7. Payments are ordered by payment date (most recent first)

---

## 🌐 API Endpoints

### Create Payment
```
POST /api/invoices/:invoiceId/payments
Body: {
  paymentMethodId: string,
  amount: number,
  paymentDate?: string (ISO date),
  paymentNote?: string
}
Response: Payment (201 Created)
Error: 400 Bad Request if amount exceeds remaining balance or payment method invalid
Error: 404 Not Found if invoice or payment method doesn't exist
```

### Get Payments for Invoice
```
GET /api/invoices/:invoiceId/payments
Response: Payment[] (ordered by paymentDate DESC, createdAt DESC)
Error: 404 Not Found if invoice doesn't exist
```

### Delete Payment
```
DELETE /api/invoices/:invoiceId/payments/:paymentId
Response: 204 No Content
Error: 404 Not Found if payment doesn't exist
Note: Invoice status is automatically recalculated after deletion
```

---

## 🖥️ UI Components

### Payment List (Invoice Detail Page)
- Displays all payments for an invoice
- Shows: Date, Payment Method, Amount, Note
- Delete button for each payment (with confirmation)
- Total paid amount summary

### Payment Dialog
- Payment amount input (defaults to remaining balance)
- Payment method selector (required, dropdown of active methods)
- Payment date picker (defaults to today)
- Payment note textarea (optional)
- Shows remaining balance after this payment
- Validation: Disables submit if amount exceeds remaining balance

---

## 💰 Payment Flow

### Single Payment (Full Amount)
1. Invoice created: Status = UNPAID, Remaining = $450.00
2. User clicks "Add Payment"
3. Enters amount: $450.00
4. Selects payment method: VISA
5. Confirms
6. Payment created: $450.00
7. Invoice status → PAID (total payments >= invoice total)

### Multiple Payments (Partial)
1. Invoice created: Status = UNPAID, Remaining = $450.00
2. **First Payment:**
   - User clicks "Add Payment"
   - Enters amount: $100.00
   - Selects payment method: CASH
   - Confirms
   - Payment created: $100.00
   - Remaining balance: $350.00
   - Invoice status → UNPAID (total payments < invoice total)
3. **Second Payment:**
   - User clicks "Add Payment"
   - Enters amount: $350.00 (or remaining balance)
   - Selects payment method: VISA
   - Confirms
   - Payment created: $350.00
   - Remaining balance: $0.00
   - Invoice status → PAID (total payments >= invoice total)

### Payment with Credit Note
1. Invoice created: Status = UNPAID, Total = $450.00
2. Credit note issued: $50.00 (pre-tax)
3. Remaining balance: $400.00 (post-tax, assuming 10% tax)
4. Payment created: $400.00
5. Invoice status → PAID

---

## 💡 Example

```
Invoice: INV-241216-001
Total: $450.00
Status: UNPAID

Payment 1:
  Date: 2024-12-18
  Method: CASH
  Amount: $100.00
  Note: "Partial payment"
  Remaining: $350.00

Payment 2:
  Date: 2024-12-19
  Method: VISA
  Amount: $350.00
  Note: "Card ending in 1234"
  Remaining: $0.00

Final Status: PAID
Total Paid: $450.00
```

---

## 📊 Related Reports

- Payment history by date range
- Payments by payment method
- Partial payment analysis
- Average payment amount
- Payment trends over time

---

*See also: [Invoice](./invoice.md) | [PaymentMethod](./payment-method.md)*
