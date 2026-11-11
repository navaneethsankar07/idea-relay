# IdeaRelay Database Design

IdeaRelay utilizes **Neon PostgreSQL** serverless database, taking advantage of branching, connection pooling, and Neon Realtime replication.

## Multi-Tenant Isolation Strategy

Tenant isolation is maintained through tenant scoping (`organization_id` and `project_id`) across core entity models:

```mermaid
erDiagram
    ORGANIZATION ||--o{ MEMBERSHIP : has
    ORGANIZATION ||--o{ PROJECT : owns
    USER ||--o{ MEMBERSHIP : belongs_to
    PROJECT ||--o{ FEEDBACK : receives
    FEEDBACK ||--o{ VOTE : collects
    FEEDBACK ||--o{ COMMENT : contains

    ORGANIZATION {
        uuid id PK
        string name
        string slug
        timestamp created_at
    }

    PROJECT {
        uuid id PK
        uuid organization_id FK
        string name
        string api_key
        timestamp created_at
    }

    FEEDBACK {
        uuid id PK
        uuid project_id FK
        uuid author_id FK
        string title
        text description
        string status
        int upvotes_count
        timestamp created_at
    }
```

## Neon Realtime Integration

- Query sealing is utilized to authorize client subscriptions securely without exposing raw database credentials to clients.
- Logical replication streams feed realtime changes into subscribed dashboard views.
