# Job Lifecycle Journey

> Complete workflow from creating an estimate to receiving payment.

---

## 📋 Overview

The job lifecycle represents the core workflow of the shop management system. A job progresses through defined statuses, with specific actions and validations at each stage.

---

## 🔄 Status Flow

```
ESTIMATE → APPROVED → IN_PROGRESS → INVOICED → PAID
    ↓          ↓           ↓            ↓
CANCELLED  DECLINED    ON_HOLD     DISPUTED
```

---

## 📝 Step 1: Create Estimate

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

3. Job Created (ESTIMATE status)
   ├─ Unique code assigned (J001)
   ├─ Default tax rate applied
   └─ Ready for line items
```

### UI State
- Job detail view opens
- Line items section empty
- Status: ESTIMATE (yellow badge)
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

## ✅ Step 3: Approve Estimate

### Prerequisites
- At least one line item
- Customer contact info (optional warning)

### Flow
```
1. Click "Send Estimate" or status badge
2. Options:
   ├─ Print estimate
   ├─ Email estimate
   └─ Mark as sent
3. Status → APPROVED (or stays ESTIMATE)
4. Customer approves (external)
5. Click "Customer Approved"
6. Status → APPROVED
```

### Alternative: Decline
```
1. Customer declines
2. Click "Customer Declined"
3. Status → DECLINED
4. Optional: Add decline reason
```

---

## 🔧 Step 4: Begin Work

### Trigger
- Click "Start Work" button
- Status badge → IN_PROGRESS

### Flow
```
1. Click "Start Work"
2. Confirmation dialog
3. Status → IN_PROGRESS
4. started_at timestamp set
5. Line items become locked*
```

*Admin can unlock for corrections

### During Work
- Update internal notes
- Cannot add/remove line items (locked)
- Can place ON_HOLD if needed

---

## 📄 Step 5: Complete & Invoice

### Prerequisites
- Status: IN_PROGRESS
- Work completed

### Flow
```
1. Click "Complete & Invoice"
2. Review totals
   ├─ Subtotal
   ├─ Discount (if any)
   ├─ Tax
   └─ Total
3. Confirm
4. Status → INVOICED
5. invoiced_at timestamp set
6. Invoice number assigned
```

### Invoice Actions
- Print invoice
- Email invoice
- Download PDF

---

## 💰 Step 6: Receive Payment

### Flow
```
1. Customer pays (external)
2. Click "Mark as Paid"
3. Payment confirmation
   ├─ Payment method (optional)
   ├─ Payment reference (optional)
   └─ Payment date
4. Confirm
5. Status → PAID
6. paid_at timestamp set
```

### Alternative: Dispute
```
1. Payment issue occurs
2. Click "Mark Disputed"
3. Add dispute notes
4. Status → DISPUTED
5. Resolve later → PAID
```

---

## ⏸️ Side Flow: On Hold

### From IN_PROGRESS
```
1. Issue arises (parts needed, customer unreachable)
2. Click "Place on Hold"
3. Add hold reason
4. Status → ON_HOLD
5. Work paused
```

### Resume
```
1. Issue resolved
2. Click "Resume Work"
3. Status → IN_PROGRESS
```

---

## 📊 Timeline View

Each job maintains a timeline of events:

```
J001 - 2024 Honda Civic
─────────────────────────────────────
● Created                    Dec 15, 9:00 AM
│ Estimate created by John
│
● Line items added           Dec 15, 9:15 AM
│ 4 items totaling $450.00
│
● Sent to customer           Dec 15, 9:20 AM
│ Email sent to customer@email.com
│
● Customer approved          Dec 15, 2:30 PM
│ Status: ESTIMATE → APPROVED
│
● Work started               Dec 16, 8:00 AM
│ Status: APPROVED → IN_PROGRESS
│ Assigned to: Mike
│
● Completed                  Dec 16, 4:00 PM
│ Status: IN_PROGRESS → INVOICED
│
● Payment received           Dec 17, 10:00 AM
│ Status: INVOICED → PAID
│ Method: Credit Card
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

