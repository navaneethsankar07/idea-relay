export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url?: string | null;
  is_email_verified: boolean;
  has_usable_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  message?: string;
}

export interface LinkedAccount {
  provider: 'github' | 'google';
  provider_email: string;
  created_at: string;
}

export interface LinkedAccountsResponse {
  linked_providers: LinkedAccount[];
  has_usable_password: boolean;
}
