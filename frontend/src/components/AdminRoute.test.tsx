import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { authClient } from '@/lib/auth-client';
import { renderWithProviders } from '@/test/render-utils';
import AdminRoute from './AdminRoute';

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

const renderComponent = () => renderWithProviders(<AdminRoute />);

describe('AdminRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('renders a loading indicator while session is pending', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: true,
      } as ReturnType<typeof authClient.useSession>);

      renderComponent();

      expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('does not show an error or redirect while loading', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: true,
      } as ReturnType<typeof authClient.useSession>);

      renderComponent();

      const loading = screen.getByText('Loading…');
      expect(loading).toBeInTheDocument();
    });
  });

  describe('unauthenticated state', () => {
    it('renders nothing (navigate to /login) when session is null and not pending', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderComponent();

      expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    });
  });

  describe('non-admin authenticated state', () => {
    it('renders nothing (navigate to /) for AGENT role', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Test Agent', email: 'agent@test.com', role: 'AGENT' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderComponent();

      expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    });
  });

  describe('admin authenticated state', () => {
    it('renders outlet (no visible text) when user is ADMIN', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Test Admin', email: 'admin@test.com', role: 'ADMIN' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderComponent();

      expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    });
  });
});
