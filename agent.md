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
| Frontend | React | 18.x | UI Framework |
| State Management | MobX | 6.x | Reactive state |
| UI Components | MUI | 5.x | Material Design components |
| Backend Framework | Express | 4.x | HTTP server |
| API Layer | TSOA | 6.x | OpenAPI-compliant controllers |
| ORM | TypeORM | 0.3.x | Database abstraction |
| Database | PostgreSQL | 15.x | Primary data store |
| Container | Docker | 24.x | Deployment |
| Testing | Jest + Playwright | Latest | Unit + E2E testing |

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

### Coverage Targets
- **Overall:** ≥80%
- **Critical Business Logic:** ≥95%
- **API Endpoints:** ≥90%
- **UI Components:** ≥75%

### Test Structure

```
tests/
├── unit/
│   ├── services/           # Service layer tests
│   ├── models/             # Model validation tests
│   └── utils/              # Utility function tests
├── integration/
│   ├── api/                # API endpoint tests
│   └── database/           # Database operation tests
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

---

## 🚀 Pre-Release Checklist

Before any release or merge to main:

### Code Quality
- [ ] All tests pass (`npm test`)
- [ ] Coverage meets thresholds (`npm run coverage`)
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

2. **Planning**
   - Identify affected models/entities
   - Plan database migrations
   - Define API endpoints
   - Plan frontend state changes
   - Outline test coverage

3. **Implementation**
   - Follow coding guidelines
   - Add inline comments for tradeoffs
   - Keep commits atomic and well-described

4. **Verification**
   - Run test suite
   - Check coverage
   - Run linter
   - Verify documentation

5. **Documentation**
   - Update `/docs` as needed
   - Update API documentation
   - Add to CHANGELOG

---

## 🔐 Access Control Model

### Roles
| Role | Capabilities |
|------|--------------|
| **Admin (Head Mechanic)** | Full access: settings, pricing, mechanic management, all jobs |
| **Mechanic** | Own jobs, view inventory, create estimates/invoices |
| **Viewer** | Read-only access to assigned jobs |

### Permission Matrix
| Resource | Admin | Mechanic | Viewer |
|----------|-------|----------|--------|
| Jobs (own) | CRUD | CRUD | R |
| Jobs (all) | CRUD | R | - |
| Customers | CRUD | CR | R |
| Vehicles | CRUD | CR | R |
| Inventory | CRUD | R | R |
| Labour Rates | CRUD | R | R |
| Services | CRUD | R | R |
| Templates | CRUD | CRUD | R |
| Settings | CRUD | - | - |
| Mechanics | CRUD | R (self) | - |
| Reports | CRUD | R (own) | - |

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

*Last Updated: 2024-12-16*
*Version: 0.1.0*

