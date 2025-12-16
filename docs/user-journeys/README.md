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
- Full system access
- Manages shop settings, pricing, users
- Can override locked jobs
- Access to all reports

### Mechanic
- Creates and manages jobs
- Adds customers and vehicles
- Views inventory and pricing
- Limited to own jobs (configurable)

### Viewer
- Read-only access
- Can view assigned jobs
- Cannot make changes

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

