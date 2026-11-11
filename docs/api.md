# IdeaRelay API Specifications

## Base URL

- Development: `http://localhost:8000/api/v1/`
- Production: `https://api.idearelay.io/api/v1/`

---

## Health Check Endpoint

- **Endpoint**: `GET /api/v1/health/`
- **Auth**: None (Public)
- **Response**: `200 OK`
```json
{
  "status": "healthy",
  "service": "idearelay-django",
  "version": "0.1.0"
}
```

---

## Authentication Endpoints (`/api/v1/auth/`)

### 1. User Registration
- **Endpoint**: `POST /api/v1/auth/register/`
- **Auth**: None
- **Body**:
```json
{
  "email": "user@company.com",
  "password": "StrongPassword123!",
  "password_confirm": "StrongPassword123!",
  "first_name": "Jane",
  "last_name": "Doe"
}
```
- **Response**: `201 Created`
  - Returns user profile and token pair.
  - Sets HttpOnly `refresh_token` cookie.
  - Sends email verification message.

### 2. User Login
- **Endpoint**: `POST /api/v1/auth/login/`
- **Auth**: None
- **Body**:
```json
{
  "email": "user@company.com",
  "password": "StrongPassword123!"
}
```
- **Response**: `200 OK`
```json
{
  "user": {
    "id": "c1f7b02c-5df6-48cb-a841-3bb7d5d73356",
    "email": "user@company.com",
    "first_name": "Jane",
    "last_name": "Doe",
    "full_name": "Jane Doe",
    "avatar_url": null,
    "is_email_verified": false,
    "has_usable_password": true,
    "created_at": "2026-11-11T12:00:00Z",
    "updated_at": "2026-11-11T12:00:00Z"
  },
  "tokens": {
    "access": "eyJhbGciOi...",
    "refresh": "eyJhbGciOi..."
  }
}
```

### 3. Logout
- **Endpoint**: `POST /api/v1/auth/logout/`
- **Auth**: None (or authenticated)
- **Body**: `{ "refresh": "<refresh_token>" }` (Optional if cookie is present)
- **Response**: `200 OK` (Blacklists refresh token and clears cookie)

### 4. Token Refresh
- **Endpoint**: `POST /api/v1/auth/token/refresh/`
- **Auth**: None
- **Body**: `{ "refresh": "<refresh_token>" }` (Optional if cookie is present)
- **Response**: `200 OK` `{ "access": "<new_jwt>", "refresh": "<new_jwt>" }`

### 5. Email Verification
- **Endpoint**: `POST /api/v1/auth/email/verify/`
- **Auth**: None
- **Body**: `{ "uid": "<base64_user_id>", "token": "<token>" }`
- **Response**: `200 OK`

### 6. Resend Email Verification
- **Endpoint**: `POST /api/v1/auth/email/resend/`
- **Auth**: None
- **Body**: `{ "email": "user@company.com" }`
- **Response**: `200 OK`

### 7. Forgot Password
- **Endpoint**: `POST /api/v1/auth/password/forgot/`
- **Auth**: None
- **Body**: `{ "email": "user@company.com" }`
- **Response**: `200 OK`

### 8. Reset Password
- **Endpoint**: `POST /api/v1/auth/password/reset/`
- **Auth**: None
- **Body**:
```json
{
  "uid": "<base64_user_id>",
  "token": "<token>",
  "new_password": "NewStrongPassword123!",
  "new_password_confirm": "NewStrongPassword123!"
}
```
- **Response**: `200 OK`

### 9. Change Password
- **Endpoint**: `POST /api/v1/auth/password/change/`
- **Auth**: Bearer Token
- **Body**:
```json
{
  "old_password": "OldPassword123!",
  "new_password": "NewStrongPassword123!",
  "new_password_confirm": "NewStrongPassword123!"
}
```
- **Response**: `200 OK`

### 10. Get / Update Current Profile
- **Endpoint**: `GET /api/v1/auth/me/`, `PATCH /api/v1/auth/me/`
- **Auth**: Bearer Token
- **PATCH Body**: `{ "first_name": "Jane", "last_name": "Smith", "avatar_url": "https://..." }`
- **Response**: `200 OK` (User object)

### 11. Deactivate Account
- **Endpoint**: `POST /api/v1/auth/deactivate/`
- **Auth**: Bearer Token
- **Response**: `200 OK`

### 12. OAuth Authorization URLs
- **Endpoints**:
  - `GET /api/v1/auth/oauth/github/?redirect_uri=...&state=...`
  - `GET /api/v1/auth/oauth/google/?redirect_uri=...&state=...`
- **Response**: `200 OK` `{ "url": "https://...", "state": "..." }`

### 13. OAuth Callback Handlers
- **Endpoints**:
  - `POST /api/v1/auth/oauth/github/callback/`
  - `POST /api/v1/auth/oauth/google/callback/`
- **Body**: `{ "code": "<auth_code>", "state": "...", "redirect_uri": "..." }`
- **Response**: `200 OK` `{ "user": {...}, "tokens": {...} }`

### 14. Linked Accounts Management
- **Endpoints**:
  - `GET /api/v1/auth/linked-accounts/` -> Returns list of connected providers & password status.
  - `DELETE /api/v1/auth/linked-accounts/{provider}/` -> Disconnects provider (safeguard prevents unlinking if it is the only remaining auth method).
