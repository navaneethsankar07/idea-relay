import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setAuth, clearAuth } from '../store/slices/authSlice';
import appReducer from '../store/slices/appSlice';
import { setAccessToken } from '../api/client';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { loginSchema, registerSchema } from '../validation/authSchemas';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { User } from '../types/auth';

const createTestStore = (initialAuthState = {}) => {
  return configureStore({
    reducer: {
      app: appReducer,
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        ...initialAuthState,
      },
    },
  });
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const mockUser: User = {
  id: 'usr-123',
  email: 'test@idearelay.io',
  first_name: 'Test',
  last_name: 'User',
  full_name: 'Test User',
  avatar_url: null,
  is_email_verified: true,
  has_usable_password: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('Frontend Authentication Suite', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    setAccessToken(null);
    queryClient = createTestQueryClient();
  });

  describe('Login Validation', () => {
    it('renders email and password inputs with OAuth options', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <MemoryRouter>
              <LoginPage />
            </MemoryRouter>
          </QueryClientProvider>
        </Provider>
      );

      expect(screen.getByRole('textbox', { name: /Email Address/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
      expect(screen.getByText(/Continue with Google/i)).toBeInTheDocument();
      expect(screen.getByText(/Continue with GitHub/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    it('shows validation errors when submitting empty form', async () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <MemoryRouter>
              <LoginPage />
            </MemoryRouter>
          </QueryClientProvider>
        </Provider>
      );

      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
        expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
      });
    });

    it('validates login schema for empty and invalid inputs', () => {
      const empty = loginSchema.safeParse({ email: '', password: '' });
      expect(empty.success).toBe(false);

      const invalidEmail = loginSchema.safeParse({ email: 'not-an-email', password: 'password123' });
      expect(invalidEmail.success).toBe(false);

      const valid = loginSchema.safeParse({ email: 'valid@example.com', password: 'secretpassword' });
      expect(valid.success).toBe(true);
    });
  });

  describe('Registration Validation', () => {
    it('renders all required registration inputs', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <MemoryRouter>
              <RegisterPage />
            </MemoryRouter>
          </QueryClientProvider>
        </Provider>
      );

      expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /Email Address/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
    });

    it('validates schema requirements for password complexity and confirmation', () => {
      // Missing uppercase
      const noUpper = registerSchema.safeParse({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        password: 'lowercase123!',
        password_confirm: 'lowercase123!',
      });
      expect(noUpper.success).toBe(false);
      if (!noUpper.success) {
        expect(noUpper.error.issues[0].message).toContain('uppercase letter');
      }

      // Missing number
      const noNumber = registerSchema.safeParse({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        password: 'PasswordNoNumber!',
        password_confirm: 'PasswordNoNumber!',
      });
      expect(noNumber.success).toBe(false);
      if (!noNumber.success) {
        expect(noNumber.error.issues[0].message).toContain('number');
      }

      // Valid registration payload
      const valid = registerSchema.safeParse({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        password: 'ValidPassword123!',
        password_confirm: 'ValidPassword123!',
      });
      expect(valid.success).toBe(true);
    });
  });

  describe('Redux Auth Slice', () => {
    it('sets authentication state correctly on setAuth', () => {
      const store = createTestStore();
      store.dispatch(setAuth({ user: mockUser, accessToken: 'mock-jwt-token' }));

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('test@idearelay.io');
    });

    it('clears authentication state on clearAuth', () => {
      const store = createTestStore({ user: mockUser, isAuthenticated: true });
      store.dispatch(clearAuth());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('Protected Route', () => {
    it('renders protected child component when authenticated', () => {
      const store = createTestStore({ user: mockUser, isAuthenticated: true });
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <div>Protected Dashboard Content</div>
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<div>Login Page</div>} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      expect(screen.getByText('Protected Dashboard Content')).toBeInTheDocument();
    });

    it('redirects unauthenticated user away from protected child', () => {
      const store = createTestStore({ user: null, isAuthenticated: false });
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <div>Secret User Data</div>
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<div>Login Page</div>} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Secret User Data')).not.toBeInTheDocument();
    });
  });
});
