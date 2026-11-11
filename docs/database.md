# IdeaRelay Database Design

IdeaRelay utilizes **Neon PostgreSQL** serverless database, taking advantage of branching, connection pooling, and Neon Realtime replication.

## Authentication & User Models (Phase 2)

```mermaid
erDiagram
    USER ||--o{ OAUTH_ACCOUNT : has
    USER ||--o{ MEMBERSHIP : belongs_to
    ORGANIZATION ||--o{ MEMBERSHIP : has

    USER {
        uuid id PK
        string email UK "Case-insensitive unique login identifier"
        string first_name
        string last_name
        string password "Hashed via Django PBKDF2"
        string avatar_url "Nullable URL"
        boolean is_email_verified "Default false"
        boolean is_active "Default true"
        boolean is_staff "Default false"
        timestamp created_at
        timestamp updated_at
    }

    OAUTH_ACCOUNT {
        uuid id PK
        uuid user_id FK "Cascade delete"
        string provider "Choices: github, google"
        string provider_user_id "External provider unique ID"
        string provider_email "Email returned by provider"
        timestamp created_at
        timestamp updated_at
    }
```

### Table Specifications

#### 1. `users_user`
- **`id`**: `UUID` primary key (default `uuid_generate_v4()`).
- **`email`**: `VARCHAR(255)` unique index, lowercase normalized.
- **`first_name`** / **`last_name`**: `VARCHAR(150)`.
- **`avatar_url`**: `VARCHAR(1024)` nullable.
- **`is_email_verified`**: `BOOLEAN` default `FALSE`.
- **`is_active`**: `BOOLEAN` default `TRUE`.
- **`is_staff`**: `BOOLEAN` default `FALSE`.
- **`created_at`** / **`updated_at`**: `TIMESTAMPTZ`.

#### 2. `users_oauthaccount`
- **`id`**: `UUID` primary key.
- **`user_id`**: Foreign Key referencing `users_user.id` (`ON DELETE CASCADE`).
- **`provider`**: `VARCHAR(32)` (`github` | `google`).
- **`provider_user_id`**: `VARCHAR(255)`.
- **`provider_email`**: `VARCHAR(255)`.
- **Constraints**:
  - `UniqueConstraint(fields=['provider', 'provider_user_id'], name='unique_provider_user')`
  - `UniqueConstraint(fields=['user', 'provider'], name='unique_user_provider_account')`

---

## Multi-Tenant Schema (Subsequent Phases)

Tenant isolation is maintained through tenant scoping (`organization_id` and `project_id`) across core entity models:

```mermaid
erDiagram
    ORGANIZATION ||--o{ PROJECT : owns
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
