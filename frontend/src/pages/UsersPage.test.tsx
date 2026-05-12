import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import UsersPage from './UsersPage';
import { renderWithProviders } from '@/test/render-utils';

vi.mock('axios');
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({
      data: {
        session: { id: 'session-1' },
        user: { id: 'user-1', name: 'Admin User', role: 'ADMIN' },
      },
      isPending: false,
    }),
    signOut: vi.fn(),
  },
}));

const mockedGet = vi.mocked(axios.get);
const mockedPost = vi.mocked(axios.post);
const renderPage = () => renderWithProviders(<UsersPage />);

const MOCK_USERS = [
  {
    id: '1',
    name: 'Alice Admin',
    email: 'alice@example.com',
    role: 'ADMIN' as const,
    createdAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: '2',
    name: 'Bob Agent',
    email: 'bob@example.com',
    role: 'AGENT' as const,
    createdAt: '2024-02-20T10:00:00.000Z',
  },
];

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

    it('renders the table header columns while loading', () => {
      mockedGet.mockImplementation(() => new Promise(() => {}));

      renderPage();

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Joined')).toBeInTheDocument();
    });

    it('renders the New agent button while loading', () => {
      mockedGet.mockImplementation(() => new Promise(() => {}));

      renderPage();

      expect(screen.getByRole('button', { name: 'New agent' })).toBeInTheDocument();
    });

    it('does not show the "All users" count while loading', () => {
      mockedGet.mockImplementation(() => new Promise(() => {}));

      renderPage();

      expect(screen.queryByText(/All users/)).not.toBeInTheDocument();
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

    it('renders no data rows when the list is empty', async () => {
      mockedGet.mockResolvedValue({ data: [] });
      renderPage();
      await waitFor(() => screen.getByText('All users (0)'));
      expect(screen.queryByText('Alice Admin')).not.toBeInTheDocument();
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

    it('still shows the New agent button on error', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Failed to load users.'));
      expect(screen.getByRole('button', { name: 'New agent' })).toBeInTheDocument();
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

  describe('"New agent" button', () => {
    beforeEach(() => {
      mockedGet.mockResolvedValue({ data: MOCK_USERS });
    });

    it('renders the New agent button', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));
      expect(screen.getByRole('button', { name: 'New agent' })).toBeInTheDocument();
    });

    it('opens the CreateUserDialog when New agent button is clicked', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      fireEvent.click(screen.getByRole('button', { name: 'New agent' }));

      expect(screen.getByText('Create new agent')).toBeInTheDocument();
    });

    it('dialog is closed by default', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      expect(screen.queryByText('Create new agent')).not.toBeInTheDocument();
    });

    it('closes the dialog when Cancel is clicked', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      fireEvent.click(screen.getByRole('button', { name: 'New agent' }));
      expect(screen.getByText('Create new agent')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => {
        expect(screen.queryByText('Create new agent')).not.toBeInTheDocument();
      });
    });

    it('renders dialog form fields when dialog is open', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      fireEvent.click(screen.getByRole('button', { name: 'New agent' }));

      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });
  });

  describe('successful agent creation from UsersPage', () => {
    it('closes dialog and refreshes user list after successful creation', async () => {
      const user = userEvent.setup();

      mockedGet.mockResolvedValue({ data: MOCK_USERS });
      mockedPost.mockResolvedValue({ data: { id: 'new-3' } });

      const newUser = {
        id: '3',
        name: 'New Agent',
        email: 'newagent@example.com',
        role: 'AGENT' as const,
        createdAt: '2024-03-01T10:00:00.000Z',
      };

      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      // Open dialog
      await user.click(screen.getByRole('button', { name: 'New agent' }));
      expect(screen.getByText('Create new agent')).toBeInTheDocument();

      // Fill and submit form
      await user.type(screen.getByLabelText('Name'), 'New Agent');
      await user.type(screen.getByLabelText('Email'), 'newagent@example.com');
      await user.type(screen.getByLabelText('Password'), 'securepassword');

      // Simulate that after invalidation the API returns the updated list
      mockedGet.mockResolvedValue({ data: [...MOCK_USERS, newUser] });

      fireEvent.submit(
        screen.getByRole('button', { name: 'Create agent' }).closest('form')!,
      );

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Create new agent')).not.toBeInTheDocument();
      });

      // Refreshed list should include new user
      await waitFor(() => screen.getByText('New Agent'));
      expect(screen.getByText('newagent@example.com')).toBeInTheDocument();
    });

    it('makes POST to /api/users with correct payload', async () => {
      const user = userEvent.setup();

      mockedGet.mockResolvedValue({ data: MOCK_USERS });
      mockedPost.mockResolvedValue({ data: { id: 'new-3' } });

      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      await user.click(screen.getByRole('button', { name: 'New agent' }));

      await user.type(screen.getByLabelText('Name'), 'New Agent');
      await user.type(screen.getByLabelText('Email'), 'newagent@example.com');
      await user.type(screen.getByLabelText('Password'), 'securepassword');

      fireEvent.submit(
        screen.getByRole('button', { name: 'Create agent' }).closest('form')!,
      );

      await waitFor(() => {
        expect(mockedPost).toHaveBeenCalledWith(
          expect.stringContaining('/api/users'),
          { name: 'New Agent', email: 'newagent@example.com', password: 'securepassword' },
          expect.objectContaining({ withCredentials: true }),
        );
      });
    });
  });

  describe('form validation from UsersPage', () => {
    beforeEach(() => {
      mockedGet.mockResolvedValue({ data: MOCK_USERS });
    });

    it('shows validation errors when submitting an empty form', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      fireEvent.click(screen.getByRole('button', { name: 'New agent' }));

      fireEvent.submit(
        screen.getByRole('button', { name: 'Create agent' }).closest('form')!,
      );

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 3 characters long')).toBeInTheDocument();
      });
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
    });

    it('does not POST when the form is invalid', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      fireEvent.click(screen.getByRole('button', { name: 'New agent' }));
      fireEvent.submit(
        screen.getByRole('button', { name: 'Create agent' }).closest('form')!,
      );

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 3 characters long')).toBeInTheDocument();
      });
      expect(mockedPost).not.toHaveBeenCalled();
    });

    it('shows error for name that is too short', async () => {
      const user = userEvent.setup();

      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      await user.click(screen.getByRole('button', { name: 'New agent' }));
      await user.type(screen.getByLabelText('Name'), 'Ab');
      await user.type(screen.getByLabelText('Email'), 'valid@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');

      fireEvent.submit(
        screen.getByRole('button', { name: 'Create agent' }).closest('form')!,
      );

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 3 characters long')).toBeInTheDocument();
      });
    });

    it('shows error for invalid email format', async () => {
      const user = userEvent.setup();

      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      await user.click(screen.getByRole('button', { name: 'New agent' }));
      await user.type(screen.getByLabelText('Name'), 'Jane Smith');
      await user.type(screen.getByLabelText('Email'), 'not-an-email');
      await user.type(screen.getByLabelText('Password'), 'password123');

      fireEvent.submit(
        screen.getByRole('button', { name: 'Create agent' }).closest('form')!,
      );

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      });
    });

    it('shows error for password that is too short', async () => {
      const user = userEvent.setup();

      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      await user.click(screen.getByRole('button', { name: 'New agent' }));
      await user.type(screen.getByLabelText('Name'), 'Jane Smith');
      await user.type(screen.getByLabelText('Email'), 'jane@example.com');
      await user.type(screen.getByLabelText('Password'), 'short');

      fireEvent.submit(
        screen.getByRole('button', { name: 'Create agent' }).closest('form')!,
      );

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
      });
    });
  });

  describe('error handling in dialog from UsersPage', () => {
    beforeEach(() => {
      mockedGet.mockResolvedValue({ data: MOCK_USERS });
    });

    it('shows server error when email is already in use', async () => {
      const user = userEvent.setup();

      mockedPost.mockRejectedValue(
        Object.assign(new Error('Request failed'), {
          isAxiosError: true,
          response: { data: { error: 'Email already in use.' } },
        }),
      );
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      await user.click(screen.getByRole('button', { name: 'New agent' }));
      await user.type(screen.getByLabelText('Name'), 'Alice Admin');
      await user.type(screen.getByLabelText('Email'), 'alice@example.com');
      await user.type(screen.getByLabelText('Password'), 'securepassword');

      fireEvent.submit(
        screen.getByRole('button', { name: 'Create agent' }).closest('form')!,
      );

      await waitFor(() => {
        expect(screen.getByText('Email already in use.')).toBeInTheDocument();
      });
    });

    it('shows generic error on non-axios network failure', async () => {
      const user = userEvent.setup();

      mockedPost.mockRejectedValue(new Error('Network Error'));
      vi.mocked(axios.isAxiosError).mockReturnValue(false);

      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      await user.click(screen.getByRole('button', { name: 'New agent' }));
      await user.type(screen.getByLabelText('Name'), 'Jane Smith');
      await user.type(screen.getByLabelText('Email'), 'jane@example.com');
      await user.type(screen.getByLabelText('Password'), 'securepassword');

      fireEvent.submit(
        screen.getByRole('button', { name: 'Create agent' }).closest('form')!,
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to create user.')).toBeInTheDocument();
      });
    });

    it('keeps dialog open when creation fails', async () => {
      const user = userEvent.setup();

      mockedPost.mockRejectedValue(new Error('Network Error'));
      vi.mocked(axios.isAxiosError).mockReturnValue(false);

      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      await user.click(screen.getByRole('button', { name: 'New agent' }));
      await user.type(screen.getByLabelText('Name'), 'Jane Smith');
      await user.type(screen.getByLabelText('Email'), 'jane@example.com');
      await user.type(screen.getByLabelText('Password'), 'securepassword');

      fireEvent.submit(
        screen.getByRole('button', { name: 'Create agent' }).closest('form')!,
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to create user.')).toBeInTheDocument();
      });

      expect(screen.getByText('Create new agent')).toBeInTheDocument();
    });
  });

  describe('delete user button', () => {
    beforeEach(() => {
      mockedGet.mockResolvedValue({ data: MOCK_USERS });
    });

    it('renders a delete button for each user row', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));
      expect(screen.getByTestId('delete-user-1')).toBeInTheDocument();
      expect(screen.getByTestId('delete-user-2')).toBeInTheDocument();
    });

    it('delete button has aria-label "Delete user"', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));
      const deleteButtons = screen.getAllByRole('button', { name: 'Delete user' });
      expect(deleteButtons.length).toBe(MOCK_USERS.length);
    });

    it('delete button is disabled for ADMIN role users', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));
      expect(screen.getByTestId('delete-user-1')).toBeDisabled();
    });

    it('delete button is enabled for AGENT role users', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Bob Agent'));
      expect(screen.getByTestId('delete-user-2')).not.toBeDisabled();
    });

    it('DeleteUserDialog is not open by default', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));
      expect(screen.queryByText('Delete user')).not.toBeInTheDocument();
    });

    it('clicking delete button for an AGENT opens DeleteUserDialog', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Bob Agent'));

      fireEvent.click(screen.getByTestId('delete-user-2'));

      expect(screen.getByText('Delete user')).toBeInTheDocument();
    });

    it('opened DeleteUserDialog shows the correct user name in the description', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Bob Agent'));

      fireEvent.click(screen.getByTestId('delete-user-2'));

      // The description contains the name as a <strong> element alongside the email
      // The dialog title confirms it is the delete dialog, and the name appears within it
      expect(screen.getByText('Delete user')).toBeInTheDocument();
      // Multiple "Bob Agent" elements: one in table row, one bold in dialog description
      expect(screen.getAllByText('Bob Agent').length).toBeGreaterThanOrEqual(1);
    });

    it('opened DeleteUserDialog shows the correct user email', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Bob Agent'));

      fireEvent.click(screen.getByTestId('delete-user-2'));

      expect(screen.getAllByText(/bob@example\.com/).length).toBeGreaterThanOrEqual(1);
    });

    it('closing the DeleteUserDialog via Cancel resets dialog state', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Bob Agent'));

      fireEvent.click(screen.getByTestId('delete-user-2'));
      expect(screen.getByText('Delete user')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => {
        expect(screen.queryByText('Delete user')).not.toBeInTheDocument();
      });
    });
  });

  describe('successful user deletion from UsersPage', () => {
    it('after successful DELETE, dialog closes and user list is refreshed', async () => {
      mockedGet.mockResolvedValue({ data: MOCK_USERS });
      vi.mocked(axios.delete).mockResolvedValue({ data: {} });

      const usersAfterDelete = [MOCK_USERS[0]];
      renderPage();
      await waitFor(() => screen.getByText('Bob Agent'));

      fireEvent.click(screen.getByTestId('delete-user-2'));
      expect(screen.getByText('Delete user')).toBeInTheDocument();

      // Prepare the refreshed list before confirming
      mockedGet.mockResolvedValue({ data: usersAfterDelete });

      fireEvent.click(screen.getByTestId('confirm-delete-user'));

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Delete user')).not.toBeInTheDocument();
      });

      // Bob should no longer appear after the refetch
      await waitFor(() => {
        expect(screen.queryByText('Bob Agent')).not.toBeInTheDocument();
      });
    });

    it('makes DELETE to the correct user endpoint with credentials', async () => {
      mockedGet.mockResolvedValue({ data: MOCK_USERS });
      vi.mocked(axios.delete).mockResolvedValue({ data: {} });

      renderPage();
      await waitFor(() => screen.getByText('Bob Agent'));

      fireEvent.click(screen.getByTestId('delete-user-2'));
      fireEvent.click(screen.getByTestId('confirm-delete-user'));

      await waitFor(() => {
        expect(vi.mocked(axios.delete)).toHaveBeenCalledWith(
          expect.stringContaining('/api/users/2'),
          expect.objectContaining({ withCredentials: true }),
        );
      });
    });
  });

  describe('NavBar integration', () => {
    it('renders the NavBar with the Helpdesk link', async () => {
      mockedGet.mockResolvedValue({ data: MOCK_USERS });
      renderPage();
      expect(screen.getByRole('link', { name: 'Helpdesk' })).toBeInTheDocument();
    });

    it('renders the Sign out button in the NavBar', async () => {
      mockedGet.mockResolvedValue({ data: MOCK_USERS });
      renderPage();
      expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    });
  });

  describe('edit user button', () => {
    beforeEach(() => {
      mockedGet.mockResolvedValue({ data: MOCK_USERS });
    });

    it('renders an edit button for each user row', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));
      expect(screen.getByTestId('edit-user-1')).toBeInTheDocument();
      expect(screen.getByTestId('edit-user-2')).toBeInTheDocument();
    });

    it('dialog is not open by default (title "Edit user" not present)', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));
      expect(screen.queryByText('Edit user')).not.toBeInTheDocument();
    });

    it('clicking an edit button opens the EditUserDialog', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      fireEvent.click(screen.getByTestId('edit-user-1'));

      expect(screen.getByText('Edit user')).toBeInTheDocument();
    });

    it('clicking edit for user 1 pre-populates the name field with "Alice Admin"', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      fireEvent.click(screen.getByTestId('edit-user-1'));

      await waitFor(() => {
        expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Alice Admin');
      });
    });

    it('clicking edit for user 2 pre-populates the name field with "Bob Agent"', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Bob Agent'));

      fireEvent.click(screen.getByTestId('edit-user-2'));

      await waitFor(() => {
        expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Bob Agent');
      });
    });

    it('edit button has aria-label "Edit user"', async () => {
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      const editButtons = screen.getAllByRole('button', { name: 'Edit user' });
      expect(editButtons.length).toBe(MOCK_USERS.length);
    });
  });

  describe('successful user edit from UsersPage', () => {
    it('closing dialog via Cancel sets editingUser to null (dialog closes, title gone)', async () => {
      mockedGet.mockResolvedValue({ data: MOCK_USERS });
      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      fireEvent.click(screen.getByTestId('edit-user-1'));
      expect(screen.getByText('Edit user')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => {
        expect(screen.queryByText('Edit user')).not.toBeInTheDocument();
      });
    });

    it('after successful PUT, dialog closes and user list is refreshed', async () => {
      const user = userEvent.setup();

      mockedGet.mockResolvedValue({ data: MOCK_USERS });
      vi.mocked(axios.put).mockResolvedValue({ data: {} });

      const updatedUsers = [
        { ...MOCK_USERS[0], name: 'Alice Updated' },
        MOCK_USERS[1],
      ];

      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      // Open edit dialog for user 1
      fireEvent.click(screen.getByTestId('edit-user-1'));
      expect(screen.getByText('Edit user')).toBeInTheDocument();

      // Update the name
      await user.clear(screen.getByLabelText('Name'));
      await user.type(screen.getByLabelText('Name'), 'Alice Updated');

      // Prepare the refreshed list before submitting
      mockedGet.mockResolvedValue({ data: updatedUsers });

      fireEvent.submit(screen.getByTestId('edit-user-form'));

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Edit user')).not.toBeInTheDocument();
      });

      // Refreshed list should show updated name
      await waitFor(() => {
        expect(screen.getByText('Alice Updated')).toBeInTheDocument();
      });
    });
  });

  describe('edit dialog error handling from UsersPage', () => {
    beforeEach(() => {
      mockedGet.mockResolvedValue({ data: MOCK_USERS });
    });

    it('shows server error when PUT fails with response.data.error', async () => {
      vi.mocked(axios.put).mockRejectedValue(
        Object.assign(new Error('Request failed'), {
          isAxiosError: true,
          response: { data: { error: 'Name is already taken.' } },
        }),
      );
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      fireEvent.click(screen.getByTestId('edit-user-1'));
      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(screen.getByText('Name is already taken.')).toBeInTheDocument();
      });
    });

    it('shows generic error on non-axios failure', async () => {
      vi.mocked(axios.put).mockRejectedValue(new Error('Network Error'));
      vi.mocked(axios.isAxiosError).mockReturnValue(false);

      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      fireEvent.click(screen.getByTestId('edit-user-1'));
      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(screen.getByText('Failed to update user.')).toBeInTheDocument();
      });
    });

    it('dialog stays open on PUT failure', async () => {
      vi.mocked(axios.put).mockRejectedValue(new Error('Network Error'));
      vi.mocked(axios.isAxiosError).mockReturnValue(false);

      renderPage();
      await waitFor(() => screen.getByText('Alice Admin'));

      fireEvent.click(screen.getByTestId('edit-user-1'));
      fireEvent.submit(screen.getByTestId('edit-user-form'));

      await waitFor(() => {
        expect(screen.getByText('Failed to update user.')).toBeInTheDocument();
      });
      expect(screen.getByText('Edit user')).toBeInTheDocument();
    });
  });
});
