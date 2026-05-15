import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { renderWithProviders } from '@/test/render-utils';
import type { Ticket, TicketsResponse, Agent } from '@/api/tickets';
import TicketsPage from './TicketsPage';

vi.mock('axios');
vi.mock('@/components/NavBar', () => ({ default: () => <div data-testid="navbar" /> }));

// TicketsPage does not use authClient directly — no auth mock needed.

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ticket: Ticket = {
  id: '1',
  fromEmail: 'a@b.com',
  subject: 'Test ticket subject',
  status: 'OPEN',
  category: null,
  summary: null,
  createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
  agent: null,
};

const ticketsResponse: TicketsResponse = { tickets: [ticket], total: 1, page: 1, pageSize: 10 };
const emptyTicketsResponse: TicketsResponse = { tickets: [], total: 0, page: 1, pageSize: 10 };

// Helper: set up both axios.get calls (tickets + agents)
function mockGetSuccess(ticketsData: TicketsResponse = ticketsResponse, agents: Agent[] = []) {
  vi.mocked(axios.get).mockImplementation((url: string) => {
    if ((url as string).includes('/api/agents')) {
      return Promise.resolve({ data: agents });
    }
    return Promise.resolve({ data: ticketsData });
  });
}

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------

const renderComponent = () => renderWithProviders(<TicketsPage />);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TicketsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  describe('rendering', () => {
    it('renders the navbar', async () => {
      mockGetSuccess();
      renderComponent();
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });

    it('renders the page heading', async () => {
      mockGetSuccess();
      renderComponent();
      expect(screen.getByRole('heading', { name: 'Tickets' })).toBeInTheDocument();
    });

    it('renders filter controls', async () => {
      mockGetSuccess();
      renderComponent();
      expect(screen.getByPlaceholderText('Search subject or email…')).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Filter by status' })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Filter by category' })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Filter by agent' })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Filter by date range' })).toBeInTheDocument();
    });

    it('does not show clear filters button when no filter is active', async () => {
      mockGetSuccess();
      renderComponent();
      expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();
    });

    it('renders agent options when agents are loaded', async () => {
      const agents = [{ id: 'agent-1', name: 'Alice' }];
      mockGetSuccess(ticketsResponse, agents);
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Alice' })).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('loading state', () => {
    it('renders skeleton rows while data is loading', () => {
      // Never resolve the promise so the component stays in loading state
      vi.mocked(axios.get).mockReturnValue(new Promise(() => {}));
      renderComponent();
      // Skeleton renders PAGE_SIZE (10) rows — each with 6 cells
      const skeletonCells = document.querySelectorAll('[data-slot="skeleton"]');
      // 10 rows × 6 cells = 60 skeletons, plus 1 in the card title = 61 total
      expect(skeletonCells.length).toBeGreaterThanOrEqual(10);
    });

    it('shows a skeleton in the card title while loading', () => {
      vi.mocked(axios.get).mockReturnValue(new Promise(() => {}));
      renderComponent();
      // The card title slot contains a skeleton (not a ticket count text)
      expect(screen.queryByText(/\d+ ticket/)).not.toBeInTheDocument();
    });

    it('does not show the empty-state message while loading', () => {
      vi.mocked(axios.get).mockReturnValue(new Promise(() => {}));
      renderComponent();
      expect(screen.queryByText('No tickets match the current filters.')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  describe('data loaded — ticket rows', () => {
    it('renders the ticket subject as a link', async () => {
      mockGetSuccess();
      renderComponent();
      const link = await screen.findByRole('link', { name: 'Test ticket subject' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/tickets/1');
    });

    it('renders the status badge', async () => {
      mockGetSuccess();
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('OPEN')).toBeInTheDocument();
      });
    });

    it('renders "Unassigned" when ticket has no agent', async () => {
      mockGetSuccess();
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Unassigned')).toBeInTheDocument();
      });
    });

    it('renders the agent name when ticket has an agent', async () => {
      const ticketWithAgent = { ...ticket, agent: { id: 'a1', name: 'Bob' } };
      mockGetSuccess({ ...ticketsResponse, tickets: [ticketWithAgent] });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Bob')).toBeInTheDocument();
      });
    });

    it('renders the from email', async () => {
      mockGetSuccess();
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('a@b.com')).toBeInTheDocument();
      });
    });

    it('renders a category badge when ticket has a category', async () => {
      const ticketWithCategory = { ...ticket, category: 'TECHNICAL_QUESTION' as const };
      mockGetSuccess({ ...ticketsResponse, tickets: [ticketWithCategory] });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Technical')).toBeInTheDocument();
      });
    });

    it('renders a dash when ticket has no category', async () => {
      mockGetSuccess();
      renderComponent();
      await waitFor(() => {
        // The em-dash span for null category
        expect(screen.getByText('—')).toBeInTheDocument();
      });
    });

    it('shows ticket count in card title', async () => {
      mockGetSuccess();
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('1 ticket')).toBeInTheDocument();
      });
    });

    it('uses plural "tickets" for count > 1', async () => {
      const multiTicketResponse = {
        tickets: [ticket, { ...ticket, id: '2', subject: 'Second ticket' }],
        total: 2,
        page: 1,
        pageSize: 10,
      };
      mockGetSuccess(multiTicketResponse);
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('2 tickets')).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('empty state', () => {
    it('shows "No tickets match the current filters." when tickets array is empty', async () => {
      mockGetSuccess(emptyTicketsResponse);
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('No tickets match the current filters.')).toBeInTheDocument();
      });
    });

    it('shows 0 tickets count in card title when empty', async () => {
      mockGetSuccess(emptyTicketsResponse);
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('0 tickets')).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('error state', () => {
    it('shows error message when tickets query fails', async () => {
      vi.mocked(axios.get).mockImplementation((url: string) => {
        if ((url as string).includes('/api/agents')) {
          return Promise.resolve({ data: [] });
        }
        return Promise.reject(new Error('Network Error'));
      });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Failed to load tickets.')).toBeInTheDocument();
      });
    });

    it('hides the tickets card when query fails', async () => {
      vi.mocked(axios.get).mockImplementation((url: string) => {
        if ((url as string).includes('/api/agents')) {
          return Promise.resolve({ data: [] });
        }
        return Promise.reject(new Error('Network Error'));
      });
      renderComponent();
      await waitFor(() => {
        expect(screen.queryByText('No tickets match the current filters.')).not.toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('status filter', () => {
    it('selecting a status value updates the select', async () => {
      mockGetSuccess();
      renderComponent();
      const statusSelect = screen.getByRole('combobox', { name: 'Filter by status' });
      fireEvent.change(statusSelect, { target: { value: 'OPEN' } });
      expect(statusSelect).toHaveValue('OPEN');
    });

    it('selecting a status shows the clear filters button', async () => {
      mockGetSuccess();
      renderComponent();
      const statusSelect = screen.getByRole('combobox', { name: 'Filter by status' });
      fireEvent.change(statusSelect, { target: { value: 'OPEN' } });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
      });
    });

    it('re-fetches with the selected status filter', async () => {
      mockGetSuccess();
      renderComponent();
      // Wait for initial load
      await screen.findByText('1 ticket');
      const statusSelect = screen.getByRole('combobox', { name: 'Filter by status' });
      fireEvent.change(statusSelect, { target: { value: 'RESOLVED' } });
      await waitFor(() => {
        const calls = vi.mocked(axios.get).mock.calls;
        const ticketsCalls = calls.filter(([url]) => (url as string).includes('/api/tickets'));
        const lastCall = ticketsCalls[ticketsCalls.length - 1];
        expect(lastCall[1]?.params).toMatchObject({ status: 'RESOLVED' });
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('category filter', () => {
    it('selecting a category updates the select and shows clear filters button', async () => {
      mockGetSuccess();
      renderComponent();
      const categorySelect = screen.getByRole('combobox', { name: 'Filter by category' });
      fireEvent.change(categorySelect, { target: { value: 'GENERAL_QUESTION' } });
      expect(categorySelect).toHaveValue('GENERAL_QUESTION');
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('agent filter', () => {
    it('selecting "unassigned" updates the select and shows clear filters button', async () => {
      mockGetSuccess();
      renderComponent();
      const agentSelect = screen.getByRole('combobox', { name: 'Filter by agent' });
      fireEvent.change(agentSelect, { target: { value: 'unassigned' } });
      expect(agentSelect).toHaveValue('unassigned');
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('date range filter', () => {
    it('selecting a non-all-time date range shows clear filters button', async () => {
      mockGetSuccess();
      renderComponent();
      const dateSelect = screen.getByRole('combobox', { name: 'Filter by date range' });
      fireEvent.change(dateSelect, { target: { value: 'last7days' } });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('search input', () => {
    it('typing into the search input updates the input value without triggering a new query immediately', async () => {
      mockGetSuccess();
      renderComponent();
      // Wait for initial load
      await screen.findByText('1 ticket');
      const callCountAfterLoad = vi.mocked(axios.get).mock.calls.filter(([url]) =>
        (url as string).includes('/api/tickets'),
      ).length;

      const searchInput = screen.getByPlaceholderText('Search subject or email…');
      await userEvent.type(searchInput, 'hello');
      expect(searchInput).toHaveValue('hello');

      // No new tickets fetch should have been triggered by typing alone
      const callCountAfterType = vi.mocked(axios.get).mock.calls.filter(([url]) =>
        (url as string).includes('/api/tickets'),
      ).length;
      expect(callCountAfterType).toBe(callCountAfterLoad);
    });

    it('pressing Enter commits the search and re-fetches with search param', async () => {
      mockGetSuccess();
      renderComponent();
      await screen.findByText('1 ticket');

      const searchInput = screen.getByPlaceholderText('Search subject or email…');
      await userEvent.type(searchInput, 'hello{Enter}');

      await waitFor(() => {
        const calls = vi.mocked(axios.get).mock.calls;
        const ticketsCalls = calls.filter(([url]) => (url as string).includes('/api/tickets'));
        const lastCall = ticketsCalls[ticketsCalls.length - 1];
        expect(lastCall[1]?.params).toMatchObject({ search: 'hello' });
      });
    });

    it('pressing Enter with a search shows the clear filters button', async () => {
      mockGetSuccess();
      renderComponent();
      await screen.findByText('1 ticket');

      const searchInput = screen.getByPlaceholderText('Search subject or email…');
      await userEvent.type(searchInput, 'test{Enter}');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
      });
    });

    it('blurring the search input commits the search', async () => {
      mockGetSuccess();
      renderComponent();
      await screen.findByText('1 ticket');

      const searchInput = screen.getByPlaceholderText('Search subject or email…');
      await userEvent.type(searchInput, 'blur test');
      fireEvent.blur(searchInput);

      await waitFor(() => {
        const calls = vi.mocked(axios.get).mock.calls;
        const ticketsCalls = calls.filter(([url]) => (url as string).includes('/api/tickets'));
        const lastCall = ticketsCalls[ticketsCalls.length - 1];
        expect(lastCall[1]?.params).toMatchObject({ search: 'blur test' });
      });
    });

    it('trims whitespace when committing search', async () => {
      mockGetSuccess();
      renderComponent();
      await screen.findByText('1 ticket');

      const searchInput = screen.getByPlaceholderText('Search subject or email…');
      await userEvent.type(searchInput, '  spaces  {Enter}');

      await waitFor(() => {
        const calls = vi.mocked(axios.get).mock.calls;
        const ticketsCalls = calls.filter(([url]) => (url as string).includes('/api/tickets'));
        const lastCall = ticketsCalls[ticketsCalls.length - 1];
        expect(lastCall[1]?.params).toMatchObject({ search: 'spaces' });
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('clear filters button', () => {
    it('clicking clear filters resets all filter selects to their default', async () => {
      mockGetSuccess();
      renderComponent();
      await screen.findByText('1 ticket');

      // Set a status filter to make clear button appear
      const statusSelect = screen.getByRole('combobox', { name: 'Filter by status' });
      fireEvent.change(statusSelect, { target: { value: 'OPEN' } });

      const clearBtn = await screen.findByRole('button', { name: /clear filters/i });
      fireEvent.click(clearBtn);

      await waitFor(() => {
        expect(statusSelect).toHaveValue('');
        expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();
      });
    });

    it('clicking clear filters resets the search input', async () => {
      mockGetSuccess();
      renderComponent();
      await screen.findByText('1 ticket');

      const searchInput = screen.getByPlaceholderText('Search subject or email…');
      await userEvent.type(searchInput, 'hello{Enter}');

      const clearBtn = await screen.findByRole('button', { name: /clear filters/i });
      fireEvent.click(clearBtn);

      await waitFor(() => {
        expect(searchInput).toHaveValue('');
        expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('pagination', () => {
    // Create a response with more than PAGE_SIZE (10) tickets to trigger pagination
    const paginatedResponse = {
      tickets: Array.from({ length: 10 }, (_, i) => ({
        ...ticket,
        id: String(i + 1),
        subject: `Ticket ${i + 1}`,
      })),
      total: 25,
      page: 1,
      pageSize: 10,
    };

    it('does not render pagination when there is only one page', async () => {
      mockGetSuccess(ticketsResponse); // total: 1
      renderComponent();
      await screen.findByText('1 ticket');
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('renders pagination when total exceeds page size', async () => {
      mockGetSuccess(paginatedResponse);
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });
    });

    it('previous button is visually disabled on page 1', async () => {
      mockGetSuccess(paginatedResponse);
      renderComponent();
      // Wait for data to load and pagination to appear
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });
      // PaginationPrevious renders as <a data-slot="pagination-link" aria-label="Go to previous page">
      const prevLink = document.querySelector('[data-slot="pagination-link"][aria-label="Go to previous page"]');
      expect(prevLink).toBeInTheDocument();
      expect(prevLink).toHaveClass('pointer-events-none');
      expect(prevLink).toHaveClass('opacity-50');
    });

    it('clicking next navigates to page 2', async () => {
      mockGetSuccess(paginatedResponse);
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      // PaginationNext renders as <a data-slot="pagination-link" aria-label="Go to next page">
      const nextLink = document.querySelector<HTMLElement>('[data-slot="pagination-link"][aria-label="Go to next page"]');
      expect(nextLink).toBeInTheDocument();
      fireEvent.click(nextLink!);

      await waitFor(() => {
        const calls = vi.mocked(axios.get).mock.calls;
        const ticketsCalls = calls.filter(([url]) => (url as string).includes('/api/tickets'));
        const lastCall = ticketsCalls[ticketsCalls.length - 1];
        expect(lastCall[1]?.params).toMatchObject({ page: 2 });
      });
    });

    it('clicking a page number navigates to that page', async () => {
      mockGetSuccess(paginatedResponse);
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      // Page number links: find the pagination-link with text content "2"
      // (total=25, pages=3 — page 2 should be visible)
      const paginationLinks = document.querySelectorAll<HTMLElement>('[data-slot="pagination-link"]');
      const page2Link = Array.from(paginationLinks).find((el) => el.textContent?.trim() === '2');
      expect(page2Link).toBeInTheDocument();
      fireEvent.click(page2Link!);

      await waitFor(() => {
        const calls = vi.mocked(axios.get).mock.calls;
        const ticketsCalls = calls.filter(([url]) => (url as string).includes('/api/tickets'));
        const lastCall = ticketsCalls[ticketsCalls.length - 1];
        expect(lastCall[1]?.params).toMatchObject({ page: 2 });
      });
    });

    it('previous button navigates back from page 2', async () => {
      const page2Response = { ...paginatedResponse, page: 2 };
      vi.mocked(axios.get).mockImplementation((url: string) => {
        if ((url as string).includes('/api/agents')) {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: page2Response });
      });

      const { render } = await import('@testing-library/react');
      const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query');
      const { MemoryRouter } = await import('react-router-dom');

      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      render(
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={['/?page=2']}>
            <TicketsPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      // On page 2, prev should not be disabled
      const prevLink = document.querySelector<HTMLElement>('[data-slot="pagination-link"][aria-label="Go to previous page"]');
      expect(prevLink).toBeInTheDocument();
      expect(prevLink).not.toHaveClass('pointer-events-none');
      fireEvent.click(prevLink!);

      await waitFor(() => {
        const calls = vi.mocked(axios.get).mock.calls;
        const ticketsCalls = calls.filter(([url]) => (url as string).includes('/api/tickets'));
        const lastCall = ticketsCalls[ticketsCalls.length - 1];
        // After going back, page param should be absent (page 1 deletes the param)
        const params = lastCall[1]?.params as Record<string, unknown>;
        expect(params.page === undefined || params.page === 1).toBe(true);
      });
    });

    it('next button is visually disabled on the last page', async () => {
      const lastPageResponse = { ...paginatedResponse, page: 3 };
      vi.mocked(axios.get).mockImplementation((url: string) => {
        if ((url as string).includes('/api/agents')) {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: lastPageResponse });
      });

      const { render } = await import('@testing-library/react');
      const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query');
      const { MemoryRouter } = await import('react-router-dom');

      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      render(
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={['/?page=3']}>
            <TicketsPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      const nextLink = document.querySelector<HTMLElement>('[data-slot="pagination-link"][aria-label="Go to next page"]');
      expect(nextLink).toBeInTheDocument();
      expect(nextLink).toHaveClass('pointer-events-none');
      expect(nextLink).toHaveClass('opacity-50');
    });
  });

  // -------------------------------------------------------------------------
  describe('column header sorting', () => {
    it('clicking Subject header triggers a sort re-fetch', async () => {
      mockGetSuccess();
      renderComponent();
      await screen.findByText('1 ticket');

      const subjectHeader = screen.getByRole('button', { name: /subject/i });
      fireEvent.click(subjectHeader);

      await waitFor(() => {
        const calls = vi.mocked(axios.get).mock.calls;
        const ticketsCalls = calls.filter(([url]) => (url as string).includes('/api/tickets'));
        const lastCall = ticketsCalls[ticketsCalls.length - 1];
        expect(lastCall[1]?.params).toMatchObject({ sortBy: 'subject' });
      });
    });

    it('clicking Status header triggers a sort re-fetch', async () => {
      mockGetSuccess();
      renderComponent();
      await screen.findByText('1 ticket');

      const statusHeader = screen.getByRole('button', { name: /^status$/i });
      fireEvent.click(statusHeader);

      await waitFor(() => {
        const calls = vi.mocked(axios.get).mock.calls;
        const ticketsCalls = calls.filter(([url]) => (url as string).includes('/api/tickets'));
        const lastCall = ticketsCalls[ticketsCalls.length - 1];
        expect(lastCall[1]?.params).toMatchObject({ sortBy: 'status' });
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('RESOLVED and CLOSED status badges', () => {
    it('renders RESOLVED status badge', async () => {
      const resolvedTicket = { ...ticket, status: 'RESOLVED' as const };
      mockGetSuccess({ ...ticketsResponse, tickets: [resolvedTicket] });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('RESOLVED')).toBeInTheDocument();
      });
    });

    it('renders CLOSED status badge', async () => {
      const closedTicket = { ...ticket, status: 'CLOSED' as const };
      mockGetSuccess({ ...ticketsResponse, tickets: [closedTicket] });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('CLOSED')).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('category labels', () => {
    it('renders General label for GENERAL_QUESTION', async () => {
      const t = { ...ticket, category: 'GENERAL_QUESTION' as const };
      mockGetSuccess({ ...ticketsResponse, tickets: [t] });
      renderComponent();
      await waitFor(() => expect(screen.getByText('General')).toBeInTheDocument());
    });

    it('renders Refund label for REFUND_REQUEST', async () => {
      const t = { ...ticket, category: 'REFUND_REQUEST' as const };
      mockGetSuccess({ ...ticketsResponse, tickets: [t] });
      renderComponent();
      await waitFor(() => expect(screen.getByText('Refund')).toBeInTheDocument());
    });
  });
});
