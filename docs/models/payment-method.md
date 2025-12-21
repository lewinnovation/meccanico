# Payment Method Entity

> Payment methods represent the different ways customers can pay for invoices.

---

## 📋 Overview

| Property | Value |
|----------|-------|
| **Table Name** | `payment_methods` |
| **Audited** | Yes |

Payment methods are managed by administrators and are required when marking invoices as paid. Once a payment method has been used in an invoice, it cannot be deleted to preserve historical data integrity.

---

## 🗄️ Database Schema

```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_methods_name ON payment_methods(name);
CREATE INDEX idx_payment_methods_is_active ON payment_methods(is_active);
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
} from 'typeorm';

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

---

## 🔗 Relationships

| Relation | Type | Entity | Description |
|----------|------|--------|-------------|
| invoices | 1:Many | Invoice | Invoices that used this payment method |

### Cascade Rules
- Deleting a payment method: Soft delete only (sets `isActive = false`)
- Cannot delete if payment method has been used in any invoices

---

## ✅ Business Rules

### Validation
| Field | Rule |
|-------|------|
| name | Required, unique, max 100 characters |
| isActive | Required, defaults to true |

### Business Logic
1. Payment method name must be unique
2. Payment methods are required when marking invoices as paid
3. Payment methods that have been used cannot be deleted (soft delete only)
4. Inactive payment methods are hidden from selection dropdowns but remain in database
5. Only administrators can create, update, or delete payment methods

### Soft Delete
- Instead of hard deletion, payment methods are soft deleted by setting `isActive = false`
- This preserves historical data while hiding inactive methods from active lists
- Inactive methods can be reactivated by setting `isActive = true`

---

## 🌐 API Endpoints

### Get Active Payment Methods
```
GET /api/payment-methods
Response: PaymentMethod[] (only active methods)
```

### Get All Payment Methods (Admin only)
```
GET /api/payment-methods/all
Response: PaymentMethod[] (including inactive)
Security: ADMIN role required
```

### Get Payment Method by ID
```
GET /api/payment-methods/:id
Response: PaymentMethod
Error: 404 Not Found if payment method doesn't exist
```

### Create Payment Method (Admin only)
```
POST /api/payment-methods
Body: { name: string }
Response: PaymentMethod (201 Created)
Security: ADMIN role required
Error: 400 Bad Request if name already exists
```

### Update Payment Method (Admin only)
```
PUT /api/payment-methods/:id
Body: { name?: string, isActive?: boolean }
Response: PaymentMethod
Security: ADMIN role required
Error: 404 Not Found if payment method doesn't exist
Error: 400 Bad Request if name already exists
```

### Delete Payment Method (Admin only)
```
DELETE /api/payment-methods/:id
Response: 204 No Content
Security: ADMIN role required
Error: 404 Not Found if payment method doesn't exist
Error: 400 Bad Request if payment method has been used
```

### Get Usage Counts (Admin only)
```
GET /api/payment-methods/usage-counts
Response: { [paymentMethodId: string]: number }
Security: ADMIN role required
```

---

## 🖥️ UI Components

### Payment Methods Settings Page
- List of all payment methods (active and inactive)
- "Add Payment Method" button (admin only)
- Edit button for each method (admin only)
- Delete button (admin only, disabled if method has been used)
- Usage count display (number of invoices using each method)
- Inactive methods shown with "Inactive" chip
- Confirmation dialog before deletion

### Payment Method Selector (Invoice Payment Dialog)
- Required dropdown/select field
- Shows only active payment methods
- Required validation - cannot submit without selection

---

## 💰 Payment Method Workflow

### Step 1: Admin Creates Payment Methods
1. Navigate to Settings > Payment Methods
2. Click "Add Payment Method"
3. Enter payment method name (e.g., "VISA", "CASH")
4. Save

### Step 2: Mark Invoice as Paid
1. Navigate to job detail page with unpaid invoice
2. Click "Mark as Paid" button
3. Payment dialog opens
4. **Required**: Select payment method from dropdown
5. Optional: Add payment note
6. Click "Mark as Paid"
7. Invoice status → PAID
8. Payment method is saved with invoice

### Step 3: Admin Manages Payment Methods
1. View all payment methods in Settings
2. Edit method name if needed
3. Delete unused methods (only if never used)
4. Methods that have been used cannot be deleted

---

## 📊 Default Payment Methods

The following payment methods are seeded by default:

- VISA
- MASTER/BANK CARD
- EFTPOS
- DIRECT PAYMENT
- MOTORCHARGE
- CASH
- CHEQUE RECEIVED
- FLEET CARD
- AMERICAN EXPRESS
- BANK
- CALTEX STARFLEET

---

## 💡 Example

```
Admin creates payment method:
Name: "VISA"
isActive: true

↓ Customer pays invoice

Invoice marked as paid:
Payment Method: VISA
Payment Note: "Card ending in 1234"
Status: PAID

↓ Admin tries to delete VISA

Error: Cannot delete payment method "VISA" because it has been used in 5 invoice(s)

↓ Admin deactivates instead

Payment Method: VISA
isActive: false (hidden from dropdowns, but historical data preserved)
```

---

*See also: [Invoice](./invoice.md) | [Settings](./settings.md)*
