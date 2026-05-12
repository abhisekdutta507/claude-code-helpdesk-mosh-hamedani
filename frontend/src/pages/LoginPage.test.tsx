import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authClient } from '@/lib/auth-client';
import { renderWithProviders } from '@/test/render-utils';
import LoginPage from './LoginPage';

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
    signIn: {
      email: vi.fn(),
    },
    signOut: vi.fn(),
  },
}));

const renderPage = () => renderWithProviders(<LoginPage />);

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('renders a loading indicator when session is pending', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: true,
      } as ReturnType<typeof authClient.useSession>);

      renderPage();

      expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('does not render the login form when pending', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: true,
      } as ReturnType<typeof authClient.useSession>);

      renderPage();

      expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
    });
  });

  describe('already authenticated state', () => {
    it('does not render the login form when session exists', () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', name: 'Test User', email: 'user@test.com', role: 'AGENT' },
        },
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      renderPage();

      expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
    });
  });

  describe('unauthenticated rendering', () => {
    beforeEach(() => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);
    });

    it('renders the Helpdesk heading', () => {
      renderPage();
      expect(screen.getByText('Helpdesk')).toBeInTheDocument();
    });

    it('renders the sign-in description', () => {
      renderPage();
      expect(screen.getByText('Sign in to your account to continue.')).toBeInTheDocument();
    });

    it('renders the Email input', () => {
      renderPage();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders the Password input', () => {
      renderPage();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('renders the Sign in button', () => {
      renderPage();
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    });

    it('Sign in button is not disabled by default', () => {
      renderPage();
      expect(screen.getByRole('button', { name: 'Sign in' })).not.toBeDisabled();
    });

    it('does not show validation errors initially', () => {
      renderPage();
      expect(screen.queryByText('Enter a valid email address')).not.toBeInTheDocument();
      expect(screen.queryByText('Password is required')).not.toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    beforeEach(() => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);
    });

    it('shows email validation error on invalid email', async () => {
      renderPage();

      await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
      await userEvent.type(screen.getByLabelText('Password'), 'somepassword');
      fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
      });
    });

    it('shows password validation error when password is empty', async () => {
      renderPage();

      await userEvent.type(screen.getByLabelText('Email'), 'user@test.com');
      fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('does not call authClient.signIn.email when form is invalid', async () => {
      renderPage();

      fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form')!);

      await waitFor(() => {
        expect(authClient.signIn.email).not.toHaveBeenCalled();
      });
    });
  });

  describe('successful sign in', () => {
    it('calls authClient.signIn.email with correct credentials', async () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);
      vi.mocked(authClient.signIn.email).mockResolvedValue({ error: null } as never);

      renderPage();

      await userEvent.type(screen.getByLabelText('Email'), 'user@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'mypassword');
      fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form')!);

      await waitFor(() => {
        expect(authClient.signIn.email).toHaveBeenCalledWith({
          email: 'user@test.com',
          password: 'mypassword',
        });
      });
    });

    it('does not show an error message after successful sign in', async () => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);
      vi.mocked(authClient.signIn.email).mockResolvedValue({ error: null } as never);

      renderPage();

      await userEvent.type(screen.getByLabelText('Email'), 'user@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'mypassword');
      fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form')!);

      await waitFor(() => {
        expect(authClient.signIn.email).toHaveBeenCalled();
      });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('failed sign in', () => {
    beforeEach(() => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);
    });

    it('shows auth error message when sign in fails', async () => {
      vi.mocked(authClient.signIn.email).mockResolvedValue({
        error: { message: 'Invalid email or password.' },
      } as never);

      renderPage();

      await userEvent.type(screen.getByLabelText('Email'), 'user@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'wrongpassword');
      fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
      });
    });

    it('shows fallback error message when auth error has no message', async () => {
      vi.mocked(authClient.signIn.email).mockResolvedValue({
        error: {},
      } as never);

      renderPage();

      await userEvent.type(screen.getByLabelText('Email'), 'user@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'wrongpassword');
      fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
      });
    });

    it('does not navigate after a failed sign in', async () => {
      vi.mocked(authClient.signIn.email).mockResolvedValue({
        error: { message: 'Unauthorized' },
      } as never);

      renderPage();

      await userEvent.type(screen.getByLabelText('Email'), 'user@test.com');
      await userEvent.type(screen.getByLabelText('Password'), 'wrongpassword');
      fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Unauthorized')).toBeInTheDocument();
      });

      // The form is still visible (no redirect happened)
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    });
  });

  describe('input attributes', () => {
    beforeEach(() => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);
    });

    it('email input has type="email"', () => {
      renderPage();
      expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    });

    it('password input has type="password"', () => {
      renderPage();
      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    });

    it('email input has autocomplete="email"', () => {
      renderPage();
      expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'email');
    });

    it('password input has autocomplete="current-password"', () => {
      renderPage();
      expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password');
    });
  });
});
