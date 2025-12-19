# Job Lifecycle Journey

> Complete workflow from creating an estimate to receiving payment.

---

## 📋 Overview

The job lifecycle represents the core workflow of the shop management system. A job progresses through defined statuses, with specific actions and validations at each stage.

---

## 🔄 Status Flow

```
BOOKED → IN_PROGRESS → AWAITING_PICKUP → COMPLETED → Invoice
    ↓           ↓
 PENDING    (can return to IN_PROGRESS)
```

**Note:** Status transitions are flexible - any status can transition to any other status based on shop workflow needs.

---

## 📝 Step 1: Create Job

### Trigger
- Click "New Job" button
- Press `Cmd/Ctrl + N`
- Via command palette

### Flow
```
1. Select/Create Customer
   ├─ Search existing customers
   ├─ Or create new inline
   └─ Customer selected ✓

2. Select/Create Vehicle
   ├─ Shows customer's vehicles
   ├─ Or create new inline
   └─ Vehicle selected ✓

3. Job Created (BOOKED status)
   ├─ Unique code assigned (J241216001)
   ├─ Default tax rate applied
   └─ Ready for line items
```

### UI State
- Job detail view opens
- Line items section empty
- Status: BOOKED (default badge)
- Full editing enabled

---

## 📦 Step 2: Add Line Items

### Actions
- Click "Add Item" or press `/`
- Select type: Inventory, Labour, Service, or Text

### Flow for Catalog Items (I/L/S)
```
1. Press /I (or /L, /S)
2. Fuzzy search modal opens
3. Type to search catalog
4. Arrow keys to navigate results
5. Enter to select
6. Quantity modal (default from catalog)
7. Confirm → Item added
```

### Flow for Text Items
```
1. Press /T or select "Custom"
2. Inline form appears
3. Enter description
4. Enter quantity and price
5. Tab to confirm → Item added
```

### Line Item Management
- Drag to reorder
- Click to edit inline
- Delete with confirmation
- Subtotal updates in real-time

---

## ✅ Step 3: Start Work

### Prerequisites
- At least one line item
- Job in BOOKED status (or any status)

### Flow
```
1. Click status badge or menu
2. Select "In Progress" status
3. Status → IN_PROGRESS
4. started_at timestamp set
5. Line items become editable (until COMPLETED)
```

### Alternative: Place on Hold
```
1. Click status badge or menu
2. Select "Pending" status
3. Status → PENDING
4. Add internal notes (optional)
5. Resume later → IN_PROGRESS
```

---

## 🔧 Step 4: Complete Work

### Trigger
- Click status badge or menu
- Select "Awaiting Pick Up" or "Completed"

### Flow
```
1. Work is finished
2. Click status badge or menu
3. Select "Awaiting Pick Up" or "Completed"
4. Status → AWAITING_PICKUP or COMPLETED
5. completed_at timestamp set (if COMPLETED)
```

### During Work
- Update internal notes
- Can add/remove line items (until COMPLETED)
- Can transition between statuses as needed

---

## 📄 Step 5: Convert to Invoice

### Prerequisites
- Status: COMPLETED
- Work completed

### Flow
```
1. Job status is COMPLETED
2. Click "Convert to Invoice" button
3. System creates invoice:
   ├─ Invoice number assigned (INV-241216-001)
   ├─ Invoice date = today
   ├─ Due date = today + payment terms days
   ├─ Status = UNPAID
   └─ Job's invoiceId updated
4. Invoice section appears on job detail page
```

### Invoice Actions
- Print invoice
- View invoice details
- Mark as paid

---

## 💰 Step 6: Receive Payment

### Flow
```
1. Invoice exists (status = UNPAID)
2. Customer pays (external)
3. Click "Mark as Paid" button
4. Payment dialog opens
   ├─ Payment note input (optional)
   ├─ Examples: "Paid via credit card", "Check #1234"
   └─ Confirm button
5. Invoice status → PAID
6. paid_at timestamp set
7. Payment note saved
```

### Payment Tracking
- Invoice maintains payment history
- Payment note provides audit trail
- Invoice can be printed for records

---

## ⏸️ Side Flow: Pending Status

### From Any Status
```
1. Issue arises (parts needed, customer unreachable)
2. Click status badge or menu
3. Select "Pending" status
4. Add internal notes (optional)
5. Status → PENDING
6. Work paused
```

### Resume
```
1. Issue resolved
2. Click status badge or menu
3. Select "In Progress" status
4. Status → IN_PROGRESS
5. Work resumes
```

---

## 📊 Timeline View

Each job maintains a timeline of events:

```
J241216001 - 2024 Honda Civic
─────────────────────────────────────
● Created                    Dec 16, 9:00 AM
│ Job created by John
│ Status: BOOKED
│
● Line items added           Dec 16, 9:15 AM
│ 4 items totaling $450.00
│
● Work started               Dec 16, 10:00 AM
│ Status: BOOKED → IN_PROGRESS
│ Assigned to: Mike
│
● Completed                  Dec 16, 4:00 PM
│ Status: IN_PROGRESS → COMPLETED
│
● Invoice created            Dec 16, 4:05 PM
│ Invoice: INV-241216-001
│ Due Date: Dec 30, 2024
│ Status: UNPAID
│
● Payment received           Dec 18, 10:00 AM
│ Invoice status: UNPAID → PAID
│ Payment Note: "Paid via credit card ending in 1234"
─────────────────────────────────────
```

---

## ⌨️ Keyboard Shortcuts

| Context | Shortcut | Action |
|---------|----------|--------|
| Anywhere | `Cmd+N` | New job |
| Job list | `↑/↓` | Navigate jobs |
| Job list | `Enter` | Open job |
| Job detail | `/I` | Add inventory |
| Job detail | `/L` | Add labour |
| Job detail | `/S` | Add service |
| Job detail | `/T` | Add text item |
| Job detail | `E` | Edit job |
| Job detail | `P` | Print |
| Line items | `↑/↓` | Navigate items |
| Line items | `Delete` | Remove item |
| Modal | `Esc` | Close |
| Modal | `Enter` | Confirm |

---

*See also: [Customer Onboarding](./customer-onboarding.md) | [Job Model](../models/job.md)*

