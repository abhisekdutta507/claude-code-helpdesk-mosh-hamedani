import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TicketStatus, TicketCategory } from '@repo/shared/schemas/ticket';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type TicketDetail = {
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
  agent: { id: string; name: string } | null;
};

const statusBadgeClass: Record<string, string> = {
  [TicketStatus.OPEN]:
    'inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700',
  [TicketStatus.RESOLVED]:
    'inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700',
  [TicketStatus.CLOSED]:
    'inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground',
};

const categoryLabel: Record<string, string> = {
  [TicketCategory.GENERAL_QUESTION]: 'General',
  [TicketCategory.TECHNICAL_QUESTION]: 'Technical',
  [TicketCategory.REFUND_REQUEST]: 'Refund',
};

type Agent = { id: string; name: string };

async function fetchTicket(id: string): Promise<TicketDetail> {
  const res = await axios.get<TicketDetail>(`${API_URL}/api/tickets/${id}`, {
    withCredentials: true,
  });
  return res.data;
}

async function fetchAgents(): Promise<Agent[]> {
  const res = await axios.get<Agent[]>(`${API_URL}/api/agents`, { withCredentials: true });
  return res.data;
}

async function assignAgent(ticketId: string, agentId: string | null): Promise<void> {
  await axios.patch(`${API_URL}/api/tickets/${ticketId}/agent`, { agentId }, { withCredentials: true });
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: ticket, isPending, isError } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => fetchTicket(id!),
    enabled: !!id,
    staleTime: 60_000,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
    staleTime: 5 * 60_000,
  });

  const { mutate: assign, isPending: isAssigning } = useMutation({
    mutationFn: (agentId: string | null) => assignAgent(id!, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link
            to="/tickets"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to tickets
          </Link>
        </div>

        {isError && <p className="text-destructive">Failed to load ticket.</p>}

        {!isError && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-xl leading-snug">
                    {isPending ? <Skeleton className="h-6 w-96" /> : ticket!.subject}
                  </CardTitle>
                  {isPending ? (
                    <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
                  ) : (
                    <span className={`${statusBadgeClass[ticket!.status]} shrink-0`}>
                      {ticket!.status}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-muted-foreground">From</dt>
                    <dd>{isPending ? <Skeleton className="mt-1 h-4 w-48" /> : ticket!.fromEmail}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Category</dt>
                    <dd>
                      {isPending ? (
                        <Skeleton className="mt-1 h-4 w-24" />
                      ) : ticket!.category ? (
                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                          {categoryLabel[ticket!.category]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Assigned agent</dt>
                    <dd className="mt-1">
                      {isPending ? (
                        <Skeleton className="h-8 w-40" />
                      ) : (
                        <select
                          className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                          value={ticket!.agent?.id ?? ''}
                          disabled={isAssigning}
                          onChange={(e) => assign(e.target.value === '' ? null : e.target.value)}
                          aria-label="Assign agent"
                        >
                          <option value="">Unassigned</option>
                          {agents.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Created</dt>
                    <dd>
                      {isPending ? (
                        <Skeleton className="mt-1 h-4 w-40" />
                      ) : (
                        new Date(ticket!.createdAt).toLocaleString()
                      )}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {(isPending || ticket!.summary) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {isPending ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{ticket!.summary}</p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Message</CardTitle>
              </CardHeader>
              <CardContent>
                {isPending ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : ticket!.bodyHtml ? (
                  <div
                    className="prose prose-sm max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: ticket!.bodyHtml }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{ticket!.body}</pre>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
