# Inventory Management Journey

> Managing parts catalog, pricing, and stock levels.

---

## 📋 Overview

Inventory management is primarily an admin function, covering the parts and materials catalog used in jobs.

---

## 📦 Add Inventory Item

### Flow
```
1. Navigate to Inventory section
2. Click "Add Item" or Cmd+N
3. Fill form:
   ├─ Name*
   ├─ Description
   ├─ SKU (optional, auto-generate)
   ├─ Unit Price*
   ├─ Cost Price (for margin tracking)
   ├─ Category
   ├─ Unit (each, liter, etc.)
   └─ Initial Stock Quantity
4. Save → Item created
5. Code assigned (I001)
```

---

## 💰 Update Pricing

### Flow
```
1. Find item (search or browse)
2. Click to edit
3. Update Unit Price
4. Save
5. Change is audited
6. Existing job line items NOT affected
```

---

## 📊 Stock Management

### Adjust Stock
```
1. Find item
2. Click "Adjust Stock"
3. Enter adjustment (+/- quantity)
4. Enter reason (receiving, damaged, etc.)
5. Confirm
6. Stock level updated
```

### Low Stock Alerts
- Items with quantity ≤ minimum show warning
- Dashboard widget shows low stock items
- Optional email alerts (future)

---

## 📁 Categories

### Managing Categories
```
1. Inventory → Categories
2. View existing categories
3. Add/Edit/Delete categories
4. Drag to reorder
5. Assign items to categories
```

### Suggested Categories
- Filters & Fluids
- Brakes
- Engine Parts
- Electrical
- Suspension
- Consumables

---

## 📥 Bulk Import

### CSV Import
```
1. Inventory → Import
2. Download template CSV
3. Fill in items
4. Upload CSV
5. Preview import
6. Confirm
7. Items created
```

### CSV Format
```csv
name,sku,unit_price,cost_price,category,unit,quantity
"Brake Pads - Front","BP-001",45.00,25.00,"Brakes","set",10
"Oil Filter","OF-001",12.00,6.00,"Filters & Fluids","each",25
```

---

## 📊 Reports

- **Stock Valuation**: Total value of inventory
- **Low Stock Report**: Items below minimum
- **Usage Report**: Most used items
- **Margin Report**: Profit margins by item

---

*See also: [Inventory Model](../models/inventory.md) | [Labour Model](../models/labour.md)*

