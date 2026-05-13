import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TicketStatus, TicketCategory } from '@repo/shared/schemas/ticket';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type Ticket = {
  id: string;
  fromEmail: string;
  subject: string;
  status: TicketStatus;
  category: TicketCategory | null;
  summary: string | null;
  createdAt: string;
  agent: { id: string; name: string } | null;
};

async function fetchTickets(): Promise<Ticket[]> {
  const res = await axios.get<Ticket[]>(`${API_URL}/api/tickets`, { withCredentials: true });
  return res.data;
}

const statusBadgeClass: Record<TicketStatus, string> = {
  [TicketStatus.OPEN]:
    'inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700',
  [TicketStatus.RESOLVED]:
    'inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700',
  [TicketStatus.CLOSED]:
    'inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground',
};

const categoryLabel: Record<TicketCategory, string> = {
  [TicketCategory.GENERAL_QUESTION]: 'General',
  [TicketCategory.TECHNICAL_QUESTION]: 'Technical',
  [TicketCategory.REFUND_REQUEST]: 'Refund',
};

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell className="px-6"><Skeleton className="h-4 w-48" /></TableCell>
          <TableCell className="px-6"><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell className="px-6"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
          <TableCell className="px-6"><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
          <TableCell className="px-6"><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell className="px-6"><Skeleton className="h-4 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  return (
    <TableRow>
      <TableCell className="px-6 font-medium max-w-xs truncate">{ticket.subject}</TableCell>
      <TableCell className="px-6 text-muted-foreground">{ticket.fromEmail}</TableCell>
      <TableCell className="px-6">
        <span className={statusBadgeClass[ticket.status]}>{ticket.status}</span>
      </TableCell>
      <TableCell className="px-6">
        {ticket.category ? (
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            {categoryLabel[ticket.category]}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>
      <TableCell className="px-6 text-muted-foreground">
        {ticket.agent?.name ?? <span className="text-xs">Unassigned</span>}
      </TableCell>
      <TableCell className="px-6 text-muted-foreground">
        {new Date(ticket.createdAt).toLocaleDateString()}
      </TableCell>
    </TableRow>
  );
}

export default function TicketsPage() {
  const { data: tickets = [], isPending, isError } = useQuery({
    queryKey: ['tickets'],
    queryFn: fetchTickets,
  });

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Tickets</h1>
        </div>

        {isError && <p className="text-destructive">Failed to load tickets.</p>}

        {!isError && (
          <Card>
            <CardHeader>
              <CardTitle>
                {isPending ? <Skeleton className="h-5 w-24" /> : `All tickets (${tickets.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6">Subject</TableHead>
                    <TableHead className="px-6">From</TableHead>
                    <TableHead className="px-6">Status</TableHead>
                    <TableHead className="px-6">Category</TableHead>
                    <TableHead className="px-6">Agent</TableHead>
                    <TableHead className="px-6">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isPending
                    ? <SkeletonRows />
                    : tickets.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)
                  }
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
