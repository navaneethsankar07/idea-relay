# IdeaRelay API Guidelines & Specifications

## Base URL

- Development: `http://localhost:8000/api/v1/`
- Production: `https://api.idearelay.io/api/v1/`

## Authentication

Authentication is handled via JWT (JSON Web Tokens) using SimpleJWT:
- Header format: `Authorization: Bearer <access_token>`

## Health Check Endpoint

- **Endpoint**: `GET /api/v1/health/`
- **Auth**: None (Public)
- **Response**:
```json
{
  "status": "healthy",
  "service": "idearelay-django",
  "version": "0.1.0"
}
```

## Planned Resource Endpoints (Subsequent Phases)

- **Authentication**:
  - `POST /api/v1/auth/token/` - Obtain JWT token pair
  - `POST /api/v1/auth/token/refresh/` - Refresh access token
- **Organizations**:
  - `GET /api/v1/organizations/` - List user organizations
  - `POST /api/v1/organizations/` - Create organization
- **Projects**:
  - `GET /api/v1/projects/` - List organization projects
  - `POST /api/v1/projects/` - Create project
- **Feedback**:
  - `GET /api/v1/projects/:projectId/feedback/` - List feedback items
  - `POST /api/v1/projects/:projectId/feedback/` - Submit feedback
  - `POST /api/v1/feedback/:feedbackId/vote/` - Vote on feedback
