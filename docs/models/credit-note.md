# Credit Note Entity

> Credit notes represent partial or full credits issued against invoices, reducing the amount due.

---

## 📋 Overview

| Property | Value |
|----------|-------|
| **Code Prefix** | CN- |
| **Table Name** | `credit_notes` |
| **Color** | Orange (`#FFF3E0` / `#FF9800`) |
| **Audited** | Yes |

Credit notes allow issuing credits against invoices for various reasons such as returned parts, warranty adjustments, or billing corrections. They reduce the remaining balance on an invoice.

---

## 🗄️ Database Schema

```sql
CREATE TABLE credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  credit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_credit_notes_invoice_id ON credit_notes(invoice_id);
CREATE INDEX idx_credit_notes_credit_date ON credit_notes(credit_date);
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

@Entity('credit_notes')
export class CreditNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'credit_note_number', type: 'varchar', length: 50, unique: true })
  creditNoteNumber: string;

  @Column({ name: 'invoice_id', type: 'uuid' })
  invoiceId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ name: 'credit_date', type: 'timestamptz' })
  creditDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Invoice, (invoice) => invoice.creditNotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;
}
```

---

## 🔗 Relationships

| Relation | Type | Entity | Description |
|----------|------|--------|-------------|
| invoice | Many:1 | Invoice | The invoice this credit note is applied to |

### Cascade Rules
- Deleting an invoice: Cascades deletion of all associated credit notes
- Credit note deletion: No impact on invoice

---

## ✅ Business Rules

### Validation
| Field | Rule |
|-------|------|
| invoiceId | Required, must reference an existing invoice |
| amount | Required, must be greater than zero |
| creditNoteNumber | Required, unique, auto-generated |
| creditDate | Required, defaults to creation date |
| reason | Optional, max 10000 characters |

### Code Generation
- Format: `CN-{yyMMdd}-{nnn}` (e.g., CN-241216-001, CN-241216-002)
- Date-based prefix with auto-incremented number
- Immutable after creation

### Business Logic
1. Credit note amount must be greater than zero
2. Sum of all credit notes for an invoice cannot exceed the invoice total
3. Credit notes can be issued for both paid and unpaid invoices
4. Remaining balance = Invoice total - Sum of all credit notes
5. Credit note number is auto-generated on creation
6. Credit date defaults to creation date but can be set to a past date

---

## 🌐 API Endpoints

### Create Credit Note
```
POST /api/invoices/:id/credit-notes
Body: { amount: number, reason?: string, creditDate?: string }
Response: CreditNote (201 Created)
Error: 400 Bad Request if amount exceeds remaining balance or is invalid
Error: 404 Not Found if invoice doesn't exist
```

### Get Credit Notes for Invoice
```
GET /api/invoices/:id/credit-notes
Response: CreditNote[] (sorted by credit date descending)
Error: 404 Not Found if invoice doesn't exist
```

### Get Remaining Balance
```
GET /api/invoices/:id/remaining-balance
Response: { remainingBalance: number }
Error: 404 Not Found if invoice doesn't exist
```

---

## 🖥️ UI Components

### Credit Note Dialog
- Amount input with currency symbol
- Credit date picker (defaults to today)
- Reason/notes text area (optional)
- Validation showing remaining balance after credit
- Error message if credit exceeds remaining balance

### Invoice Detail Display
- List of all credit notes with:
  - Credit note number
  - Amount (displayed as negative)
  - Reason (if provided)
  - Credit date
- Total credits applied
- Remaining balance calculation
- "Issue Credit Note" button (disabled when balance is zero)

---

## 💰 Credit Note Workflow

### Step 1: Invoice Exists
1. Invoice must be created from a completed job
2. Invoice can be in UNPAID or PAID status

### Step 2: Issue Credit Note
1. Navigate to job detail page with invoice
2. Click "Issue Credit Note" button
3. Enter credit amount (validated against remaining balance)
4. Enter reason (optional but recommended)
5. Select credit date (defaults to today)
6. Confirm creation
7. Credit note is created and linked to invoice
8. Remaining balance is recalculated

### Step 3: Multiple Credit Notes
1. Can issue multiple credit notes for the same invoice
2. Each credit note reduces the remaining balance
3. System prevents total credits from exceeding invoice total
4. Remaining balance can reach zero (fully credited)

---

## 📊 Use Cases

### Returned Parts
- Customer returns unused parts
- Issue credit note for the value of returned parts
- Reason: "Returned unused parts - Oil Filter"

### Warranty Adjustment
- Service issue covered under warranty
- Issue credit note for warranty amount
- Reason: "Warranty adjustment - Brake service"

### Billing Correction
- Error in original invoice
- Issue credit note to correct the amount
- Reason: "Billing correction - Incorrect labor hours"

### Partial Refund
- Customer receives partial refund
- Issue credit note for refund amount
- Reason: "Partial refund - Customer satisfaction"

---

## 💡 Example

```
Invoice: INV-241216-001
Invoice Total: $450.00
Status: UNPAID

↓ Issue Credit Note #1

Credit Note: CN-241216-001
Amount: $50.00
Reason: "Returned unused parts"
Remaining Balance: $400.00

↓ Issue Credit Note #2

Credit Note: CN-241216-002
Amount: $25.00
Reason: "Warranty adjustment"
Remaining Balance: $375.00

↓ Payment Received

Final Payment: $375.00
(Original $450.00 - $50.00 credit - $25.00 credit)
```

---

## 🔍 Calculations

### Remaining Balance Formula
```
Remaining Balance = Invoice Total - Sum of All Credit Notes

Where:
- Invoice Total = Job subtotal - discounts + GST
- Sum of All Credit Notes = SUM(credit_note.amount) for invoice
```

### Example Calculation
```
Invoice Total: $450.00
Credit Note 1: $50.00
Credit Note 2: $25.00
Total Credits: $75.00
Remaining Balance: $450.00 - $75.00 = $375.00
```

---

*See also: [Invoice](./invoice.md) | [Job](./job.md)*
