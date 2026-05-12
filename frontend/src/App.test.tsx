import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import axios from 'axios';
import App from './App';

vi.mock('axios');
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
    signOut: vi.fn(),
    signIn: {
      email: vi.fn(),
    },
  },
}));

// App includes its own BrowserRouter, so we only wrap with QueryClientProvider
function renderApp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('routing', () => {
    describe('/ route (HomePage)', () => {
      it('renders the home page when authenticated and visiting /', async () => {
        vi.mocked(authClient.useSession).mockReturnValue({
          data: {
            session: { id: 'session-1' },
            user: { id: 'user-1', name: 'Alice', email: 'alice@test.com', role: 'AGENT' },
          },
          isPending: false,
        } as ReturnType<typeof authClient.useSession>);

        // jsdom starts at about:blank; window.location can't be changed easily,
        // but BrowserRouter defaults to "/" in jsdom
        renderApp();

        await waitFor(() => {
          expect(screen.getByText('Welcome back, Alice')).toBeInTheDocument();
        });
      });

      it('redirects unauthenticated users from / to login', async () => {
        vi.mocked(authClient.useSession).mockReturnValue({
          data: null,
          isPending: false,
        } as ReturnType<typeof authClient.useSession>);

        renderApp();

        await waitFor(() => {
          // Login page rendered after redirect
          expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
        });
      });

      it('shows loading state while session is pending on / route', async () => {
        vi.mocked(authClient.useSession).mockReturnValue({
          data: null,
          isPending: true,
        } as ReturnType<typeof authClient.useSession>);

        renderApp();

        expect(screen.getByText('Loading…')).toBeInTheDocument();
      });
    });

    describe('/login route', () => {
      it('renders the login page at /login when not authenticated', () => {
        vi.mocked(authClient.useSession).mockReturnValue({
          data: null,
          isPending: false,
        } as ReturnType<typeof authClient.useSession>);

        // App starts at "/" in jsdom, ProtectedRoute redirects to /login
        renderApp();

        expect(screen.getByText('Helpdesk')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
      });
    });

    describe('/users route (AdminRoute)', () => {
      it('renders UsersPage for an authenticated ADMIN', async () => {
        vi.mocked(authClient.useSession).mockReturnValue({
          data: {
            session: { id: 'session-1' },
            user: { id: 'user-1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
          },
          isPending: false,
        } as ReturnType<typeof authClient.useSession>);
        vi.mocked(axios.get).mockResolvedValue({ data: [] });

        // Navigate to /users by manipulating window.location
        window.history.pushState({}, '', '/users');
        renderApp();

        await waitFor(() => {
          expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument();
        });

        // Cleanup: restore location for other tests
        window.history.pushState({}, '', '/');
      });

      it('redirects AGENT users away from /users to /', async () => {
        vi.mocked(authClient.useSession).mockReturnValue({
          data: {
            session: { id: 'session-1' },
            user: { id: 'user-2', name: 'Agent', email: 'agent@test.com', role: 'AGENT' },
          },
          isPending: false,
        } as ReturnType<typeof authClient.useSession>);

        window.history.pushState({}, '', '/users');
        renderApp();

        await waitFor(() => {
          // AdminRoute redirects to "/" which renders HomePage
          expect(screen.getByText('Welcome back, Agent')).toBeInTheDocument();
        });

        window.history.pushState({}, '', '/');
      });

      it('redirects unauthenticated users away from /users to /login', async () => {
        vi.mocked(authClient.useSession).mockReturnValue({
          data: null,
          isPending: false,
        } as ReturnType<typeof authClient.useSession>);

        window.history.pushState({}, '', '/users');
        renderApp();

        await waitFor(() => {
          expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
        });

        window.history.pushState({}, '', '/');
      });

      it('shows loading state while session is pending on /users route', () => {
        vi.mocked(authClient.useSession).mockReturnValue({
          data: null,
          isPending: true,
        } as ReturnType<typeof authClient.useSession>);

        window.history.pushState({}, '', '/users');
        renderApp();

        expect(screen.getByText('Loading…')).toBeInTheDocument();

        window.history.pushState({}, '', '/');
      });
    });

    describe('unknown routes', () => {
      it('redirects unknown paths to /login when unauthenticated', async () => {
        vi.mocked(authClient.useSession).mockReturnValue({
          data: null,
          isPending: false,
        } as ReturnType<typeof authClient.useSession>);

        window.history.pushState({}, '', '/unknown-path');
        renderApp();

        await waitFor(() => {
          expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
        });

        window.history.pushState({}, '', '/');
      });

      it('redirects unknown paths to /login when authenticated', async () => {
        // The catch-all route always navigates to /login regardless of auth state
        vi.mocked(authClient.useSession).mockReturnValue({
          data: {
            session: { id: 'session-1' },
            user: { id: 'user-1', name: 'Alice', email: 'alice@test.com', role: 'AGENT' },
          },
          isPending: false,
        } as ReturnType<typeof authClient.useSession>);

        window.history.pushState({}, '', '/does-not-exist');
        renderApp();

        await waitFor(() => {
          // Redirected to /login; since authenticated, LoginPage redirects to "/"
          // This tests the catch-all Navigate to="/login" fires
          expect(screen.getByText('Welcome back, Alice')).toBeInTheDocument();
        });

        window.history.pushState({}, '', '/');
      });
    });
  });

  describe('route structure', () => {
    it('renders the NavBar on the home page', async () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Alice', email: 'alice@test.com', role: 'AGENT' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderApp();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Helpdesk' })).toBeInTheDocument();
      });
    });

    it('renders the Users nav link for ADMIN on the home page', async () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderApp();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument();
      });
    });

    it('does not render the Users nav link for AGENT on the home page', async () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Alice', email: 'alice@test.com', role: 'AGENT' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderApp();

      await waitFor(() => {
        expect(screen.getByText('Welcome back, Alice')).toBeInTheDocument();
      });

      expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
    });
  });
});
