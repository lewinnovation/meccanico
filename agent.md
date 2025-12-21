# Meccanico - AI Agent Governance File

> **Purpose:** This file serves as the architectural source of truth and governance document for AI agents working on the Meccanico platform. It ensures consistency, quality, and maintainability across all development activities.

---

## 🏗️ Architectural Overview

### System Architecture
```
┌─────────────────────────────────────────────────────────────────────┐
│                           MECCANICO                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      FRONTEND (React)                        │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐   │   │
│  │  │   MUI   │ │  MobX   │ │ React   │ │ Keyboard Nav    │   │   │
│  │  │Components│ │ Stores  │ │ Router  │ │ + Fuzzy Search  │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │ REST API                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      BACKEND (Node.js)                       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐   │   │
│  │  │  TSOA   │ │ Express │ │TypeORM  │ │ Business Logic  │   │   │
│  │  │Controllers│ │Middleware│ │ Models │ │   Services      │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │ SQL                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    POSTGRESQL DATABASE                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Technology Stack
| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | **Node.js** | **24.x (LTS)** | **JavaScript runtime** |
| Frontend | React | 18.x | UI Framework |
| State Management | MobX | 6.x | Reactive state |
| UI Components | MUI | 5.x | Material Design components |
| Backend Framework | Express | 4.x | HTTP server |
| API Layer | TSOA | 6.x | OpenAPI-compliant controllers |
| ORM | TypeORM | 0.3.x | Database abstraction |
| Database | PostgreSQL | 15.x | Primary data store |
| Container | Docker | 24.x | Deployment |
| Testing | Jest + Playwright | Latest | Unit + E2E testing |

> ⚠️ **Node.js 24 Required:** Use `nvm use` in project root to auto-switch (reads `.nvmrc`)

### Domain Model Overview
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Customer   │────▶│   Vehicle    │────▶│     Job      │
│     (C)      │ 1:N │     (V)      │ 1:N │     (J)      │
└──────────────┘     └──────────────┘     └──────────────┘
                                                │
                     ┌──────────────────────────┼──────────────────────────┐
                     │                          │                          │
                     ▼                          ▼                          ▼
              ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
              │  Inventory   │          │   Labour     │          │   Service    │
              │     (I)      │          │     (L)      │          │     (S)      │
              └──────────────┘          └──────────────┘          └──────────────┘
                     │                          │                          │
                     └──────────────────────────┼──────────────────────────┘
                                                │
                                                ▼
                                         ┌──────────────┐
                                         │   Template   │
                                         │     (T)      │
                                         └──────────────┘
```

---

## 📁 Project Structure

```
meccanico/
├── docs/                          # Documentation
│   ├── models/                    # Domain model specifications
│   ├── user-journeys/             # User flow documentation
│   ├── api/                       # API endpoint documentation
│   └── ui-ux/                     # UI/UX guidelines and mockups
├── backend/
│   ├── src/
│   │   ├── config/                # Configuration files
│   │   ├── controllers/           # TSOA controllers
│   │   ├── models/                # TypeORM entities
│   │   ├── services/              # Business logic layer
│   │   ├── middleware/            # Express middleware
│   │   ├── migrations/            # Database migrations
│   │   └── utils/                 # Utility functions
│   ├── tests/
│   │   ├── unit/                  # Unit tests
│   │   └── integration/           # Integration tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── common/            # Shared components
│   │   │   ├── entities/          # Entity-specific components
│   │   │   └── layout/            # Layout components
│   │   ├── stores/                # MobX stores
│   │   ├── pages/                 # Route pages
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── utils/                 # Utility functions
│   │   ├── i18n/                  # Internationalization
│   │   └── theme/                 # MUI theme configuration
│   ├── tests/
│   │   ├── unit/                  # Component unit tests
│   │   └── e2e/                   # Playwright E2E tests
│   └── package.json
├── docker-compose.yml             # Development environment
├── docker-compose.prod.yml        # Production environment
├── Dockerfile.backend             # Backend container
├── Dockerfile.frontend            # Frontend container
├── agent.md                       # This file
└── README.md                      # Project overview
```

---

## 🎨 Entity Color Coding

| Entity | Prefix | Color | Hex Code | Usage |
|--------|--------|-------|----------|-------|
| Inventory | I | Blue | `#E3F2FD` / `#1976D2` | Parts, materials |
| Labour | L | Orange | `#FFF3E0` / `#F57C00` | Labor charges |
| Service | S | Green | `#E8F5E9` / `#388E3C` | Service packages |
| Template | T | Purple | `#F3E5F5` / `#7B1FA2` | Reusable templates |
| Job | J | Yellow | `#FFFDE7` / `#FBC02D` | Work orders |
| Customer | C | Pink | `#FCE4EC` / `#C2185B` | Client records |
| Vehicle | V | Teal | `#E0F2F1` / `#00796B` | Vehicle records |
| Text | - | White | `#FFFFFF` / `#424242` | Free-form line items |

---

## 📐 Coding Guidelines

### SOLID Principles Application

1. **Single Responsibility**
   - Each service class handles one domain concern
   - Controllers only handle HTTP request/response
   - Models only define data structure and relationships

2. **Open/Closed**
   - Use interfaces for extensible behavior
   - Prefer composition over inheritance
   - Use strategy pattern for varying business rules

3. **Liskov Substitution**
   - All entity types can be treated as line items in jobs
   - Service interfaces are interchangeable

4. **Interface Segregation**
   - Small, focused interfaces
   - Separate read and write interfaces where appropriate

5. **Dependency Inversion**
   - Services depend on abstractions (interfaces)
   - Use dependency injection container

### DRY Principles

- Extract common validation logic to shared utilities
- Use generics for CRUD operations
- Share TypeScript types between frontend and backend
- Use templates for repetitive UI patterns

### Code Style

```typescript
// ✅ Good: Clear naming, single responsibility
class JobService {
  async createJob(data: CreateJobDto): Promise<Job> {
    await this.validateCustomer(data.customerId);
    await this.validateVehicle(data.vehicleId);
    return this.jobRepository.create(data);
  }
}

// ❌ Bad: Mixed concerns, unclear naming
class JobHandler {
  async handle(d: any) {
    // validation + creation + notification in one method
  }
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Entity | PascalCase | `Job`, `Customer`, `Vehicle` |
| Service | PascalCase + "Service" | `JobService`, `InventoryService` |
| Controller | PascalCase + "Controller" | `JobController` |
| Store (MobX) | camelCase + "Store" | `jobStore`, `customerStore` |
| Component | PascalCase | `JobCard`, `CustomerList` |
| Utility | camelCase | `formatCurrency`, `generateCode` |
| Constants | SCREAMING_SNAKE | `MAX_LINE_ITEMS`, `DEFAULT_TAX_RATE` |

---

## 🧪 Testing Requirements

> ⚠️ **MANDATORY:** All code changes MUST include test coverage. Pull requests without adequate tests will be rejected.

### Coverage Targets (ENFORCED)
- **Overall:** ≥80% (MANDATORY - builds will fail below this)
- **Critical Business Logic:** ≥95%
- **API Endpoints:** ≥90%
- **UI Components:** ≥75%

### Test Structure

```
backend/tests/
├── unit/
│   ├── services/           # Service layer tests
│   ├── models/             # Model validation tests
│   └── utils/              # Utility function tests
├── integration/
│   ├── api/                # API endpoint tests
│   └── database/           # Database operation tests

frontend/tests/
├── unit/
│   ├── components/         # Component unit tests
│   ├── stores/             # MobX store tests
│   └── utils/              # Utility function tests
└── e2e/
    ├── workflows/          # User journey tests
    └── pages/              # Page-specific tests
```

### Test Naming Convention
```typescript
describe('JobService', () => {
  describe('createJob', () => {
    it('should create a job with valid data', async () => {});
    it('should throw ValidationError when customer not found', async () => {});
    it('should generate unique job code', async () => {});
  });
});
```

### E2E Test Requirements (Playwright)

> ⚠️ **MANDATORY:** All main user paths MUST have E2E test coverage before feature is considered complete.

#### Customer E2E Tests (Required)
All customer-related features must have the following E2E tests:

| Test | Description | Path |
|------|-------------|------|
| `customer-create.spec.ts` | Create new customer with all fields | `/customers/new` |
| `customer-create-minimal.spec.ts` | Create customer with only required fields | `/customers/new` |
| `customer-create-validation.spec.ts` | Validate form errors (duplicate email, required fields) | `/customers/new` |
| `customer-list.spec.ts` | List, search, filter, paginate customers | `/customers` |
| `customer-view.spec.ts` | View customer details with vehicles | `/customers/:id` |
| `customer-edit.spec.ts` | Edit customer information | `/customers/:id/edit` |
| `customer-delete.spec.ts` | Delete customer (with/without vehicles) | `/customers/:id` |
| `customer-add-vehicle.spec.ts` | Add vehicle to customer | `/customers/:id/vehicles/new` |
| `customer-search.spec.ts` | Search by name, email, phone, code | `/customers` |

#### E2E Test Template
```typescript
// e2e/customer/customer-create.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Customer Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'admin@test.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should create customer with valid data', async ({ page }) => {
    await page.goto('/customers/new');
    
    await page.fill('[data-testid="customer-name"]', 'John Smith');
    await page.fill('[data-testid="customer-email"]', 'john@example.com');
    await page.fill('[data-testid="customer-phone"]', '555-1234');
    await page.click('[data-testid="submit-button"]');
    
    // Verify redirect to customer detail
    await expect(page).toHaveURL(/\/customers\/[a-f0-9-]+/);
    
    // Verify customer code format: C{5 letters}{000}
    const codeElement = await page.locator('[data-testid="customer-code"]');
    await expect(codeElement).toHaveText(/^CJOHNS\d{3}$/);
  });

  test('should show validation error for duplicate email', async ({ page }) => {
    // ... test implementation
  });

  test('should require name field', async ({ page }) => {
    // ... test implementation
  });
});
```

#### Other Entity E2E Requirements

| Entity | Required E2E Tests |
|--------|-------------------|
| **Vehicle** | create, list, view, edit, delete, search |
| **Job** | create, list, view, edit, status transitions, add line items, generate invoice |
| **Inventory** | create, list, view, edit, delete, search, stock management |
| **Labour** | create, list, view, edit, delete |
| **Service** | create, list, view, edit, delete |
| **Template** | create, list, view, edit, delete, apply to job |
| **Auth** | login, logout, session expiry, role-based access |

### Unit Test Requirements

Every new function/method MUST have unit tests covering:
- ✅ Happy path (valid inputs)
- ✅ Edge cases (empty, null, boundary values)
- ✅ Error cases (invalid inputs, exceptions)
- ✅ Business rule validation

#### Example: Code Generator Tests
```typescript
// backend/tests/unit/utils/codeGenerator.test.ts
describe('generateCustomerCode', () => {
  it('should generate code with first 5 letters of name', async () => {
    const code = await generateCustomerCode('John Smith');
    expect(code).toMatch(/^CJOHNS\d{3}$/);
  });

  it('should pad short names with X', async () => {
    const code = await generateCustomerCode('Bob');
    expect(code).toMatch(/^CBOXXX\d{3}$/);
  });

  it('should remove spaces from name', async () => {
    const code = await generateCustomerCode('Mary Jane Watson');
    expect(code).toMatch(/^CMARYJ\d{3}$/);
  });

  it('should increment number for same name prefix', async () => {
    const code1 = await generateCustomerCode('John Smith');
    const code2 = await generateCustomerCode('John Doe');
    // Both should be CJOHNS but different numbers
    expect(code1).toMatch(/^CJOHNS001$/);
    expect(code2).toMatch(/^CJOHND001$/);
  });

  it('should uppercase the name prefix', async () => {
    const code = await generateCustomerCode('alice');
    expect(code).toMatch(/^CALIC/);
  });
});
```

---

## 🚀 Pre-Release Checklist

Before any release or merge to main:

### Testing (MANDATORY - BLOCKING)
- [ ] All unit tests pass (`npm test`)
- [ ] All E2E tests pass (`npm run test:e2e`)
- [ ] Coverage ≥80% overall (`npm run test:coverage`)
- [ ] New code has corresponding unit tests
- [ ] New features have E2E tests for all main paths
- [ ] Customer entity tests: create, list, view, edit, delete, search

### Code Quality
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] No console.log statements in production code

### Architecture
- [ ] SOLID principles followed
- [ ] DRY - no code duplication
- [ ] New code follows established patterns
- [ ] Database migrations are reversible
- [ ] API changes are backward compatible (or versioned)

### Documentation
- [ ] `/docs` updated for any model changes
- [ ] API documentation regenerated
- [ ] User journey docs updated if workflow changed
- [ ] README updated if setup steps changed
- [ ] CHANGELOG updated

### Security
- [ ] No secrets in code
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified

### Performance
- [ ] No N+1 query issues
- [ ] Large datasets handled with pagination
- [ ] Indexes added for new query patterns

### Cleanup
- [ ] Dead code removed
- [ ] Unused dependencies removed
- [ ] Debug code removed
- [ ] TODO comments addressed or ticketed

---

## 📝 Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types
| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, etc.) |
| `refactor` | Code change that neither fixes nor adds |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `chore` | Build process or auxiliary tools |

### Examples
```
feat(job): add ability to duplicate jobs
fix(invoice): correct tax calculation for exempt items
docs(api): update job endpoint documentation
refactor(customer): extract address validation to utility
```

---

## 🔄 AI Agent Workflow

When working on any task:

1. **Context Review**
   - Read relevant `/docs` files
   - Check `agent.md` for guidelines
   - Review related existing code
   - Review existing tests for patterns

2. **Planning**
   - Identify affected models/entities
   - Plan database migrations
   - Define API endpoints
   - Plan frontend state changes
   - **Outline test coverage (MANDATORY)**
   - **Identify E2E test scenarios**

3. **Implementation**
   - Follow coding guidelines
   - Add inline comments for tradeoffs
   - Keep commits atomic and well-described
   - **Write unit tests alongside code (TDD encouraged)**

4. **Build & Test After EVERY Change (MANDATORY)**
   > ⚠️ **CRITICAL:** After EVERY code change, you MUST run build and test commands.
   > Do NOT wait until the end. Run these commands incrementally.
   
   ```bash
   # Backend - Run after EVERY backend change
   cd backend
   npm run build     # TypeScript compilation + TSOA generation
   npm test          # Unit tests
   
   # Frontend - Run after EVERY frontend change  
   cd frontend
   npm run build     # TypeScript compilation + Vite build
   npm test          # Unit tests (if any)
   
   # E2E Tests - Run for feature completion
   cd frontend
   npm run test:e2e  # Playwright E2E tests
   ```
   
   **Build/Test Failure Protocol:**
   1. If build fails → FIX IMMEDIATELY before any other changes
   2. If tests fail → FIX IMMEDIATELY before any other changes
   3. Never proceed with more changes while build/tests are broken
   4. Document any test failures and fixes in commit messages

5. **Verification Checklist (BLOCKING)**
   - [ ] `npm run build` passes (BOTH backend and frontend)
   - [ ] `npm test` passes (BOTH backend and frontend)
   - [ ] `npm run lint` passes
   - [ ] Coverage meets ≥80% threshold
   - [ ] No TypeScript errors
   - [ ] No console warnings in build output

6. **Documentation**
   - Update `/docs` as needed
   - Update API documentation
   - Add to CHANGELOG
   - Document test scenarios in test files

### Quick Verification Script
```bash
# Run this to verify everything is working
cd /path/to/meccanico

# Backend
(cd backend && npm run build && npm test) || echo "❌ BACKEND FAILED"

# Frontend  
(cd frontend && npm run build) || echo "❌ FRONTEND FAILED"

# If all pass
echo "✅ All builds and tests pass"
```

---

## 🔐 Access Control Model

### Roles
| Role | Capabilities |
|------|--------------|
| **Admin (Head Mechanic)** | Full access: settings, pricing, mechanic management, all jobs, all resources |
| **Mechanic** | Own jobs, view inventory, create estimates/invoices, manage customers/vehicles/templates |
| **Viewer** | Read-only access to assigned jobs only |

### Permission Matrix
| Resource | Admin | Mechanic | Viewer |
|----------|-------|----------|--------|
| Jobs (assigned) | CRUD | CRUD | R (assigned only) |
| Jobs (all) | CRUD | R | - |
| Customers | CRUD | CR | R |
| Vehicles | CRUD | CR | R |
| Inventory | CRUD | R | R |
| Labour Rates | CRUD | R | R |
| Services | CRUD | R | R |
| Templates | CRUD | CRUD | R |
| Invoices | CRUD | CR | R |
| Payments | CRUD | CR | R |
| Credit Notes | CRUD | CR | R |
| Settings | CRUD | - | R |
| Communication Templates | CRUD | R | R |
| Payment Methods | CRUD | R | R |
| Vehicle Makes/Models | CRUD | CRUD | R |
| Users | CRUD | - | - |
| Audit Logs | R | R | R |

**Notes:**
- VIEWER can only see jobs assigned to them (`assignedTo = userId`)
- VIEWER cannot create, update, or delete any resources (read-only)
- MECHANIC can create/edit customers, vehicles, jobs, templates, invoices, payments, credit notes
- MECHANIC cannot edit inventory, labour, services, communication templates, settings (admin only)
- All API endpoints require JWT authentication (except `/api/auth/login` and `/api/auth/register`)

---

## 📊 Status Workflows

### Job Status Flow
```
┌─────────┐    ┌──────────┐    ┌─────────────┐    ┌──────────┐    ┌────────┐
│ ESTIMATE│───▶│ APPROVED │───▶│ IN_PROGRESS │───▶│ INVOICED │───▶│  PAID  │
└─────────┘    └──────────┘    └─────────────┘    └──────────┘    └────────┘
     │              │                 │                 │
     ▼              ▼                 ▼                 ▼
┌─────────┐   ┌──────────┐     ┌──────────┐      ┌──────────┐
│CANCELLED│   │ DECLINED │     │ ON_HOLD  │      │ DISPUTED │
└─────────┘   └──────────┘     └──────────┘      └──────────┘
```

### Invoice Locking Rules
- **ESTIMATE:** Fully editable
- **APPROVED:** Line items locked, metadata editable
- **IN_PROGRESS:** Locked (requires admin override to edit)
- **INVOICED:** Completely locked
- **PAID:** Completely locked, archivable

---

## 🌐 i18n Guidelines

- All user-facing strings must use translation keys
- Translation files in `/frontend/src/i18n/`
- Key naming: `<page>.<section>.<element>`
- Example: `job.lineItems.addInventory`

---

## 📐 Keyboard Navigation

### Global Shortcuts
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Cmd/Ctrl + /` | Toggle keyboard shortcuts help |
| `Cmd/Ctrl + N` | New job |
| `Cmd/Ctrl + F` | Global search |

### Entity Quick Access
| Shortcut | Action |
|----------|--------|
| `/I` | Search inventory |
| `/L` | Search labour |
| `/S` | Search services |
| `/T` | Search templates |
| `/C` | Search customers |
| `/V` | Search vehicles |
| `/J` | Search jobs |

### Navigation
| Shortcut | Action |
|----------|--------|
| `↑/↓` | Navigate list items |
| `Enter` | Select/open item |
| `Esc` | Close modal/cancel |
| `Tab` | Next field |
| `Shift + Tab` | Previous field |

---

*Last Updated: 2025-12-16*
*Version: 0.3.0*

