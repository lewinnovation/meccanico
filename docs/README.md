# Meccanico Documentation

> **Meccanico** — A modern, keyboard-driven mechanics shop management platform with a Linear-style interface.

---

## 📚 Documentation Index

### Core Documentation
| Document | Description |
|----------|-------------|
| [Architecture Overview](./architecture.md) | System architecture, tech stack, and design decisions |
| [Domain Models](./models/README.md) | Entity specifications and relationships |
| [API Reference](./api/README.md) | REST API endpoint documentation |
| [User Journeys](./user-journeys/README.md) | Workflow documentation and user flows |
| [UI/UX Guidelines](./ui-ux/README.md) | Design system and interaction patterns |
| [Environment Variables](./ENVIRONMENT_VARIABLES.md) | Complete environment variable reference and setup guide |

### Quick Links
- [Agent Governance](/agent.md) — AI agent guidelines and pre-release checklist
- [Getting Started](./getting-started.md) — Development setup guide
- [Contributing](./contributing.md) — Contribution guidelines

---

## 🎯 Platform Overview

Meccanico is a job, inventory, and service management system designed specifically for vehicle repair shops. It combines the workflow efficiency of Linear with domain-specific features for mechanics.

### Key Features
- **Job Management** — Track jobs from estimate to paid invoice
- **Inventory Control** — Parts and materials management
- **Labour & Services** — Standardized pricing for work types
- **Customer & Vehicle Records** — Complete service history
- **Template System** — Reusable job templates
- **Multi-mechanic Support** — Role-based access control
- **Keyboard-First Navigation** — Efficient workflow with shortcuts
- **CSV Export** — Reporting and data export

### Entity Types
| Entity | Code | Color | Description |
|--------|------|-------|-------------|
| Inventory | I | 🔵 Blue | Parts, materials, consumables |
| Labour | L | 🟠 Orange | Hourly/fixed labor charges |
| Service | S | 🟢 Green | Bundled service packages |
| Template | T | 🟣 Purple | Reusable job templates |
| Job | J | 🟡 Yellow | Work orders and invoices |
| Customer | C | 🩷 Pink | Client records |
| Vehicle | V | 🩵 Teal | Vehicle records |

---

## 🏗️ Architecture Summary

```
Frontend (React + MobX + MUI)
         │
         │ REST API
         ▼
Backend (Express + TSOA + TypeORM)
         │
         │ SQL
         ▼
   PostgreSQL Database
```

### Technology Stack
- **Frontend:** React 18, MobX 6, MUI 5, TypeScript
- **Backend:** Node.js, Express, TSOA, TypeORM
- **Database:** PostgreSQL 15
- **Infrastructure:** Docker, Docker Compose, GCP Cloud Run ready

---

## 📁 Documentation Structure

```
docs/
├── README.md                 # This file
├── architecture.md           # System architecture deep-dive
├── ENVIRONMENT_VARIABLES.md  # Environment variable reference
├── getting-started.md        # Development setup
├── contributing.md           # Contribution guidelines
├── models/
│   ├── README.md            # Models overview
│   ├── customer.md          # Customer entity spec
│   ├── vehicle.md           # Vehicle entity spec
│   ├── job.md               # Job entity spec
│   ├── inventory.md         # Inventory entity spec
│   ├── labour.md            # Labour entity spec
│   ├── service.md           # Service entity spec
│   └── template.md          # Template entity spec
├── user-journeys/
│   ├── README.md            # User journeys overview
│   ├── job-lifecycle.md     # Creating and managing jobs
│   ├── customer-onboarding.md
│   └── inventory-management.md
├── api/
│   ├── README.md            # API overview
│   ├── authentication.md    # Auth endpoints
│   ├── jobs.md              # Job endpoints
│   ├── customers.md         # Customer endpoints
│   └── ...
└── ui-ux/
    ├── README.md            # UI/UX overview
    ├── design-system.md     # Colors, typography, spacing
    ├── components.md        # Component library
    └── keyboard-navigation.md
```

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2024-12-16 | Initial documentation structure |

---

*For AI agents: Always consult `/agent.md` for coding guidelines and pre-release checklist.*

