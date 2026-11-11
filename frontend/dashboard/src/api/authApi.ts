import { apiClient, setAccessToken } from './client';
import { AuthResponse, LinkedAccountsResponse, User } from '../types/auth';

export interface RegisterPayload {
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ResetPasswordPayload {
  uid: string;
  token: string;
  new_password: string;
  new_password_confirm: string;
}

export interface ChangePasswordPayload {
  old_password?: string;
  new_password: string;
  new_password_confirm: string;
}

export const authApi = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const data = await apiClient<AuthResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAccessToken(data.tokens.access);
    return data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const data = await apiClient<AuthResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAccessToken(data.tokens.access);
    return data;
  },

  logout: async (refreshToken?: string): Promise<{ message: string }> => {
    const data = await apiClient<{ message: string }>('/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken || '' }),
    });
    setAccessToken(null);
    return data;
  },

  getProfile: async (): Promise<User> => {
    return apiClient<User>('/auth/me/');
  },

  updateProfile: async (payload: Partial<User>): Promise<User> => {
    return apiClient<User>('/auth/me/', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deactivateAccount: async (): Promise<{ message: string }> => {
    const data = await apiClient<{ message: string }>('/auth/deactivate/', {
      method: 'POST',
    });
    setAccessToken(null);
    return data;
  },

  verifyEmail: async (uid: string, token: string): Promise<{ message: string; user: User }> => {
    return apiClient<{ message: string; user: User }>('/auth/email/verify/', {
      method: 'POST',
      body: JSON.stringify({ uid, token }),
    });
  },

  resendVerificationEmail: async (email: string): Promise<{ message: string }> => {
    return apiClient<{ message: string }>('/auth/email/resend/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return apiClient<{ message: string }>('/auth/password/forgot/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (payload: ResetPasswordPayload): Promise<{ message: string }> => {
    return apiClient<{ message: string }>('/auth/password/reset/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
    return apiClient<{ message: string }>('/auth/password/change/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getLinkedAccounts: async (): Promise<LinkedAccountsResponse> => {
    return apiClient<LinkedAccountsResponse>('/auth/linked-accounts/');
  },

  unlinkAccount: async (provider: string): Promise<{ message: string }> => {
    return apiClient<{ message: string }>(`/auth/linked-accounts/${provider}/`, {
      method: 'DELETE',
    });
  },

  getOAuthUrl: async (provider: 'github' | 'google', redirectUri?: string): Promise<{ url: string; state: string }> => {
    const params = new URLSearchParams();
    if (redirectUri) params.set('redirect_uri', redirectUri);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiClient<{ url: string; state: string }>(`/auth/oauth/${provider}/${qs}`);
  },

  oauthCallback: async (
    provider: 'github' | 'google',
    code: string,
    state?: string,
    redirectUri?: string
  ): Promise<AuthResponse> => {
    const data = await apiClient<AuthResponse>(`/auth/oauth/${provider}/callback/`, {
      method: 'POST',
      body: JSON.stringify({ code, state, redirect_uri: redirectUri }),
    });
    setAccessToken(data.tokens.access);
    return data;
  },
};
