# Infrastructure Configuration

This directory contains Docker configurations and deployment assets for **IdeaRelay**.

## Components

- **`docker/django.Dockerfile`**: Multi-stage/optimized Python container for the Django REST API backend.
- **`docker/realtime.Dockerfile`**: Node.js container for the TypeScript Neon Realtime service.
- **`docker/dashboard.Dockerfile`**: Multi-stage container building the Vite React frontend and serving with Nginx.
- **`docker/nginx.conf`**: Nginx configuration with single-page app history API fallback.

## Running with Docker Compose

From the root directory of the repository:

```bash
docker compose up -d
```

Services will be accessible at:
- **Dashboard**: `http://localhost:3000`
- **Django REST API**: `http://localhost:8000/api/v1/health/`
- **Realtime Service**: `http://localhost:3001/health`
- **PostgreSQL**: `localhost:5432`
