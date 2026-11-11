# IdeaRelay

IdeaRelay is a modern multi-tenant SaaS feedback management platform designed for product teams to collect, organize, and prioritize customer feedback with real-time updates.

## Architecture & Monorepo Structure

```
.
├── backend/
│   ├── django/        # Main Django REST Framework API (Python 3.12, SimpleJWT, Neon PostgreSQL)
│   └── realtime/      # TypeScript service for Neon Realtime query sealing and subscriptions
├── frontend/
│   ├── dashboard/     # React 18 + Vite + TypeScript + Tailwind CSS customer dashboard
│   └── widget/        # Standalone embeddable JavaScript feedback widget
├── infrastructure/    # Docker configurations and deployment manifests
└── docs/              # System architecture, database, API, and integration docs
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Redux Toolkit, React Hook Form, Zod
- **Backend**: Python 3.12, Django 5.1, Django REST Framework, SimpleJWT, PostgreSQL (Neon)
- **Realtime**: Node.js 20, TypeScript, Express, Neon Realtime SDK
- **Testing & Quality**: Vitest, React Testing Library, Pytest, Ruff, ESLint, Docker Compose

## Quick Start (Local Development)

### Prerequisites

- Node.js >= 20
- Python >= 3.12
- Docker & Docker Compose (optional for containerized setup)

### 1. Frontend Dashboard

```bash
cd frontend/dashboard
npm install
npm run dev
```
Accessible at `http://localhost:5173`.

### 2. Django REST API

```bash
cd backend/django
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
python manage.py runserver
```
API Health Check: `http://localhost:8000/api/v1/health/`

### 3. Realtime Service

```bash
cd backend/realtime
npm install
npm run dev
```
Realtime Service Health Check: `http://localhost:3001/health`

### 4. Embeddable Widget

```bash
cd frontend/widget
npm install
npm run build
```

### 5. Running via Docker Compose

```bash
docker compose up -d
```

## Running Tests

- **Frontend Dashboard Tests**: `cd frontend/dashboard && npm test`
- **Frontend Widget Tests**: `cd frontend/widget && npm test`
- **Django Backend Tests**: `cd backend/django && .venv/bin/pytest`
- **Realtime Service Tests**: `cd backend/realtime && npm test`

## Documentation

- [System Architecture](docs/architecture.md)
- [Database Schema & Multi-Tenancy Design](docs/database.md)
- [API Guidelines & Specification](docs/api.md)
- [Widget Integration Guide](docs/widget-integration.md)
