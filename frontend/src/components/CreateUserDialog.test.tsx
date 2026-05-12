import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { renderWithProviders } from '@/test/render-utils';
import CreateUserDialog from './CreateUserDialog';

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

const mockOnOpenChange = vi.fn();

const renderComponent = (open = true) =>
  renderWithProviders(<CreateUserDialog open={open} onOpenChange={mockOnOpenChange} />);

describe('CreateUserDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering when open', () => {
    it('renders the dialog title', () => {
      renderComponent(true);
      expect(screen.getByText('Create new agent')).toBeInTheDocument();
    });

    it('renders Name, Email, and Password fields', () => {
      renderComponent(true);
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('renders Cancel and Create agent buttons', () => {
      renderComponent(true);
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create agent' })).toBeInTheDocument();
    });

    it('does not show any error message initially', () => {
      renderComponent(true);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('name input has correct placeholder', () => {
      renderComponent(true);
      expect(screen.getByPlaceholderText('Jane Smith')).toBeInTheDocument();
    });

    it('email input has correct placeholder', () => {
      renderComponent(true);
      expect(screen.getByPlaceholderText('jane@example.com')).toBeInTheDocument();
    });

    it('email input has type="email"', () => {
      renderComponent(true);
      expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    });

    it('password input has type="password"', () => {
      renderComponent(true);
      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    });

    it('form fields are empty by default', () => {
      renderComponent(true);
      expect(screen.getByLabelText('Name')).toHaveValue('');
      expect(screen.getByLabelText('Email')).toHaveValue('');
      expect(screen.getByLabelText('Password')).toHaveValue('');
    });
  });

  describe('rendering when closed', () => {
    it('does not render dialog content when closed', () => {
      renderComponent(false);
      expect(screen.queryByText('Create new agent')).not.toBeInTheDocument();
    });

    it('does not render any form fields when closed', () => {
      renderComponent(false);
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    });

    it('does not render Cancel or Create agent buttons when closed', () => {
      renderComponent(false);
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Create agent' })).not.toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('shows a validation error when name is too short', async () => {
      renderComponent(true);

      await userEvent.type(screen.getByLabelText('Name'), 'Ab');
      await userEvent.type(screen.getByLabelText('Email'), 'ab@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'password123');
      fireEvent.submit(screen.getByRole('button', { name: 'Create agent' }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 3 characters long')).toBeInTheDocument();
      });
    });

    it('shows a validation error for invalid email', async () => {
      renderComponent(true);

      await userEvent.type(screen.getByLabelText('Name'), 'Jane Smith');
      await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
      await userEvent.type(screen.getByLabelText('Password'), 'password123');
      fireEvent.submit(screen.getByRole('button', { name: 'Create agent' }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      });
    });

    it('shows a validation error when password is too short', async () => {
      renderComponent(true);

      await userEvent.type(screen.getByLabelText('Name'), 'Jane Smith');
      await userEvent.type(screen.getByLabelText('Email'), 'jane@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'short');
      fireEvent.submit(screen.getByRole('button', { name: 'Create agent' }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
      });
    });

    it('does not call axios.post when the form is invalid', async () => {
      renderComponent(true);

      fireEvent.submit(screen.getByRole('button', { name: 'Create agent' }).closest('form')!);

      await waitFor(() => {
        expect(axios.post).not.toHaveBeenCalled();
      });
    });

    it('shows all three validation errors simultaneously on empty submission', async () => {
      renderComponent(true);

      fireEvent.submit(screen.getByRole('button', { name: 'Create agent' }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 3 characters long')).toBeInTheDocument();
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
        expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
      });

      expect(axios.post).not.toHaveBeenCalled();
    });

    it('marks all fields as aria-invalid when empty form is submitted', async () => {
      renderComponent(true);

      fireEvent.submit(screen.getByRole('button', { name: 'Create agent' }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('does not show name error for a name with exactly 3 characters', async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: { id: 'new-1' } });

      renderComponent(true);

      await userEvent.type(screen.getByLabelText('Name'), 'Abe');
      await userEvent.type(screen.getByLabelText('Email'), 'abe@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'password123');
      fireEvent.submit(screen.getByRole('button', { name: 'Create agent' }).closest('form')!);

      await waitFor(() => {
        expect(screen.queryByText('Name must be at least 3 characters long')).not.toBeInTheDocument();
      });
    });

    it('does not show password error for a password with exactly 8 characters', async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: { id: 'new-1' } });

      renderComponent(true);

      await userEvent.type(screen.getByLabelText('Name'), 'Jane Smith');
      await userEvent.type(screen.getByLabelText('Email'), 'jane@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'pass1234');
      fireEvent.submit(screen.getByRole('button', { name: 'Create agent' }).closest('form')!);

      await waitFor(() => {
        expect(screen.queryByText('Password must be at least 8 characters long')).not.toBeInTheDocument();
      });
    });
  });

  describe('successful submission', () => {
    it('calls axios.post with correct data and credentials', async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: { id: 'new-user-1' } });

      renderComponent(true);

      await userEvent.type(screen.getByLabelText('Name'), 'Jane Smith');
      await userEvent.type(screen.getByLabelText('Email'), 'jane@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'securepassword');
      fireEvent.submit(screen.getByRole('button', { name: 'Create agent' }).closest('form')!);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/users'),
          { name: 'Jane Smith', email: 'jane@test.com', password: 'securepassword' },
          expect.objectContaining({ withCredentials: true }),
        );
      });
    });

    it('calls onOpenChange(false) after successful submission', async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: { id: 'new-user-1' } });

      renderComponent(true);

      await userEvent.type(screen.getByLabelText('Name'), 'Jane Smith');
      await userEvent.type(screen.getByLabelText('Email'), 'jane@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'securepassword');
      fireEvent.submit(screen.getByRole('button', { name: 'Create agent' }).closest('form')!);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('does not show an error message after successful submission', async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: { id: 'new-user-1' } });

      renderComponent(true);

      await userEvent.type(screen.getByLabelText('Name'), 'Jane Smith');
      await userEvent.type(screen.getByLabelText('Email'), 'jane@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'securepassword');
      fireEvent.submit(screen.getByRole('button', { name: 'Create agent' }).closest('form')!);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('trims whitespace from name before submitting', async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: { id: 'new-user-1' } });

      renderComponent(true);

      await userEvent.type(screen.getByLabelText('Name'), '  Jane Smith  ');
      await userEvent.type(screen.getByLabelText('Email'), 'jane@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'securepassword');
      fireEvent.submit(screen.getByRole('button', { name: 'Create agent' }).closest('form')!);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/users'),
          expect.objectContaining({ name: 'Jane Smith' }),
          expect.anything(),
        );
      });
    });
  });

  describe('failed submission', () => {
    it('shows server error message on API failure with error field', async () => {
      vi.mocked(axios.post).mockRejectedValue(
        Object.assign(new Error('Request failed'), {
          isAxiosError: true,
          response: { data: { error: 'Email already in use.' } },
        }),
      );
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      renderComponent(true);

      await userEvent.type(screen.getByLabelText('Name'), 'Jane Smith');
      await userEvent.type(screen.getByLabelText('Email'), 'existing@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'securepassword');
      fireEvent.submit(screen.getByRole('button', { name: 'Create agent' }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Email already in use.')).toBeInTheDocument();
      });
    });

    it('shows fallback error message on non-axios error', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('Network Error'));
      vi.mocked(axios.isAxiosError).mockReturnValue(false);

      renderComponent(true);

      await userEvent.type(screen.getByLabelText('Name'), 'Jane Smith');
      await userEvent.type(screen.getByLabelText('Email'), 'jane@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'securepassword');
      fireEvent.submit(screen.getByRole('button', { name: 'Create agent' }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Failed to create user.')).toBeInTheDocument();
      });
    });

    it('shows fallback error when axios error has no response.data.error', async () => {
      vi.mocked(axios.post).mockRejectedValue(
        Object.assign(new Error('Request failed'), {
          isAxiosError: true,
          response: { data: {} },
        }),
      );
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      renderComponent(true);

      await userEvent.type(screen.getByLabelText('Name'), 'Jane Smith');
      await userEvent.type(screen.getByLabelText('Email'), 'jane@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'securepassword');
      fireEvent.submit(screen.getByRole('button', { name: 'Create agent' }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Failed to create user.')).toBeInTheDocument();
      });
    });

    it('does not call onOpenChange(false) on failure', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('Network Error'));
      vi.mocked(axios.isAxiosError).mockReturnValue(false);

      renderComponent(true);

      await userEvent.type(screen.getByLabelText('Name'), 'Jane Smith');
      await userEvent.type(screen.getByLabelText('Email'), 'jane@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'securepassword');
      fireEvent.submit(screen.getByRole('button', { name: 'Create agent' }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Failed to create user.')).toBeInTheDocument();
      });

      expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
    });

    it('displays an alert component on error', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('Network Error'));
      vi.mocked(axios.isAxiosError).mockReturnValue(false);

      renderComponent(true);

      await userEvent.type(screen.getByLabelText('Name'), 'Jane Smith');
      await userEvent.type(screen.getByLabelText('Email'), 'jane@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'securepassword');
      fireEvent.submit(screen.getByRole('button', { name: 'Create agent' }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('keeps the dialog open on failure', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('Network Error'));
      vi.mocked(axios.isAxiosError).mockReturnValue(false);

      renderComponent(true);

      await userEvent.type(screen.getByLabelText('Name'), 'Jane Smith');
      await userEvent.type(screen.getByLabelText('Email'), 'jane@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'securepassword');
      fireEvent.submit(screen.getByRole('button', { name: 'Create agent' }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Failed to create user.')).toBeInTheDocument();
      });

      expect(screen.getByText('Create new agent')).toBeInTheDocument();
    });
  });

  describe('cancel button', () => {
    it('calls onOpenChange(false) when Cancel is clicked', () => {
      renderComponent(true);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onOpenChange(false) exactly once when Cancel is clicked', () => {
      renderComponent(true);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockOnOpenChange).toHaveBeenCalledTimes(1);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('submit button state', () => {
    it('Create agent button is not disabled by default', () => {
      renderComponent(true);
      expect(screen.getByRole('button', { name: 'Create agent' })).not.toBeDisabled();
    });

    it('shows "Creating…" and disables the button while the POST is in flight', async () => {
      let resolvePost!: (value: unknown) => void;
      vi.mocked(axios.post).mockReturnValue(
        new Promise((resolve) => {
          resolvePost = resolve;
        }),
      );

      renderComponent(true);

      await userEvent.type(screen.getByLabelText('Name'), 'Jane Smith');
      await userEvent.type(screen.getByLabelText('Email'), 'jane@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'securepassword');
      fireEvent.submit(screen.getByRole('button', { name: 'Create agent' }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Creating…' })).toBeDisabled();
      });

      // Resolve the pending POST to clean up
      resolvePost({ data: { id: 'new-1' } });
    });

    it('does not show "Create agent" button while submitting', async () => {
      let resolvePost!: (value: unknown) => void;
      vi.mocked(axios.post).mockReturnValue(
        new Promise((resolve) => {
          resolvePost = resolve;
        }),
      );

      renderComponent(true);

      await userEvent.type(screen.getByLabelText('Name'), 'Jane Smith');
      await userEvent.type(screen.getByLabelText('Email'), 'jane@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'securepassword');
      fireEvent.submit(screen.getByRole('button', { name: 'Create agent' }).closest('form')!);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'Create agent' })).not.toBeInTheDocument();
      });

      resolvePost({ data: { id: 'new-1' } });
    });
  });
});

