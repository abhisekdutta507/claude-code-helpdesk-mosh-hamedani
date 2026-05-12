import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { renderWithProviders } from '@/test/render-utils';
import DeleteUserDialog from './DeleteUserDialog';

vi.mock('axios');
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn().mockReturnValue({
      data: {
        session: { id: 'session-1' },
        user: { id: 'user-1', name: 'Admin User', email: 'admin@test.com', role: 'ADMIN' },
      },
      isPending: false,
    }),
    signOut: vi.fn(),
  },
}));

const mockedDelete = vi.mocked(axios.delete);

const MOCK_USER = {
  id: 'user-42',
  name: 'Bob Agent',
  email: 'bob@example.com',
};

type RenderProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  user?: typeof MOCK_USER | null;
};

function renderDialog({
  open = true,
  onOpenChange = vi.fn(),
  user = MOCK_USER,
}: RenderProps = {}) {
  return renderWithProviders(
    <DeleteUserDialog open={open} onOpenChange={onOpenChange} user={user} />,
  );
}

describe('DeleteUserDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering when open', () => {
    it('renders the dialog title "Delete user"', () => {
      renderDialog();
      expect(screen.getByText('Delete user')).toBeInTheDocument();
    });

    it('renders the user name in the description', () => {
      renderDialog();
      expect(screen.getByText('Bob Agent')).toBeInTheDocument();
    });

    it('renders the user email in the description', () => {
      renderDialog();
      expect(screen.getByText(/bob@example\.com/)).toBeInTheDocument();
    });

    it('renders the Cancel button', () => {
      renderDialog();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('renders the Delete button', () => {
      renderDialog();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('renders the Delete button with data-testid="confirm-delete-user"', () => {
      renderDialog();
      expect(screen.getByTestId('confirm-delete-user')).toBeInTheDocument();
    });

    it('does not disable Cancel button by default', () => {
      renderDialog();
      expect(screen.getByRole('button', { name: 'Cancel' })).not.toBeDisabled();
    });

    it('does not disable Delete button by default', () => {
      renderDialog();
      expect(screen.getByTestId('confirm-delete-user')).not.toBeDisabled();
    });

    it('renders the confirmation message mentioning irreversibility', () => {
      renderDialog();
      expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    });
  });

  describe('rendering when closed', () => {
    it('does not render dialog content when open=false', () => {
      renderDialog({ open: false });
      expect(screen.queryByText('Delete user')).not.toBeInTheDocument();
    });

    it('does not render Cancel or Delete buttons when closed', () => {
      renderDialog({ open: false });
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    });
  });

  describe('rendering with null user', () => {
    it('renders the dialog without crashing when user is null', () => {
      renderDialog({ user: null });
      expect(screen.getByText('Delete user')).toBeInTheDocument();
    });

    it('does not render a user name when user is null', () => {
      renderDialog({ user: null });
      expect(screen.queryByText('Bob Agent')).not.toBeInTheDocument();
    });
  });

  describe('Cancel button', () => {
    it('calls onOpenChange(false) when Cancel is clicked', () => {
      const onOpenChange = vi.fn();
      renderDialog({ onOpenChange });

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onOpenChange(false) exactly once when Cancel is clicked', () => {
      const onOpenChange = vi.fn();
      renderDialog({ onOpenChange });

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('does not call axios.delete when Cancel is clicked', () => {
      renderDialog();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockedDelete).not.toHaveBeenCalled();
    });
  });

  describe('Delete button — successful deletion', () => {
    it('calls axios.delete with the correct URL', async () => {
      mockedDelete.mockResolvedValue({ data: {} });
      renderDialog();

      fireEvent.click(screen.getByTestId('confirm-delete-user'));

      await waitFor(() => {
        expect(mockedDelete).toHaveBeenCalledWith(
          expect.stringContaining(`/api/users/${MOCK_USER.id}`),
          expect.any(Object),
        );
      });
    });

    it('calls axios.delete with withCredentials: true', async () => {
      mockedDelete.mockResolvedValue({ data: {} });
      renderDialog();

      fireEvent.click(screen.getByTestId('confirm-delete-user'));

      await waitFor(() => {
        expect(mockedDelete).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ withCredentials: true }),
        );
      });
    });

    it('calls onOpenChange(false) after successful deletion', async () => {
      const onOpenChange = vi.fn();
      mockedDelete.mockResolvedValue({ data: {} });
      renderDialog({ onOpenChange });

      fireEvent.click(screen.getByTestId('confirm-delete-user'));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('does not call onOpenChange before the DELETE resolves', async () => {
      const onOpenChange = vi.fn();
      let resolveDelete!: (value: { data: Record<string, unknown> }) => void;
      mockedDelete.mockImplementation(
        () => new Promise((resolve) => { resolveDelete = resolve; }),
      );
      renderDialog({ onOpenChange });

      fireEvent.click(screen.getByTestId('confirm-delete-user'));

      // Give any microtasks a chance to flush
      await new Promise((r) => setTimeout(r, 0));
      expect(onOpenChange).not.toHaveBeenCalled();

      resolveDelete({ data: {} });
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('pending state while DELETE is in flight', () => {
    it('shows "Deleting…" on the confirm button while pending', async () => {
      let resolveDelete!: (value: { data: Record<string, unknown> }) => void;
      mockedDelete.mockImplementation(
        () => new Promise((resolve) => { resolveDelete = resolve; }),
      );
      renderDialog();

      fireEvent.click(screen.getByTestId('confirm-delete-user'));

      await waitFor(() => {
        expect(screen.getByTestId('confirm-delete-user')).toHaveTextContent('Deleting…');
      });

      resolveDelete({ data: {} });
    });

    it('does not show "Delete" label while pending', async () => {
      let resolveDelete!: (value: { data: Record<string, unknown> }) => void;
      mockedDelete.mockImplementation(
        () => new Promise((resolve) => { resolveDelete = resolve; }),
      );
      renderDialog();

      fireEvent.click(screen.getByTestId('confirm-delete-user'));

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
      });

      resolveDelete({ data: {} });
    });

    it('disables the confirm button while pending', async () => {
      let resolveDelete!: (value: { data: Record<string, unknown> }) => void;
      mockedDelete.mockImplementation(
        () => new Promise((resolve) => { resolveDelete = resolve; }),
      );
      renderDialog();

      fireEvent.click(screen.getByTestId('confirm-delete-user'));

      await waitFor(() => {
        expect(screen.getByTestId('confirm-delete-user')).toBeDisabled();
      });

      resolveDelete({ data: {} });
    });

    it('disables the Cancel button while pending', async () => {
      let resolveDelete!: (value: { data: Record<string, unknown> }) => void;
      mockedDelete.mockImplementation(
        () => new Promise((resolve) => { resolveDelete = resolve; }),
      );
      renderDialog();

      fireEvent.click(screen.getByTestId('confirm-delete-user'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
      });

      // Also verify Cancel is disabled
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
      });

      resolveDelete({ data: {} });
    });
  });

  describe('API call', () => {
    it('makes exactly one DELETE request on confirm click', async () => {
      mockedDelete.mockResolvedValue({ data: {} });
      renderDialog();

      fireEvent.click(screen.getByTestId('confirm-delete-user'));

      await waitFor(() => {
        expect(mockedDelete).toHaveBeenCalledTimes(1);
      });
    });

    it('passes the correct user id in the URL', async () => {
      const userWithDifferentId = { id: 'user-99', name: 'Charlie', email: 'charlie@example.com' };
      mockedDelete.mockResolvedValue({ data: {} });
      renderDialog({ user: userWithDifferentId });

      fireEvent.click(screen.getByTestId('confirm-delete-user'));

      await waitFor(() => {
        expect(mockedDelete).toHaveBeenCalledWith(
          expect.stringContaining('/api/users/user-99'),
          expect.any(Object),
        );
      });
    });
  });
});
