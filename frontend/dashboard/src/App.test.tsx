import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { store } from './store';
import { queryClient } from './lib/queryClient';
import App from './App';

describe('App Component', () => {
  it('renders IdeaRelay dashboard header and foundations title', () => {
    render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </Provider>
    );

    expect(screen.getByText('IdeaRelay')).toBeInTheDocument();
    expect(screen.getByText('Platform Foundations Initialized')).toBeInTheDocument();
  });
});
