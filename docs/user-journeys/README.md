# User Journeys

> Documentation of key workflows and user flows in the Meccanico platform.

---

## 📚 Journey Index

| Journey | Description | Primary Actor |
|---------|-------------|---------------|
| [Job Lifecycle](./job-lifecycle.md) | Creating and managing jobs from estimate to payment | Mechanic |
| [Customer Onboarding](./customer-onboarding.md) | Adding new customers and vehicles | Mechanic |
| [Inventory Management](./inventory-management.md) | Managing parts catalog and stock | Admin |

---

## 🎯 User Roles

### Admin (Head Mechanic)
- **Full system access** - Can create, read, update, and delete all resources
- Manages shop settings, pricing, users, and system configuration
- Can view and manage all jobs (not limited to assigned jobs)
- Access to all reports and audit logs
- Can manage inventory, labour rates, services, and communication templates
- Can create/edit/delete payment methods and vehicle makes/models

### Mechanic
- **Standard operational access** - Can create and edit customers, vehicles, jobs, templates, invoices, payments, and credit notes
- Can view all jobs but typically works on assigned jobs
- Can view (read-only) inventory, labour rates, services, and communication templates
- Cannot edit inventory, labour, services, communication templates, or settings (admin only)
- Can manage vehicle makes and models
- Read-only access to payment methods

### Viewer
- **Read-only access** - Cannot create, update, or delete any resources
- Can only view jobs assigned to them (`assignedTo = userId`)
- Can view customers, vehicles, inventory, labour, services, templates, invoices, payments, and settings (read-only)
- Cannot access unassigned jobs or make any modifications
- All API endpoints require JWT authentication

---

## ⌨️ Keyboard-First Design

All journeys are designed with keyboard efficiency in mind:

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Command palette |
| `Cmd/Ctrl + N` | New job |
| `/I`, `/L`, `/S` | Quick search by type |
| `↑/↓` | Navigate lists |
| `Enter` | Select/confirm |
| `Esc` | Cancel/close |

---

## 🔄 Common Patterns

### Quick Creation
1. Press `Cmd+N` anywhere
2. Command palette opens
3. Select "New Job"
4. Search customer or create new
5. Select vehicle or create new
6. Job created, ready for line items

### Fuzzy Search
1. Start typing in any search field
2. Results filter in real-time
3. Use arrow keys to navigate
4. Press Enter to select
5. Tab to move to next field

### Status Updates
1. View job detail
2. Click status badge or use shortcut
3. Select new status
4. Confirm if required
5. Timestamps auto-update

