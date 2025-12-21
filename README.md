# 🔧 Meccanico

> A modern, keyboard-driven vehicle repair shop management platform with a Linear-style interface.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)

---

## ✨ Features

- **Job Management** — Track jobs from estimate to paid invoice
- **Inventory Control** — Parts and materials management with stock tracking
- **Labour & Services** — Standardized pricing for work types and service packages
- **Customer & Vehicle Records** — Complete service history
- **Template System** — Reusable job templates for common services
- **Multi-mechanic Support** — Role-based access control
- **Keyboard-First Navigation** — Efficient workflow with `Cmd+K` command palette
- **CSV Export** — Reporting and data export

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, MobX, MUI 5, TypeScript |
| **Backend** | Node.js, Express, TSOA, TypeORM |
| **Database** | PostgreSQL 15 |
| **Infrastructure** | Docker, Docker Compose |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/meccanico.git
   cd meccanico
   ```

2. **Start with Docker Compose** (recommended)
   ```bash
   docker-compose up -d
   ```
   
   This starts:
   - PostgreSQL on `localhost:5432`
   - Backend API on `localhost:4000`
   - Frontend on `localhost:3000`

3. **Or run locally**
   
   ```bash
   # Terminal 1: Start PostgreSQL
   docker-compose up postgres -d
   
   # Terminal 2: Start Backend
   cd backend
   npm install
   npm run dev
   
   # Terminal 3: Start Frontend
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:4000/api/docs
   - Database: `postgresql://meccanico:meccanico_dev_password@localhost:5432/meccanico`

### Demo Credentials

```
Email: admin@meccanico.dev
Password: admin123
```

---

## 📁 Project Structure

```
meccanico/
├── docs/                    # Documentation
│   ├── models/              # Domain model specs
│   ├── user-journeys/       # User flow docs
│   ├── api/                 # API documentation
│   └── ui-ux/               # Design system
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── controllers/     # TSOA controllers
│   │   ├── models/          # TypeORM entities
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   └── utils/           # Utilities
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── stores/          # MobX stores
│   │   ├── pages/           # Route pages
│   │   ├── hooks/           # Custom hooks
│   │   └── theme/           # MUI theme
│   └── tests/
├── docker-compose.yml
├── agent.md                 # AI agent governance
└── README.md
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Cmd/Ctrl + N` | New job |
| `/I` | Search inventory |
| `/L` | Search labour |
| `/S` | Search services |
| `/C` | Search customers |
| `/J` | Search jobs |
| `↑/↓` | Navigate lists |
| `Enter` | Select item |
| `Esc` | Close modal |

---

## 🎨 Entity Color Coding

| Entity | Color | Description |
|--------|-------|-------------|
| Inventory | 🔵 Blue | Parts, materials |
| Labour | 🟠 Orange | Labor charges |
| Service | 🟢 Green | Service packages |
| Template | 🟣 Purple | Job templates |
| Job | 🟡 Yellow | Work orders |
| Customer | 🩷 Pink | Client records |
| Vehicle | 🩵 Teal | Vehicle records |

---

## 📝 Development

### Backend Commands

```bash
cd backend

# Development server with hot reload
npm run dev

# Build for production
npm run build

# Generate TSOA routes and OpenAPI spec
npm run tsoa:generate

# Run database migrations
npm run migration:run

# Run tests
npm test
npm run test:coverage
```

### Frontend Commands

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```

---

## 📖 Documentation

- [Architecture Overview](./docs/architecture.md)
- [Domain Models](./docs/models/README.md)
- [User Journeys](./docs/user-journeys/README.md)
- [UI/UX Guidelines](./docs/ui-ux/README.md)
- [Agent Governance](./agent.md)

---

## 🔐 Access Control

| Role | Capabilities |
|------|--------------|
| **Admin** | Full access: settings, pricing, user management, all jobs, all resources |
| **Mechanic** | Own jobs, customers, vehicles, templates, invoices, payments. Read-only access to inventory, labour, services, communication templates |
| **Viewer** | Read-only access to assigned jobs only. Cannot create, update, or delete any resources |

**Detailed Permission Matrix:**
- **VIEWER**: Can only see jobs assigned to them (`assignedTo = userId`). Read-only access to all other resources.
- **MECHANIC**: Can create/edit customers, vehicles, jobs, templates, invoices, payments, credit notes. Can view all jobs. Cannot edit inventory, labour, services, communication templates, or settings (admin only).
- **ADMIN**: Full CRUD access to all resources.

All API endpoints require JWT authentication (except `/api/auth/login` and `/api/auth/register`). See [docs/models/user.md](./docs/models/user.md) for complete permission details.

---

## 🚀 Deployment

### Docker Production Build

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### GCP Cloud Run

The application is designed to run on GCP Cloud Run with Cloud SQL for PostgreSQL.

```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/meccanico-backend ./backend
gcloud builds submit --tag gcr.io/PROJECT_ID/meccanico-frontend ./frontend

# Deploy to Cloud Run
gcloud run deploy meccanico-api --image gcr.io/PROJECT_ID/meccanico-backend
gcloud run deploy meccanico-web --image gcr.io/PROJECT_ID/meccanico-frontend
```

---

## 🧪 Testing

- **Unit Tests**: Jest (backend), Vitest (frontend)
- **E2E Tests**: Playwright
- **Coverage Target**: 80%+

```bash
# Run all tests
npm test

# With coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/) format enforced by commitlint and husky.

**Format**: `<type>(<scope>): <subject>`

**Example**: `feat(backend): add customer code generation`

All commits are automatically validated. Invalid commit messages will be rejected. See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

Built with ❤️ for mechanics everywhere.

