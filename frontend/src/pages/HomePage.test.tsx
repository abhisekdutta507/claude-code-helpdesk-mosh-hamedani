import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { authClient } from '@/lib/auth-client';
import { renderWithProviders } from '@/test/render-utils';
import HomePage from './HomePage';

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

const renderPage = () => renderWithProviders(<HomePage />);

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('welcome message', () => {
    it('renders welcome message with the user name', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Alice', email: 'alice@test.com', role: 'ADMIN' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderPage();

      expect(screen.getByText('Welcome back, Alice')).toBeInTheDocument();
    });

    it('renders welcome message with fallback "User" when session is null', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderPage();

      expect(screen.getByText('Welcome back, User')).toBeInTheDocument();
    });

    it('renders the overview subtitle text', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Alice', email: 'alice@test.com', role: 'AGENT' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderPage();

      expect(
        screen.getByText("Here's an overview of the helpdesk activity."),
      ).toBeInTheDocument();
    });
  });

  describe('stat cards', () => {
    beforeEach(() => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Alice', email: 'alice@test.com', role: 'AGENT' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);
    });

    it('renders the Open Tickets card', () => {
      renderPage();
      expect(screen.getByText('Open Tickets')).toBeInTheDocument();
    });

    it('renders the Resolved card', () => {
      renderPage();
      expect(screen.getByText('Resolved')).toBeInTheDocument();
    });

    it('renders the Avg. Response Time card', () => {
      renderPage();
      expect(screen.getByText('Avg. Response Time')).toBeInTheDocument();
    });

    it('renders placeholder dashes for all three stats', () => {
      renderPage();
      // There should be three "—" placeholders
      const dashes = screen.getAllByText('—');
      expect(dashes).toHaveLength(3);
    });
  });

  describe('NavBar integration', () => {
    it('renders the NavBar with Helpdesk link', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Alice', email: 'alice@test.com', role: 'AGENT' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderPage();

      expect(screen.getByRole('link', { name: 'Helpdesk' })).toBeInTheDocument();
    });

    it('shows the Users nav link for ADMIN role', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Alice', email: 'alice@test.com', role: 'ADMIN' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderPage();

      expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument();
    });

    it('does not show the Users nav link for AGENT role', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Alice', email: 'alice@test.com', role: 'AGENT' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderPage();

      expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
    });
  });
});
