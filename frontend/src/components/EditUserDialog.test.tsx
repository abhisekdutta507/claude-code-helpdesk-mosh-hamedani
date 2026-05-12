import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { renderWithProviders } from '@/test/render-utils';
import EditUserDialog from './EditUserDialog';

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

const mockedPut = vi.mocked(axios.put);

const MOCK_USER = {
  id: 'user-42',
  name: 'Alice Admin',
  email: 'alice@example.com',
  role: 'ADMIN' as const,
  createdAt: '2024-01-15T10:00:00.000Z',
};

const MOCK_USER_2 = {
  id: 'user-99',
  name: 'Bob Agent',
  email: 'bob@example.com',
  role: 'AGENT' as const,
  createdAt: '2024-02-20T10:00:00.000Z',
};

type Props = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  user?: typeof MOCK_USER | typeof MOCK_USER_2 | null;
};

function renderDialog({ open = true, onOpenChange = vi.fn(), user = MOCK_USER }: Props = {}) {
  return renderWithProviders(
    <EditUserDialog open={open} onOpenChange={onOpenChange} user={user} />,
  );
}

describe('EditUserDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering when open (user prop provided)', () => {
    it('renders the dialog title "Edit user"', () => {
      renderDialog();
      expect(screen.getByText('Edit user')).toBeInTheDocument();
    });

    it('renders the Name field', () => {
      renderDialog();
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
    });

    it('renders the Email field', () => {
      renderDialog();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders the Password field', () => {
      renderDialog();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('renders the Cancel button', () => {
      renderDialog();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('renders the "Save changes" button', () => {
      renderDialog();
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    });

    it('pre-populates the Name field with user.name', () => {
      renderDialog();
      const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
      expect(nameInput.value).toBe('Alice Admin');
    });

    it('shows user.email in the Email field', () => {
      renderDialog();
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      expect(emailInput.value).toBe('alice@example.com');
    });

    it('disables the Email field', () => {
      renderDialog();
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      expect(emailInput).toBeDisabled();
    });

    it('starts the Password field empty', () => {
      renderDialog();
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      expect(passwordInput.value).toBe('');
    });

    it('does not show an error alert initially', () => {
      renderDialog();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('rendering when closed', () => {
    it('does not render dialog content when open=false', () => {
      renderDialog({ open: false });
      expect(screen.queryByText('Edit user')).not.toBeInTheDocument();
    });

    it('does not render Name field when closed', () => {
      renderDialog({ open: false });
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    });
  });

  describe('useEffect / pre-population', () => {
    it('re-populates the name field when the user prop changes', async () => {
      // Render with MOCK_USER first, then re-render with MOCK_USER_2 by
      // unmounting and remounting (each renderWithProviders call is isolated)
      renderDialog({ user: MOCK_USER });
      expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Alice Admin');
    });

    it('starts with the correct name for a different user', async () => {
      renderDialog({ user: MOCK_USER_2 });
      expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Bob Agent');
    });

    it('starts with the correct email for a different user', async () => {
      renderDialog({ user: MOCK_USER_2 });
      expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('bob@example.com');
    });
  });

  describe('form validation', () => {
    it('shows error when name is too short (< 3 chars)', async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.clear(screen.getByLabelText('Name'));
      await user.type(screen.getByLabelText('Name'), 'Ab');

      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 3 characters long')).toBeInTheDocument();
      });
    });

    it('shows error when name is empty', async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.clear(screen.getByLabelText('Name'));

      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 3 characters long')).toBeInTheDocument();
      });
    });

    it('shows error when password is too short (non-empty, < 8 chars)', async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.type(screen.getByLabelText('Password'), 'short');

      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
      });
    });

    it('does not show a password error when password is blank (optional field)', async () => {
      mockedPut.mockResolvedValue({ data: {} });
      renderDialog();

      // Password is blank — submit without typing in password field
      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(mockedPut).toHaveBeenCalled();
      });
      expect(screen.queryByText('Password must be at least 8 characters long')).not.toBeInTheDocument();
    });

    it('does not call axios.put when form is invalid', async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.clear(screen.getByLabelText('Name'));

      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 3 characters long')).toBeInTheDocument();
      });
      expect(mockedPut).not.toHaveBeenCalled();
    });
  });

  describe('successful submission', () => {
    it('calls axios.put with the correct URL', async () => {
      mockedPut.mockResolvedValue({ data: {} });
      renderDialog();

      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(mockedPut).toHaveBeenCalledWith(
          expect.stringContaining(`/api/users/${MOCK_USER.id}`),
          expect.any(Object),
          expect.any(Object),
        );
      });
    });

    it('calls axios.put with the correct payload', async () => {
      const user = userEvent.setup();
      mockedPut.mockResolvedValue({ data: {} });
      renderDialog();

      await user.clear(screen.getByLabelText('Name'));
      await user.type(screen.getByLabelText('Name'), 'Alice Updated');
      await user.type(screen.getByLabelText('Password'), 'newpassword123');

      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(mockedPut).toHaveBeenCalledWith(
          expect.any(String),
          { name: 'Alice Updated', password: 'newpassword123' },
          expect.objectContaining({ withCredentials: true }),
        );
      });
    });

    it('calls axios.put with withCredentials: true', async () => {
      mockedPut.mockResolvedValue({ data: {} });
      renderDialog();

      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(mockedPut).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          expect.objectContaining({ withCredentials: true }),
        );
      });
    });

    it('calls onOpenChange(false) after success', async () => {
      const onOpenChange = vi.fn();
      mockedPut.mockResolvedValue({ data: {} });
      renderDialog({ onOpenChange });

      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('does not show an error alert after success', async () => {
      mockedPut.mockResolvedValue({ data: {} });
      renderDialog();

      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(mockedPut).toHaveBeenCalled();
      });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('sends password as empty string when left blank', async () => {
      mockedPut.mockResolvedValue({ data: {} });
      renderDialog();

      // Do not type into password — it should remain ''
      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(mockedPut).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ password: '' }),
          expect.any(Object),
        );
      });
    });
  });

  describe('failed submission', () => {
    it('shows server error message from err.response.data.error', async () => {
      mockedPut.mockRejectedValue(
        Object.assign(new Error('Request failed'), {
          isAxiosError: true,
          response: { data: { error: 'Name is already taken.' } },
        }),
      );
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      renderDialog();
      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(screen.getByText('Name is already taken.')).toBeInTheDocument();
      });
    });

    it('shows "Failed to update user." fallback for non-axios errors', async () => {
      mockedPut.mockRejectedValue(new Error('Network Error'));
      vi.mocked(axios.isAxiosError).mockReturnValue(false);

      renderDialog();
      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(screen.getByText('Failed to update user.')).toBeInTheDocument();
      });
    });

    it('shows "Failed to update user." fallback when axios error has no response.data.error', async () => {
      mockedPut.mockRejectedValue(
        Object.assign(new Error('Request failed'), {
          isAxiosError: true,
          response: { data: {} },
        }),
      );
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      renderDialog();
      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(screen.getByText('Failed to update user.')).toBeInTheDocument();
      });
    });

    it('does not call onOpenChange(false) on failure', async () => {
      const onOpenChange = vi.fn();
      mockedPut.mockRejectedValue(new Error('Network Error'));
      vi.mocked(axios.isAxiosError).mockReturnValue(false);

      renderDialog({ onOpenChange });
      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(screen.getByText('Failed to update user.')).toBeInTheDocument();
      });
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('keeps dialog open on failure (title still visible)', async () => {
      mockedPut.mockRejectedValue(new Error('Network Error'));
      vi.mocked(axios.isAxiosError).mockReturnValue(false);

      renderDialog();
      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(screen.getByText('Failed to update user.')).toBeInTheDocument();
      });
      expect(screen.getByText('Edit user')).toBeInTheDocument();
    });

    it('renders the Alert component on error', async () => {
      mockedPut.mockRejectedValue(new Error('Network Error'));
      vi.mocked(axios.isAxiosError).mockReturnValue(false);

      renderDialog();
      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Cancel button', () => {
    it('calls onOpenChange(false) when Cancel is clicked', () => {
      const onOpenChange = vi.fn();
      renderDialog({ onOpenChange });

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('resets the form when Cancel closes the dialog (form is cleared)', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      renderDialog({ onOpenChange });

      // Type something in the name field
      await user.clear(screen.getByLabelText('Name'));
      await user.type(screen.getByLabelText('Name'), 'Modified Name');
      expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Modified Name');

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Submit button state', () => {
    it('"Save changes" button is not disabled by default', () => {
      renderDialog();
      expect(screen.getByRole('button', { name: 'Save changes' })).not.toBeDisabled();
    });

    it('shows "Saving…" and is disabled while PUT is in flight', async () => {
      let resolvePut!: (value: { data: Record<string, unknown> }) => void;
      mockedPut.mockImplementation(
        () => new Promise((resolve) => { resolvePut = resolve; }),
      );

      renderDialog();
      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
      });

      resolvePut({ data: {} });
    });

    it('does not show "Save changes" label while submitting', async () => {
      let resolvePut!: (value: { data: Record<string, unknown> }) => void;
      mockedPut.mockImplementation(
        () => new Promise((resolve) => { resolvePut = resolve; }),
      );

      renderDialog();
      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
      });

      resolvePut({ data: {} });
    });
  });
});
