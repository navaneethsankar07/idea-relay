import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './store/slices/authSlice';
import appReducer from './store/slices/appSlice';
import { queryClient } from './lib/queryClient';
import App from './App';

const testStore = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
  },
  preloadedState: {
    auth: {
      user: {
        id: 'usr-root',
        email: 'root@idearelay.io',
        first_name: 'Admin',
        last_name: 'User',
        full_name: 'Admin User',
        avatar_url: null,
        is_email_verified: true,
        has_usable_password: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
    },
  },
});

describe('App Component', () => {
  it('renders IdeaRelay dashboard when authenticated', () => {
    render(
      <Provider store={testStore}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/']}>
            <App />
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>
    );

    expect(screen.getByText('IdeaRelay')).toBeInTheDocument();
    expect(screen.getByText(/Welcome back, Admin!/i)).toBeInTheDocument();
  });
});
