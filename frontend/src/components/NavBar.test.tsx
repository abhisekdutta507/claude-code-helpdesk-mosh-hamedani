import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { authClient } from '@/lib/auth-client';
import { renderWithProviders } from '@/test/render-utils';
import NavBar from './NavBar';

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

const renderComponent = () => renderWithProviders(<NavBar />);

describe('NavBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the Helpdesk brand link', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Test User', email: 'user@test.com', role: 'AGENT' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderComponent();

      expect(screen.getByRole('link', { name: 'Helpdesk' })).toBeInTheDocument();
    });

    it('renders the Sign out button', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Test User', email: 'user@test.com', role: 'AGENT' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderComponent();

      expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    });

    it('displays the logged-in user name', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Jane Smith', email: 'jane@test.com', role: 'AGENT' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderComponent();

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('displays fallback "User" when session has no data', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderComponent();

      expect(screen.getByText('User')).toBeInTheDocument();
    });
  });

  describe('admin-only elements', () => {
    it('renders the Users link for ADMIN role', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Admin User', email: 'admin@test.com', role: 'ADMIN' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderComponent();

      expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument();
    });

    it('does NOT render the Users link for AGENT role', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Test Agent', email: 'agent@test.com', role: 'AGENT' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderComponent();

      expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
    });

    it('does NOT render the Users link when session is null', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderComponent();

      expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
    });
  });

  describe('navigation links', () => {
    it('Helpdesk link points to /', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Admin User', email: 'admin@test.com', role: 'ADMIN' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderComponent();

      const helpdeskLink = screen.getByRole('link', { name: 'Helpdesk' });
      expect(helpdeskLink).toHaveAttribute('href', '/');
    });

    it('Users link points to /users', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Admin User', email: 'admin@test.com', role: 'ADMIN' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderComponent();

      const usersLink = screen.getByRole('link', { name: 'Users' });
      expect(usersLink).toHaveAttribute('href', '/users');
    });
  });

  describe('sign out', () => {
    it('calls authClient.signOut when Sign out button is clicked', async () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Test User', email: 'user@test.com', role: 'AGENT' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);
      vi.mocked(authClient.signOut).mockResolvedValue(undefined as never);

      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

      await waitFor(() => {
        expect(authClient.signOut).toHaveBeenCalledTimes(1);
      });
    });

    it('calls authClient.signOut exactly once per click', async () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Test User', email: 'user@test.com', role: 'AGENT' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);
      vi.mocked(authClient.signOut).mockResolvedValue(undefined as never);

      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

      await waitFor(() => {
        expect(authClient.signOut).toHaveBeenCalledTimes(1);
      });
    });
  });
});
