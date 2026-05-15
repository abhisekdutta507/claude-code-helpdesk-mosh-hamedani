import axios from 'axios';
import {
  TicketStatus,
  TicketCategory,
  type TicketSortBy as TicketSortByType,
  type TicketSortDir as TicketSortDirType,
} from '@repo/shared/schemas/ticket';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type Agent = { id: string; name: string };

export type Ticket = {
  id: string;
  fromEmail: string;
  subject: string;
  status: (typeof TicketStatus)[keyof typeof TicketStatus];
  category: (typeof TicketCategory)[keyof typeof TicketCategory] | null;
  summary: string | null;
  createdAt: string;
  agent: Agent | null;
};

export type TicketsResponse = {
  tickets: Ticket[];
  total: number;
  page: number;
  pageSize: number;
};

export type TicketDetail = {
  id: string;
  fromEmail: string;
  toEmail: string | null;
  subject: string;
  body: string;
  bodyHtml: string | null;
  status: (typeof TicketStatus)[keyof typeof TicketStatus];
  category: (typeof TicketCategory)[keyof typeof TicketCategory] | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
  agent: Agent | null;
};

export type Reply = {
  id: string;
  body: string;
  createdAt: string;
  fromEmail: string | null;
  author: Agent | null;
};

export async function fetchTickets(
  sortBy: TicketSortByType,
  sortDir: TicketSortDirType,
  page: number,
  status: string,
  category: string,
  agentId: string,
  dateRange: string,
  search: string,
): Promise<TicketsResponse> {
  const params: Record<string, string | number> = { sortBy, sortDir, page };
  if (status) params.status = status;
  if (category) params.category = category;
  if (agentId) params.agentId = agentId;
  if (dateRange) params.dateRange = dateRange;
  if (search.trim()) params.search = search.trim();

  const res = await axios.get<TicketsResponse>(`${API_URL}/api/tickets`, {
    withCredentials: true,
    params,
  });
  return res.data;
}

export async function fetchAgents(): Promise<Agent[]> {
  const res = await axios.get<Agent[]>(`${API_URL}/api/agents`, { withCredentials: true });
  return res.data;
}

export async function fetchTicket(id: string): Promise<TicketDetail> {
  const res = await axios.get<TicketDetail>(`${API_URL}/api/tickets/${id}`, {
    withCredentials: true,
  });
  return res.data;
}

export async function fetchReplies(ticketId: string): Promise<Reply[]> {
  const res = await axios.get<Reply[]>(`${API_URL}/api/tickets/${ticketId}/replies`, {
    withCredentials: true,
  });
  return res.data;
}

export async function assignAgent(ticketId: string, agentId: string | null): Promise<void> {
  await axios.patch(`${API_URL}/api/tickets/${ticketId}/agent`, { agentId }, { withCredentials: true });
}

export async function updateTicket(
  ticketId: string,
  data: { status?: string; category?: string | null },
): Promise<void> {
  await axios.patch(`${API_URL}/api/tickets/${ticketId}`, data, { withCredentials: true });
}

export async function postReply(ticketId: string, body: string): Promise<Reply> {
  const res = await axios.post<Reply>(
    `${API_URL}/api/tickets/${ticketId}/replies`,
    { body },
    { withCredentials: true },
  );
  return res.data;
}
