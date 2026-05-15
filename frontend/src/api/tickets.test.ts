import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import type { TicketsResponse } from './tickets';
import { TicketSortBy, TicketSortDir } from '@repo/shared/schemas/ticket';

vi.mock('axios');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const defaultArgs = {
  sortBy: TicketSortBy.CREATED_AT,
  sortDir: TicketSortDir.DESC,
  page: 1,
  status: '',
  category: '',
  agentId: '',
  dateRange: '',
  search: '',
} as const;

const ticketsResponse: TicketsResponse = {
  tickets: [],
  total: 0,
  page: 1,
  pageSize: 10,
};

// ---------------------------------------------------------------------------
// fetchTickets — params filtering
// ---------------------------------------------------------------------------

describe('fetchTickets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT include dateRange param when dateRange is empty string', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: ticketsResponse });

    const { fetchTickets } = await import('./tickets');

    await fetchTickets(
      defaultArgs.sortBy,
      defaultArgs.sortDir,
      defaultArgs.page,
      defaultArgs.status,
      defaultArgs.category,
      defaultArgs.agentId,
      '',   // empty dateRange
      defaultArgs.search,
    );

    expect(vi.mocked(axios.get)).toHaveBeenCalledOnce();
    const callParams = vi.mocked(axios.get).mock.calls[0][1]?.params as Record<string, unknown>;
    expect(callParams).not.toHaveProperty('dateRange');
  });

  it('DOES include dateRange param when dateRange is non-empty', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: ticketsResponse });

    const { fetchTickets } = await import('./tickets');

    await fetchTickets(
      defaultArgs.sortBy,
      defaultArgs.sortDir,
      defaultArgs.page,
      defaultArgs.status,
      defaultArgs.category,
      defaultArgs.agentId,
      'last7days',
      defaultArgs.search,
    );

    expect(vi.mocked(axios.get)).toHaveBeenCalledOnce();
    const callParams = vi.mocked(axios.get).mock.calls[0][1]?.params as Record<string, unknown>;
    expect(callParams).toHaveProperty('dateRange', 'last7days');
  });

  it('does NOT include status param when status is empty string', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: ticketsResponse });

    const { fetchTickets } = await import('./tickets');

    await fetchTickets(
      defaultArgs.sortBy,
      defaultArgs.sortDir,
      defaultArgs.page,
      '',   // empty status
      defaultArgs.category,
      defaultArgs.agentId,
      defaultArgs.dateRange,
      defaultArgs.search,
    );

    const callParams = vi.mocked(axios.get).mock.calls[0][1]?.params as Record<string, unknown>;
    expect(callParams).not.toHaveProperty('status');
  });

  it('DOES include status param when status is non-empty', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: ticketsResponse });

    const { fetchTickets } = await import('./tickets');

    await fetchTickets(
      defaultArgs.sortBy,
      defaultArgs.sortDir,
      defaultArgs.page,
      'OPEN',
      defaultArgs.category,
      defaultArgs.agentId,
      defaultArgs.dateRange,
      defaultArgs.search,
    );

    const callParams = vi.mocked(axios.get).mock.calls[0][1]?.params as Record<string, unknown>;
    expect(callParams).toHaveProperty('status', 'OPEN');
  });

  it('does NOT include search param when search is empty or whitespace', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: ticketsResponse });

    const { fetchTickets } = await import('./tickets');

    await fetchTickets(
      defaultArgs.sortBy,
      defaultArgs.sortDir,
      defaultArgs.page,
      defaultArgs.status,
      defaultArgs.category,
      defaultArgs.agentId,
      defaultArgs.dateRange,
      '   ',  // whitespace-only search
    );

    const callParams = vi.mocked(axios.get).mock.calls[0][1]?.params as Record<string, unknown>;
    expect(callParams).not.toHaveProperty('search');
  });

  it('always includes sortBy, sortDir, and page params', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: ticketsResponse });

    const { fetchTickets } = await import('./tickets');

    await fetchTickets(
      TicketSortBy.SUBJECT,
      TicketSortDir.ASC,
      3,
      '',
      '',
      '',
      '',
      '',
    );

    const callParams = vi.mocked(axios.get).mock.calls[0][1]?.params as Record<string, unknown>;
    expect(callParams).toMatchObject({
      sortBy: TicketSortBy.SUBJECT,
      sortDir: TicketSortDir.ASC,
      page: 3,
    });
  });

  it('calls the correct endpoint with withCredentials: true', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: ticketsResponse });

    const { fetchTickets } = await import('./tickets');

    await fetchTickets(
      defaultArgs.sortBy,
      defaultArgs.sortDir,
      defaultArgs.page,
      '',
      '',
      '',
      '',
      '',
    );

    const [url, config] = vi.mocked(axios.get).mock.calls[0];
    expect(url).toContain('/api/tickets');
    expect(config).toMatchObject({ withCredentials: true });
  });

  it('returns the response data from axios', async () => {
    const mockData: TicketsResponse = {
      tickets: [],
      total: 42,
      page: 2,
      pageSize: 10,
    };
    vi.mocked(axios.get).mockResolvedValue({ data: mockData });

    const { fetchTickets } = await import('./tickets');

    const result = await fetchTickets(
      defaultArgs.sortBy,
      defaultArgs.sortDir,
      defaultArgs.page,
      '',
      '',
      '',
      '',
      '',
    );

    expect(result).toEqual(mockData);
  });
});

// ---------------------------------------------------------------------------
// VITE_API_URL — URL construction (line 9)
//
// Vite statically inlines import.meta.env.VITE_API_URL at transform time, so
// vi.stubEnv cannot override the compiled value.  The ?? fallback is a
// dead-code path in the Vite test transform when .env.test sets the var.
//
// What we CAN verify: the module uses the configured env value as the URL
// base, and the /api/tickets path is always appended correctly.
// ---------------------------------------------------------------------------

describe('API_URL construction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds the tickets URL from the configured VITE_API_URL base', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: ticketsResponse });

    const { fetchTickets } = await import('./tickets');

    await fetchTickets(
      TicketSortBy.CREATED_AT,
      TicketSortDir.DESC,
      1,
      '',
      '',
      '',
      '',
      '',
    );

    const [url] = vi.mocked(axios.get).mock.calls[0];
    // .env.test sets VITE_API_URL=http://localhost:3001
    expect(url).toBe('http://localhost:3001/api/tickets');
  });

  it('builds the agents URL from the configured VITE_API_URL base', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [] });

    const { fetchAgents } = await import('./tickets');

    await fetchAgents();

    const [url] = vi.mocked(axios.get).mock.calls[0];
    expect(url).toBe('http://localhost:3001/api/agents');
  });

  it('builds the ticket detail URL with the ticket id', async () => {
    const ticketId = 'abc-123';
    vi.mocked(axios.get).mockResolvedValue({ data: {} });

    const { fetchTicket } = await import('./tickets');

    await fetchTicket(ticketId);

    const [url] = vi.mocked(axios.get).mock.calls[0];
    expect(url).toBe(`http://localhost:3001/api/tickets/${ticketId}`);
  });
});
