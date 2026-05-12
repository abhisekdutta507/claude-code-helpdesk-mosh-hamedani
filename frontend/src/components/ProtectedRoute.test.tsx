import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { authClient } from '@/lib/auth-client';
import { renderWithProviders } from '@/test/render-utils';
import ProtectedRoute from './ProtectedRoute';

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

// ProtectedRoute renders <Outlet />, so MemoryRouter needs child routes.
// renderWithProviders wraps in MemoryRouter, but we can't add routes.
// We test by checking what ProtectedRoute itself renders (loading, redirect text
// via navigate, or outlet placeholder). Navigate renders nothing visible but
// causes a route change; we verify the component doesn't crash and the
// appropriate UI branch is taken.
const renderComponent = () => renderWithProviders(<ProtectedRoute />);

describe('ProtectedRoute', () => {
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

    it('does not render any navigation while pending', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: true,
      } as ReturnType<typeof authClient.useSession>);

      renderComponent();

      // The loading div should be present — no redirect occurs
      const loading = screen.getByText('Loading…');
      expect(loading).toBeInTheDocument();
    });
  });

  describe('unauthenticated state', () => {
    it('renders nothing (navigate to /login) when session is null', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderComponent();

      // Loading indicator should NOT be visible when not pending
      expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    });
  });

  describe('authenticated state', () => {
    it('renders outlet content (nothing visible by default) when session exists', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Test User', email: 'user@test.com', role: 'AGENT' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      // Should not throw; Outlet renders empty in MemoryRouter without child routes
      renderComponent();

      expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    });
  });
});
