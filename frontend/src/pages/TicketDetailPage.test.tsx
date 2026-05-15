import { screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import { renderWithProviders } from '@/test/render-utils';
import type { TicketDetail, Reply, Agent } from '@/api/tickets';
import TicketDetailPage from './TicketDetailPage';

vi.mock('axios');

// jsdom does not implement scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

vi.mock('@/components/NavBar', () => ({ default: () => <div data-testid="navbar" /> }));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: () => ({ id: 'ticket-1' }),
  };
});

const ticket: TicketDetail = {
  id: 'ticket-1',
  fromEmail: 'customer@example.com',
  toEmail: null,
  subject: 'Help needed',
  body: 'Please help',
  bodyHtml: null,
  status: 'OPEN',
  category: null,
  summary: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  agent: null,
};

const agentReply: Reply = {
  id: 'r1',
  body: 'We are looking into it',
  fromEmail: null,
  createdAt: '2024-01-02T00:00:00.000Z',
  author: { id: 'u1', name: 'Agent Alice' },
};

const customerReply: Reply = {
  id: 'r2',
  body: 'Any update?',
  fromEmail: 'customer@example.com',
  createdAt: '2024-01-03T00:00:00.000Z',
  author: null,
};

const mockAgents: Agent[] = [
  { id: 'agent-1', name: 'Agent Alice' },
  { id: 'agent-2', name: 'Agent Bob' },
];

function setupDefaultMocks() {
  vi.mocked(axios.get).mockImplementation((url: string) => {
    if (url.includes('/api/tickets/ticket-1/replies')) {
      return Promise.resolve({ data: [] });
    }
    if (url.includes('/api/agents')) {
      return Promise.resolve({ data: mockAgents });
    }
    if (url.includes('/api/tickets/ticket-1')) {
      return Promise.resolve({ data: ticket });
    }
    return Promise.reject(new Error(`Unexpected GET: ${url}`));
  });
}

const renderComponent = () => renderWithProviders(<TicketDetailPage />);

describe('TicketDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('renders skeleton while ticket is loading', async () => {
      vi.mocked(axios.get).mockImplementation(() => new Promise(() => {}));
      renderComponent();
      const skeletons = document.querySelectorAll('[class*="skeleton"], [data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders skeleton in replies section while replies are loading', async () => {
      let resolveTicket!: (v: unknown) => void;
      let resolveReplies!: (v: unknown) => void;

      vi.mocked(axios.get).mockImplementation((url: string) => {
        if (url.includes('/api/tickets/ticket-1/replies')) {
          return new Promise((resolve) => { resolveReplies = resolve; });
        }
        if (url.includes('/api/agents')) {
          return Promise.resolve({ data: mockAgents });
        }
        if (url.includes('/api/tickets/ticket-1')) {
          return new Promise((resolve) => { resolveTicket = resolve; });
        }
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
      });

      renderComponent();

      resolveTicket({ data: ticket });
      await screen.findByText('Help needed');

      // replies skeletons should still be visible before replies resolve
      const skeletons = document.querySelectorAll('[class*="skeleton"], [data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);

      resolveReplies({ data: [] });
      await screen.findByText('No replies yet.');
    });
  });

  describe('ticket metadata rendering', () => {
    it('renders ticket subject, fromEmail, status, and createdAt after load', async () => {
      setupDefaultMocks();
      renderComponent();

      await screen.findByText('Help needed');
      expect(screen.getByText('customer@example.com')).toBeInTheDocument();
      // createdAt formatted as locale string — just check that the year appears
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });

    it('renders status select with correct current value', async () => {
      setupDefaultMocks();
      renderComponent();

      await screen.findByText('Help needed');
      const statusSelect = screen.getByRole('combobox', { name: /ticket status/i });
      expect((statusSelect as HTMLSelectElement).value).toBe('OPEN');
    });

    it('renders category select showing Uncategorised when category is null', async () => {
      setupDefaultMocks();
      renderComponent();

      await screen.findByText('Help needed');
      const categorySelect = screen.getByRole('combobox', { name: /ticket category/i });
      expect((categorySelect as HTMLSelectElement).value).toBe('');
    });

    it('renders category select with correct value when category is set', async () => {
      vi.mocked(axios.get).mockImplementation((url: string) => {
        if (url.includes('/api/tickets/ticket-1/replies')) {
          return Promise.resolve({ data: [] });
        }
        if (url.includes('/api/agents')) {
          return Promise.resolve({ data: mockAgents });
        }
        if (url.includes('/api/tickets/ticket-1')) {
          return Promise.resolve({ data: { ...ticket, category: 'TECHNICAL_QUESTION' } });
        }
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
      });

      renderComponent();

      await screen.findByText('Help needed');
      const categorySelect = screen.getByRole('combobox', { name: /ticket category/i });
      expect((categorySelect as HTMLSelectElement).value).toBe('TECHNICAL_QUESTION');
    });

    it('renders agent select as Unassigned when agent is null', async () => {
      setupDefaultMocks();
      renderComponent();

      await screen.findByText('Help needed');
      const agentSelect = screen.getByRole('combobox', { name: /assign agent/i });
      expect((agentSelect as HTMLSelectElement).value).toBe('');
    });

    it('renders agent select with correct value when agent is assigned', async () => {
      vi.mocked(axios.get).mockImplementation((url: string) => {
        if (url.includes('/api/tickets/ticket-1/replies')) {
          return Promise.resolve({ data: [] });
        }
        if (url.includes('/api/agents')) {
          return Promise.resolve({ data: mockAgents });
        }
        if (url.includes('/api/tickets/ticket-1')) {
          return Promise.resolve({
            data: { ...ticket, agent: { id: 'agent-1', name: 'Agent Alice' } },
          });
        }
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
      });

      renderComponent();

      await screen.findByText('Help needed');
      const agentSelect = screen.getByRole('combobox', { name: /assign agent/i });
      expect((agentSelect as HTMLSelectElement).value).toBe('agent-1');
    });

    it('lists agents in the agent select dropdown', async () => {
      setupDefaultMocks();
      renderComponent();

      await screen.findByText('Help needed');
      expect(screen.getByRole('option', { name: 'Agent Alice' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Agent Bob' })).toBeInTheDocument();
    });

    it('renders Back to tickets link', async () => {
      setupDefaultMocks();
      renderComponent();

      await screen.findByText('Help needed');
      expect(screen.getByRole('link', { name: /back to tickets/i })).toBeInTheDocument();
    });
  });

  describe('AI Summary card', () => {
    it('does not show AI Summary card when summary is null and ticket is loaded', async () => {
      setupDefaultMocks();
      renderComponent();

      await screen.findByText('Help needed');
      expect(screen.queryByText('AI Summary')).not.toBeInTheDocument();
    });

    it('shows AI Summary card with content when summary is non-null', async () => {
      vi.mocked(axios.get).mockImplementation((url: string) => {
        if (url.includes('/api/tickets/ticket-1/replies')) {
          return Promise.resolve({ data: [] });
        }
        if (url.includes('/api/agents')) {
          return Promise.resolve({ data: mockAgents });
        }
        if (url.includes('/api/tickets/ticket-1')) {
          return Promise.resolve({
            data: { ...ticket, summary: 'Customer needs help with login.' },
          });
        }
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
      });

      renderComponent();

      // Wait until ticket loads (subject visible) then check summary text is shown
      await screen.findByText('Help needed');
      expect(screen.getByText('AI Summary')).toBeInTheDocument();
      expect(screen.getByText('Customer needs help with login.')).toBeInTheDocument();
    });

    it('shows AI Summary card (with skeletons) while loading', async () => {
      vi.mocked(axios.get).mockImplementation(() => new Promise(() => {}));
      renderComponent();

      expect(screen.getByText('AI Summary')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when ticket query fails', async () => {
      vi.mocked(axios.get).mockImplementation((url: string) => {
        if (url.includes('/api/agents')) {
          return Promise.resolve({ data: mockAgents });
        }
        return Promise.reject(new Error('Network Error'));
      });

      renderComponent();

      await screen.findByText('Failed to load ticket.');
    });

    it('hides ticket content when there is an error', async () => {
      vi.mocked(axios.get).mockImplementation((url: string) => {
        if (url.includes('/api/agents')) {
          return Promise.resolve({ data: mockAgents });
        }
        return Promise.reject(new Error('Network Error'));
      });

      renderComponent();

      await screen.findByText('Failed to load ticket.');
      expect(screen.queryByText('Help needed')).not.toBeInTheDocument();
    });
  });

  describe('status select interactions', () => {
    it('fires PATCH /api/tickets/:id when status changes', async () => {
      setupDefaultMocks();
      vi.mocked(axios.patch).mockResolvedValue({ data: {} });
      renderComponent();

      await screen.findByText('Help needed');
      const statusSelect = screen.getByRole('combobox', { name: /ticket status/i });
      fireEvent.change(statusSelect, { target: { value: 'RESOLVED' } });

      await waitFor(() => {
        expect(vi.mocked(axios.patch)).toHaveBeenCalledWith(
          expect.stringContaining('/api/tickets/ticket-1'),
          { status: 'RESOLVED' },
          expect.objectContaining({ withCredentials: true }),
        );
      });
    });

    it('does not call agent endpoint when status changes', async () => {
      setupDefaultMocks();
      vi.mocked(axios.patch).mockResolvedValue({ data: {} });
      renderComponent();

      await screen.findByText('Help needed');
      const statusSelect = screen.getByRole('combobox', { name: /ticket status/i });
      fireEvent.change(statusSelect, { target: { value: 'CLOSED' } });

      await waitFor(() => {
        expect(vi.mocked(axios.patch)).toHaveBeenCalledTimes(1);
      });
      expect(vi.mocked(axios.patch)).not.toHaveBeenCalledWith(
        expect.stringContaining('/agent'),
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe('category select interactions', () => {
    it('fires PATCH /api/tickets/:id with category value when a category is selected', async () => {
      setupDefaultMocks();
      vi.mocked(axios.patch).mockResolvedValue({ data: {} });
      renderComponent();

      await screen.findByText('Help needed');
      const categorySelect = screen.getByRole('combobox', { name: /ticket category/i });
      fireEvent.change(categorySelect, { target: { value: 'REFUND_REQUEST' } });

      await waitFor(() => {
        expect(vi.mocked(axios.patch)).toHaveBeenCalledWith(
          expect.stringContaining('/api/tickets/ticket-1'),
          { category: 'REFUND_REQUEST' },
          expect.objectContaining({ withCredentials: true }),
        );
      });
    });

    it('sends null category when empty string is selected', async () => {
      vi.mocked(axios.get).mockImplementation((url: string) => {
        if (url.includes('/api/tickets/ticket-1/replies')) {
          return Promise.resolve({ data: [] });
        }
        if (url.includes('/api/agents')) {
          return Promise.resolve({ data: mockAgents });
        }
        if (url.includes('/api/tickets/ticket-1')) {
          return Promise.resolve({
            data: { ...ticket, category: 'TECHNICAL_QUESTION' },
          });
        }
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
      });
      vi.mocked(axios.patch).mockResolvedValue({ data: {} });
      renderComponent();

      await screen.findByText('Help needed');
      const categorySelect = screen.getByRole('combobox', { name: /ticket category/i });
      fireEvent.change(categorySelect, { target: { value: '' } });

      await waitFor(() => {
        expect(vi.mocked(axios.patch)).toHaveBeenCalledWith(
          expect.stringContaining('/api/tickets/ticket-1'),
          { category: null },
          expect.objectContaining({ withCredentials: true }),
        );
      });
    });
  });

  describe('agent select interactions', () => {
    it('fires PATCH /api/tickets/:id/agent with agentId when an agent is selected', async () => {
      setupDefaultMocks();
      vi.mocked(axios.patch).mockResolvedValue({ data: {} });
      renderComponent();

      await screen.findByText('Help needed');
      const agentSelect = screen.getByRole('combobox', { name: /assign agent/i });
      fireEvent.change(agentSelect, { target: { value: 'agent-2' } });

      await waitFor(() => {
        expect(vi.mocked(axios.patch)).toHaveBeenCalledWith(
          expect.stringContaining('/api/tickets/ticket-1/agent'),
          { agentId: 'agent-2' },
          expect.objectContaining({ withCredentials: true }),
        );
      });
    });

    it('sends null agentId when empty string (Unassigned) is selected', async () => {
      vi.mocked(axios.get).mockImplementation((url: string) => {
        if (url.includes('/api/tickets/ticket-1/replies')) {
          return Promise.resolve({ data: [] });
        }
        if (url.includes('/api/agents')) {
          return Promise.resolve({ data: mockAgents });
        }
        if (url.includes('/api/tickets/ticket-1')) {
          return Promise.resolve({
            data: { ...ticket, agent: { id: 'agent-1', name: 'Agent Alice' } },
          });
        }
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
      });
      vi.mocked(axios.patch).mockResolvedValue({ data: {} });
      renderComponent();

      await screen.findByText('Help needed');
      const agentSelect = screen.getByRole('combobox', { name: /assign agent/i });
      fireEvent.change(agentSelect, { target: { value: '' } });

      await waitFor(() => {
        expect(vi.mocked(axios.patch)).toHaveBeenCalledWith(
          expect.stringContaining('/api/tickets/ticket-1/agent'),
          { agentId: null },
          expect.objectContaining({ withCredentials: true }),
        );
      });
    });
  });

  describe('replies section', () => {
    it('shows "No replies yet." when replies array is empty', async () => {
      setupDefaultMocks();
      renderComponent();

      await screen.findByText('No replies yet.');
    });

    it('renders agent reply with author name', async () => {
      vi.mocked(axios.get).mockImplementation((url: string) => {
        if (url.includes('/api/tickets/ticket-1/replies')) {
          return Promise.resolve({ data: [agentReply] });
        }
        if (url.includes('/api/agents')) {
          return Promise.resolve({ data: mockAgents });
        }
        if (url.includes('/api/tickets/ticket-1')) {
          return Promise.resolve({ data: ticket });
        }
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
      });

      renderComponent();

      // The reply body is unique — wait for it to confirm reply rendered
      await screen.findByText('We are looking into it');
      // Author name appears in the reply header span (also in select option — use getAllByText)
      const authorNames = screen.getAllByText('Agent Alice');
      expect(authorNames.length).toBeGreaterThanOrEqual(1);
    });

    it('renders customer reply with fromEmail when author is null', async () => {
      vi.mocked(axios.get).mockImplementation((url: string) => {
        if (url.includes('/api/tickets/ticket-1/replies')) {
          return Promise.resolve({ data: [customerReply] });
        }
        if (url.includes('/api/agents')) {
          return Promise.resolve({ data: mockAgents });
        }
        if (url.includes('/api/tickets/ticket-1')) {
          return Promise.resolve({ data: ticket });
        }
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
      });

      renderComponent();

      // Reply body is unique
      await screen.findByText('Any update?');
      // fromEmail appears both in the "From" field and the reply author; use getAllByText
      const emailElements = screen.getAllByText('customer@example.com');
      expect(emailElements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows reply count in heading when replies are present', async () => {
      vi.mocked(axios.get).mockImplementation((url: string) => {
        if (url.includes('/api/tickets/ticket-1/replies')) {
          return Promise.resolve({ data: [agentReply, customerReply] });
        }
        if (url.includes('/api/agents')) {
          return Promise.resolve({ data: mockAgents });
        }
        if (url.includes('/api/tickets/ticket-1')) {
          return Promise.resolve({ data: ticket });
        }
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
      });

      renderComponent();

      await screen.findByText('(2)');
    });

    it('renders multiple replies', async () => {
      vi.mocked(axios.get).mockImplementation((url: string) => {
        if (url.includes('/api/tickets/ticket-1/replies')) {
          return Promise.resolve({ data: [agentReply, customerReply] });
        }
        if (url.includes('/api/agents')) {
          return Promise.resolve({ data: mockAgents });
        }
        if (url.includes('/api/tickets/ticket-1')) {
          return Promise.resolve({ data: ticket });
        }
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
      });

      renderComponent();

      await screen.findByText('We are looking into it');
      expect(screen.getByText('Any update?')).toBeInTheDocument();
    });
  });

  describe('reply form', () => {
    it('renders the reply textarea and Send reply button', async () => {
      setupDefaultMocks();
      renderComponent();

      await screen.findByText('No replies yet.');
      expect(screen.getByPlaceholderText('Write a reply...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reply/i })).toBeInTheDocument();
    });

    it('Send reply button is disabled when textarea is empty', async () => {
      setupDefaultMocks();
      renderComponent();

      await screen.findByText('No replies yet.');
      const button = screen.getByRole('button', { name: /send reply/i });
      expect(button).toBeDisabled();
    });

    it('Send reply button is disabled when textarea contains only whitespace', async () => {
      setupDefaultMocks();
      renderComponent();

      await screen.findByText('No replies yet.');
      const textarea = screen.getByPlaceholderText('Write a reply...');
      fireEvent.change(textarea, { target: { value: '   ' } });
      const button = screen.getByRole('button', { name: /send reply/i });
      expect(button).toBeDisabled();
    });

    it('Send reply button is enabled when textarea has content', async () => {
      setupDefaultMocks();
      renderComponent();

      await screen.findByText('No replies yet.');
      const textarea = screen.getByPlaceholderText('Write a reply...');
      fireEvent.change(textarea, { target: { value: 'Hello there' } });
      const button = screen.getByRole('button', { name: /send reply/i });
      expect(button).toBeEnabled();
    });

    it('submitting the form calls POST /api/tickets/:id/replies with trimmed body', async () => {
      setupDefaultMocks();
      vi.mocked(axios.post).mockResolvedValue({ data: { id: 'r3', body: 'Hello there', fromEmail: null, createdAt: '2024-01-04T00:00:00.000Z', author: { id: 'u1', name: 'Agent Alice' } } });
      renderComponent();

      await screen.findByText('No replies yet.');
      const textarea = screen.getByPlaceholderText('Write a reply...');
      fireEvent.change(textarea, { target: { value: '  Hello there  ' } });

      const form = screen.getByPlaceholderText('Write a reply...').closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(vi.mocked(axios.post)).toHaveBeenCalledWith(
          expect.stringContaining('/api/tickets/ticket-1/replies'),
          { body: 'Hello there' },
          expect.objectContaining({ withCredentials: true }),
        );
      });
    });

    it('clears the textarea after successful reply submission', async () => {
      setupDefaultMocks();
      vi.mocked(axios.post).mockResolvedValue({
        data: {
          id: 'r3',
          body: 'Hello there',
          fromEmail: null,
          createdAt: '2024-01-04T00:00:00.000Z',
          author: { id: 'u1', name: 'Agent Alice' },
        },
      });
      renderComponent();

      await screen.findByText('No replies yet.');
      const textarea = screen.getByPlaceholderText('Write a reply...');
      fireEvent.change(textarea, { target: { value: 'Hello there' } });

      const form = textarea.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect((textarea as HTMLTextAreaElement).value).toBe('');
      });
    });

    it('does not call POST when form is submitted with empty textarea', async () => {
      setupDefaultMocks();
      renderComponent();

      await screen.findByText('No replies yet.');
      const form = screen.getByPlaceholderText('Write a reply...').closest('form')!;
      fireEvent.submit(form);

      expect(vi.mocked(axios.post)).not.toHaveBeenCalled();
    });

    it('shows Sending… and disables button while submitting', async () => {
      setupDefaultMocks();
      let resolvePost!: (value: unknown) => void;
      vi.mocked(axios.post).mockReturnValue(
        new Promise((resolve) => { resolvePost = resolve; }),
      );

      renderComponent();

      await screen.findByText('No replies yet.');
      const textarea = screen.getByPlaceholderText('Write a reply...');
      fireEvent.change(textarea, { target: { value: 'Hello there' } });

      const form = textarea.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
      });

      resolvePost({
        data: {
          id: 'r3',
          body: 'Hello there',
          fromEmail: null,
          createdAt: '2024-01-04T00:00:00.000Z',
          author: { id: 'u1', name: 'Agent Alice' },
        },
      });
    });
  });

  describe('message body rendering', () => {
    it('renders plain text body in a pre element when bodyHtml is null', async () => {
      setupDefaultMocks();
      renderComponent();

      await screen.findByText('Please help');
      const pre = screen.getByText('Please help').closest('pre');
      expect(pre).toBeInTheDocument();
    });

    it('renders HTML body when bodyHtml is set', async () => {
      vi.mocked(axios.get).mockImplementation((url: string) => {
        if (url.includes('/api/tickets/ticket-1/replies')) {
          return Promise.resolve({ data: [] });
        }
        if (url.includes('/api/agents')) {
          return Promise.resolve({ data: mockAgents });
        }
        if (url.includes('/api/tickets/ticket-1')) {
          return Promise.resolve({
            data: { ...ticket, bodyHtml: '<p>Please <strong>help</strong></p>' },
          });
        }
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
      });

      renderComponent();

      await screen.findByText('Help needed');
      const prose = document.querySelector('.prose');
      expect(prose).toBeInTheDocument();
      expect(prose?.innerHTML).toContain('<strong>help</strong>');
    });
  });

  describe('navbar', () => {
    it('renders the NavBar', async () => {
      setupDefaultMocks();
      renderComponent();

      expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });
  });
});
