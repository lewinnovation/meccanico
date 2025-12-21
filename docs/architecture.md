# Architecture Overview

> Comprehensive technical architecture documentation for the Meccanico platform.

---

## 🎯 Design Principles

### 1. Separation of Concerns
- **Controllers** handle HTTP request/response only
- **Services** contain all business logic
- **Models** define data structure and relationships
- **Stores** manage frontend state

### 2. Type Safety
- Full TypeScript across frontend and backend
- Shared type definitions where possible
- Runtime validation with class-validator

### 3. Testability
- Dependency injection for mockable services
- Pure functions where possible
- Clear boundaries between layers

### 4. Scalability
- Stateless backend (ready for horizontal scaling)
- Connection pooling for database
- Optimistic UI updates

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         React Application                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │    Pages     │  │  Components  │  │    Hooks     │                 │ │
│  │  │  (Routes)    │  │    (MUI)     │  │  (Custom)    │                 │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │ │
│  │         │                 │                 │                          │ │
│  │         └─────────────────┼─────────────────┘                          │ │
│  │                           ▼                                            │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │                      MobX Stores                                 │  │ │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │  │ │
│  │  │  │  Auth   │ │   Job   │ │Customer │ │Inventory│ │   UI    │   │  │ │
│  │  │  │  Store  │ │  Store  │ │  Store  │ │  Store  │ │  Store  │   │  │ │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  │                           │                                            │ │
│  │                           ▼                                            │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │                      API Client Layer                            │  │ │
│  │  │             (Axios + Request/Response Interceptors)              │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS (REST API)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SERVER LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         Express Application                            │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │                        Middleware Stack                          │  │ │
│  │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────────┐ │  │ │
│  │  │  │  CORS  │ │  Auth  │ │ Logger │ │ Error  │ │ Rate Limiting  │ │  │ │
│  │  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────────────┘ │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  │                           │                                            │ │
│  │                           ▼                                            │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │                     TSOA Controllers                             │  │ │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │  │ │
│  │  │  │  Auth   │ │   Job   │ │Customer │ │Inventory│ │ Reports │   │  │ │
│  │  │  │  Ctrl   │ │  Ctrl   │ │  Ctrl   │ │  Ctrl   │ │  Ctrl   │   │  │ │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  │                           │                                            │ │
│  │                           ▼                                            │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │                      Service Layer                               │  │ │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │  │ │
│  │  │  │  Auth   │ │   Job   │ │Customer │ │Inventory│ │ Invoice │   │  │ │
│  │  │  │ Service │ │ Service │ │ Service │ │ Service │ │ Service │   │  │ │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  │                           │                                            │ │
│  │                           ▼                                            │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │                     TypeORM Layer                                │  │ │
│  │  │  ┌───────────────────────────────────────────────────────────┐  │  │ │
│  │  │  │                   Entity Models                            │  │  │ │
│  │  │  │  Customer │ Vehicle │ Job │ LineItem │ Inventory │ ...    │  │  │ │
│  │  │  └───────────────────────────────────────────────────────────┘  │  │ │
│  │  │  ┌───────────────────────────────────────────────────────────┐  │  │ │
│  │  │  │                   Repositories                             │  │  │ │
│  │  │  └───────────────────────────────────────────────────────────┘  │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ SQL (Connection Pool)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         PostgreSQL 15                                  │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │  │                          Tables                                   │ │ │
│  │  │  users │ customers │ vehicles │ jobs │ line_items │ inventory    │ │ │
│  │  │  labour │ services │ templates │ settings │ audit_logs           │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Module Structure

### Backend Modules

```
backend/src/
├── config/
│   ├── database.ts          # TypeORM configuration
│   ├── auth.ts              # JWT and auth config
│   └── app.ts               # Application settings
├── controllers/
│   ├── AuthController.ts
│   ├── JobController.ts
│   ├── CustomerController.ts
│   ├── VehicleController.ts
│   ├── InventoryController.ts
│   ├── LabourController.ts
│   ├── ServiceController.ts
│   ├── TemplateController.ts
│   ├── SettingsController.ts
│   └── ReportController.ts
├── services/
│   ├── AuthService.ts
│   ├── JobService.ts
│   ├── CustomerService.ts
│   ├── VehicleService.ts
│   ├── InventoryService.ts
│   ├── LabourService.ts
│   ├── ServiceService.ts
│   ├── TemplateService.ts
│   ├── SettingsService.ts
│   ├── ReportService.ts
│   └── CodeGeneratorService.ts
├── models/
│   ├── User.ts
│   ├── Customer.ts
│   ├── Vehicle.ts
│   ├── Job.ts
│   ├── LineItem.ts
│   ├── Inventory.ts
│   ├── Labour.ts
│   ├── Service.ts
│   ├── Template.ts
│   ├── Settings.ts
│   └── AuditLog.ts
├── middleware/
│   ├── auth.ts              # JWT verification
│   ├── errorHandler.ts      # Global error handling
│   ├── requestLogger.ts     # Request logging
│   └── rateLimiter.ts       # Rate limiting
├── migrations/
│   └── *.ts                 # Database migrations
├── utils/
│   ├── codeGenerator.ts     # Entity code generation
│   ├── validators.ts        # Shared validation
│   └── helpers.ts           # Utility functions
└── types/
    ├── dto/                 # Data transfer objects
    └── interfaces/          # Shared interfaces
```

### Frontend Modules

```
frontend/src/
├── components/
│   ├── common/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Table/
│   │   ├── Badge/
│   │   ├── Card/
│   │   ├── CommandPalette/
│   │   └── FuzzySearch/
│   ├── entities/
│   │   ├── job/
│   │   ├── customer/
│   │   ├── vehicle/
│   │   ├── inventory/
│   │   ├── labour/
│   │   ├── service/
│   │   └── template/
│   └── layout/
│       ├── Sidebar/
│       ├── Header/
│       ├── MainLayout/
│       └── PageContainer/
├── stores/
│   ├── RootStore.ts
│   ├── AuthStore.ts
│   ├── JobStore.ts
│   ├── CustomerStore.ts
│   ├── VehicleStore.ts
│   ├── InventoryStore.ts
│   ├── LabourStore.ts
│   ├── ServiceStore.ts
│   ├── TemplateStore.ts
│   ├── SettingsStore.ts
│   └── UIStore.ts
├── pages/
│   ├── Dashboard/
│   ├── Jobs/
│   ├── Customers/
│   ├── Inventory/
│   ├── Settings/
│   └── Reports/
├── hooks/
│   ├── useKeyboardShortcuts.ts
│   ├── useFuzzySearch.ts
│   ├── useDebounce.ts
│   └── useApi.ts
├── utils/
│   ├── api.ts               # Axios client
│   ├── formatters.ts        # Display formatters
│   └── validators.ts        # Client-side validation
├── i18n/
│   ├── en.json
│   └── index.ts
└── theme/
    ├── palette.ts           # Color definitions
    ├── typography.ts        # Font settings
    └── index.ts             # MUI theme
```

---

## 🔐 Authentication & Authorization

### Authentication Flow

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│ Client  │         │ Backend │         │   DB    │
└────┬────┘         └────┬────┘         └────┬────┘
     │                   │                   │
     │  POST /auth/login │                   │
     │──────────────────▶│                   │
     │  {email, password}│                   │
     │                   │  Verify user      │
     │                   │──────────────────▶│
     │                   │                   │
     │                   │◀──────────────────│
     │                   │  User record      │
     │                   │                   │
     │  {accessToken,    │                   │
     │   refreshToken}   │                   │
     │◀──────────────────│                   │
     │                   │                   │
     │  GET /jobs        │                   │
     │  Authorization:   │                   │
     │  Bearer <token>   │                   │
     │──────────────────▶│                   │
     │                   │  Verify JWT       │
     │                   │──────────────────▶│
     │                   │◀──────────────────│
     │                   │                   │
     │  {jobs: [...]}    │                   │
     │◀──────────────────│                   │
     │                   │                   │
```

### Token Strategy
- **Access Token:** Short-lived (15 min), used for API requests
- **Refresh Token:** Long-lived (7 days), used to obtain new access tokens
- **Storage:** Access token in memory, refresh token in httpOnly cookie

### Authorization (Role-Based Access Control)

All API endpoints require JWT authentication (except `/api/auth/login` and `/api/auth/register`). Role-based access control is enforced at multiple levels:

#### Backend Authorization
- **Controller Level:** All controllers have `@Security('jwt')` decorator at class level
- **Endpoint Level:** Specific endpoints have role restrictions using `@Security('jwt', ['ADMIN', 'MECHANIC'])` or `@Security('jwt', ['ADMIN'])`
- **Service Level:** Business logic enforces role-based filtering (e.g., VIEWER can only see assigned jobs)
- **Middleware:** `expressAuthentication()` validates JWT and checks role permissions

#### Frontend Authorization
- **UI Restrictions:** Buttons and forms are hidden/disabled based on user role
- **Store Level:** Stores prevent unauthorized mutations (throw errors if VIEWER tries to create/edit/delete)
- **Route Protection:** Routes may be restricted based on role (future enhancement)

#### Role Permissions

| Resource | ADMIN | MECHANIC | VIEWER |
|----------|-------|----------|--------|
| Jobs (assigned) | CRUD | CRUD | R (assigned only) |
| Jobs (all) | CRUD | R | - |
| Customers | CRUD | CR | R |
| Vehicles | CRUD | CR | R |
| Inventory | CRUD | R | R |
| Labour | CRUD | R | R |
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

**Legend:** C = Create, R = Read, U = Update, D = Delete, - = No access

**Key Restrictions:**
- VIEWER can only access jobs where `assignedTo = userId`
- VIEWER cannot create, update, or delete any resources
- MECHANIC cannot edit inventory, labour, services, communication templates, or settings (admin only)
- All endpoints require valid JWT token in Authorization header

---

## 🗄️ Database Schema Overview

```sql
-- Core entities
users (id, email, password_hash, name, role, created_at, updated_at)
customers (id, code, name, email, phone, address, notes, created_at, updated_at)
vehicles (id, code, customer_id, make, model, year, vin, license_plate, notes, created_at, updated_at)

-- Job and line items
jobs (id, code, customer_id, vehicle_id, status, notes, tax_rate, created_at, updated_at, assigned_to)
line_items (id, job_id, type, reference_id, description, quantity, unit_price, created_at)

-- Catalog
inventory (id, code, name, description, sku, unit_price, cost_price, quantity_in_stock, category, created_at, updated_at)
labour (id, code, name, description, hourly_rate, default_hours, created_at, updated_at)
services (id, code, name, description, base_price, created_at, updated_at)
service_items (id, service_id, item_type, item_id, quantity)

-- Templates
templates (id, code, name, description, created_by, created_at, updated_at)
template_items (id, template_id, item_type, item_id, quantity)

-- Settings
settings (id, key, value, updated_at)
audit_logs (id, user_id, action, entity_type, entity_id, old_value, new_value, created_at)
```

---

## 🔄 Data Flow Example: Creating a Job

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CREATE JOB FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

1. User Action
   └─▶ User clicks "New Job" or presses Cmd+N

2. Frontend (React + MobX)
   └─▶ UIStore opens job creation modal
   └─▶ User fills form (customer, vehicle, initial notes)
   └─▶ JobStore.createJob() called

3. API Client
   └─▶ POST /api/jobs
   └─▶ Request includes: { customerId, vehicleId, notes }

4. Backend Controller (JobController)
   └─▶ Validates request body
   └─▶ Extracts user from JWT
   └─▶ Calls JobService.create()

5. Service Layer (JobService)
   └─▶ Validates customer exists
   └─▶ Validates vehicle belongs to customer
   └─▶ Generates unique code (J001, J002, ...)
   └─▶ Creates job record
   └─▶ Creates audit log entry
   └─▶ Returns created job

6. Response
   └─▶ 201 Created with job data
   └─▶ Frontend JobStore updates state
   └─▶ UI navigates to job detail view
```

---

## 🚀 Deployment Architecture

### Development
```
┌─────────────────────────────────────────────────┐
│              Docker Compose                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │Frontend │  │ Backend │  │   PostgreSQL    │ │
│  │ :3000   │  │  :4000  │  │     :5432       │ │
│  └─────────┘  └─────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Production (GCP Cloud Run)
```
┌─────────────────────────────────────────────────────────────────┐
│                        GCP Cloud Run                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Load Balancer                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                      │                │                          │
│              ┌───────┴───────┐ ┌──────┴──────┐                  │
│              ▼               ▼ ▼             ▼                  │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │ Frontend (CDN)  │  │ Backend (Run)   │                       │
│  │   Static SPA    │  │   Auto-scaling  │                       │
│  └─────────────────┘  └─────────────────┘                       │
│                               │                                  │
│                               ▼                                  │
│                    ┌─────────────────┐                          │
│                    │  Cloud SQL      │                          │
│                    │  (PostgreSQL)   │                          │
│                    └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Performance Considerations

### Backend
- Connection pooling (20 connections default)
- Query optimization with proper indexes
- Pagination for list endpoints (default 50, max 100)
- Response compression (gzip)

### Frontend
- Code splitting by route
- Lazy loading of heavy components
- Optimistic UI updates
- Virtual scrolling for large lists
- Service worker for offline capability

### Database
- Indexes on: code, customer_id, vehicle_id, status, created_at
- Composite indexes for common query patterns
- Partitioning for audit_logs table (by date)

---

*See `/agent.md` for coding standards and `/docs/models/` for entity specifications.*

