# OAuth Configuration Guide

IdeaRelay supports OAuth 2.0 authentication for **Google** and **GitHub**.

---

## 1. Google OAuth Setup (Google Cloud Console)

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing project (e.g., `IdeaRelay`).
3. Navigate to **APIs & Services** > **OAuth consent screen**:
   - Choose **External** user type.
   - Fill in App Information (App name: `IdeaRelay`, User support email, Developer contact email).
   - Add scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`.
4. Navigate to **APIs & Services** > **Credentials**:
   - Click **Create Credentials** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `IdeaRelay Web Client`.
   - Authorized JavaScript origins:
     - `http://localhost:5173` (Frontend dev server)
     - `http://localhost:3000` (Docker dashboard)
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/callback/google`
     - `http://localhost:8000/api/v1/auth/oauth/google/callback/`
5. Copy the generated **Client ID** and **Client Secret**.
6. Set in `backend/django/.env`:
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

---

## 2. GitHub OAuth Setup (GitHub Developer Settings)

1. Open [GitHub Developer Settings](https://github.com/settings/developers).
2. Under **OAuth Apps**, click **New OAuth App**:
   - Application name: `IdeaRelay`.
   - Homepage URL: `http://localhost:5173` (or production URL).
   - Application description: `IdeaRelay feedback management platform`.
   - Authorization callback URL: `http://localhost:5173/auth/callback/github`
3. Click **Register application**.
4. Generate a new **Client secret**.
5. Copy the **Client ID** and **Client Secret**.
6. Set in `backend/django/.env`:
   ```env
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   ```

---

## 3. Local Development & Automated Testing

### Automated Tests (No Credentials Required)
Automated backend and frontend tests mock external OAuth endpoints using the `responses` library and Mock Service Workers. Real credentials are not needed to run:

```bash
npm run test:all
```

### Manual Testing with Real OAuth
Once environment variables are populated with real OAuth credentials:
1. Start the Django backend: `cd backend/django && python manage.py runserver`
2. Start the Frontend dashboard: `cd frontend/dashboard && npm run dev`
3. Navigate to `http://localhost:5173/login` or `/register` and click **Continue with Google** or **Continue with GitHub**.
