import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import UsersPage from './UsersPage';
import { renderWithProviders } from '@/test/render-utils';

vi.mock('axios');
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: { user: { name: 'Admin User', role: 'ADMIN' } } }),
    signOut: vi.fn(),
  },
}));

const mockedGet = vi.mocked(axios.get);
const renderPage = () => renderWithProviders(<UsersPage />);

const MOCK_USERS = [
  { id: '1', name: 'Alice Admin', email: 'alice@example.com', role: 'ADMIN' as const, createdAt: '2024-01-15T10:00:00.000Z' },
  { id: '2', name: 'Bob Agent', email: 'bob@example.com', role: 'AGENT' as const, createdAt: '2024-02-20T10:00:00.000Z' },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('UsersPage', () => {
  describe('loading state', () => {
    it('renders skeleton rows while fetching', () => {
      mockedGet.mockImplementation(() => new Promise(() => {}));

      renderPage();

      expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument();
      expect(screen.queryByText('Alice Admin')).not.toBeInTheDocument();
    });

    it('does not show an error message while loading', () => {
      mockedGet.mockImplementation(() => new Promise(() => {}));

      renderPage();

      expect(screen.queryByText('Failed to load users.')).not.toBeInTheDocument();
    });
  });

  describe('success state', () => {
    beforeEach(() => {
      mockedGet.mockResolvedValue({ data: MOCK_USERS });
    });

    it('renders the page heading', async () => {
      renderPage();
      expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument();
    });

    it('shows the correct user count in the card title', async () => {
      renderPage();
      await waitFor(() => screen.getByText('All users (2)'));
    });

    it('renders a row for each user', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));
      expect(screen.getByText('Bob Agent')).toBeInTheDocument();
    });

    it('renders user emails', async () => {
      renderPage();
      await waitFor(() => screen.getByText('alice@example.com'));
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    });

    it('renders role badges for each user', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));
      expect(screen.getByText('ADMIN')).toBeInTheDocument();
      expect(screen.getByText('AGENT')).toBeInTheDocument();
    });

    it('renders the joined date for each user', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));
      const aliceDate = new Date('2024-01-15T10:00:00.000Z').toLocaleDateString();
      const bobDate = new Date('2024-02-20T10:00:00.000Z').toLocaleDateString();
      expect(screen.getByText(aliceDate)).toBeInTheDocument();
      expect(screen.getByText(bobDate)).toBeInTheDocument();
    });

    it('renders table column headers', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Joined')).toBeInTheDocument();
    });

    it('shows user count 0 when the list is empty', async () => {
      mockedGet.mockResolvedValue({ data: [] });
      renderPage();
      await waitFor(() => screen.getByText('All users (0)'));
    });

    it('does not show an error message on success', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));
      expect(screen.queryByText('Failed to load users.')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    beforeEach(() => {
      mockedGet.mockRejectedValue(new Error('Network error'));
    });

    it('shows the error message', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Failed to load users.'));
    });

    it('hides the users card on error', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Failed to load users.'));
      expect(screen.queryByText(/All users/)).not.toBeInTheDocument();
    });

    it('does not show user data on error', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Failed to load users.'));
      expect(screen.queryByText('Alice Admin')).not.toBeInTheDocument();
    });
  });

  describe('role badge styling', () => {
    it('applies primary styling to ADMIN badge', async () => {
      mockedGet.mockResolvedValue({ data: MOCK_USERS });
      renderPage();
      await waitFor(() => screen.getByText('ADMIN'));
      const badge = screen.getByText('ADMIN');
      expect(badge.className).toContain('bg-primary/10');
      expect(badge.className).toContain('text-primary');
    });

    it('applies muted styling to AGENT badge', async () => {
      mockedGet.mockResolvedValue({ data: MOCK_USERS });
      renderPage();
      await waitFor(() => screen.getByText('AGENT'));
      const badge = screen.getByText('AGENT');
      expect(badge.className).toContain('bg-muted');
      expect(badge.className).toContain('text-muted-foreground');
    });
  });

  describe('API call', () => {
    it('fetches from the correct endpoint with credentials', async () => {
      mockedGet.mockResolvedValue({ data: MOCK_USERS });
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));
      expect(mockedGet).toHaveBeenCalledWith(
        expect.stringContaining('/api/users'),
        expect.objectContaining({ withCredentials: true }),
      );
    });
  });
});
