# Customer Onboarding Journey

> Adding new customers and their vehicles to the system.

---

## 📋 Overview

Customer onboarding typically happens when creating a new job, but customers can also be created independently.

---

## 🆕 Create Customer (Standalone)

### Trigger
- Click "Customers" → "Add Customer"
- Press `Cmd+K` → "New Customer"

### Flow
```
1. Customer form opens
2. Enter required fields:
   ├─ Name*
   └─ (Email, Phone, Address optional)
3. Click "Create Customer"
4. Customer created with code (C001)
5. Redirect to customer detail
6. Prompt: "Add a vehicle?"
```

---

## 🚗 Create Customer with Vehicle

### Common Flow (during job creation)
```
1. Start new job
2. Customer search field
3. No match found
4. Click "Create New Customer"
5. Inline form expands:
   ├─ Name*
   ├─ Phone
   └─ Email
6. Submit → Customer created
7. Vehicle search field
8. Click "Add New Vehicle"
9. Inline form expands:
   ├─ Make*
   ├─ Model*
   ├─ Year
   ├─ License Plate
   └─ VIN (optional)
10. Submit → Vehicle created
11. Continue with job creation
```

---

## 🔍 Search Existing Customer

### Flow
```
1. Start typing in customer field
2. Results appear as you type
3. Matching by:
   ├─ Name (fuzzy)
   ├─ Email (partial)
   ├─ Phone (normalized)
   └─ Code (exact)
4. Arrow keys to navigate
5. Enter to select
6. Customer populated
7. Their vehicles load automatically
```

---

## 📱 Customer Information

### Required Fields
- **Name**: Customer's full name or business name

### Optional Fields
- **Email**: For sending estimates/invoices
- **Phone**: For contact
- **Address**: For records and invoices
- **Notes**: Internal notes about customer

---

## 🚘 Adding Vehicles

### From Customer Detail
```
1. View customer detail
2. Click "Add Vehicle" in vehicles section
3. Vehicle form:
   ├─ Make*
   ├─ Model*
   ├─ Year
   ├─ License Plate
   ├─ VIN
   ├─ Color
   └─ Mileage
4. Submit → Vehicle added
5. Code assigned (V001)
```

### VIN Lookup (Future Enhancement)
```
1. Enter VIN
2. System looks up vehicle info
3. Auto-fills: Make, Model, Year
4. User confirms/adjusts
```

---

## 📊 Customer Overview

After onboarding, customer detail shows:

```
┌─────────────────────────────────────────────┐
│ C001 - John Smith                           │
├─────────────────────────────────────────────┤
│ 📧 john@email.com                           │
│ 📱 (555) 123-4567                           │
│ 📍 123 Main St, City, State 12345          │
├─────────────────────────────────────────────┤
│ Vehicles (2)                                │
│ ┌─────────────────────────────────────────┐ │
│ │ V001 - 2024 Honda Civic (ABC-1234)     │ │
│ │ V002 - 2022 Toyota Camry (XYZ-5678)    │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Recent Jobs                                 │
│ J001 - Oil Change (PAID)        Dec 15     │
│ J002 - Brake Service (IN_PROGRESS) Dec 17  │
└─────────────────────────────────────────────┘
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/C` | Search customers |
| `Cmd+K` → "customer" | New customer |
| `/V` | Search vehicles |

---

*See also: [Customer Model](../models/customer.md) | [Vehicle Model](../models/vehicle.md)*

