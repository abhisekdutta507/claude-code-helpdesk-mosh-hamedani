import { useState } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
import {
  TicketStatus,
  TicketCategory,
  TicketSortBy,
  TicketSortDir,
  type TicketSortBy as TicketSortByType,
  type TicketSortDir as TicketSortDirType,
} from '@repo/shared/schemas/ticket';

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

async function fetchTickets(sortBy: TicketSortByType, sortDir: TicketSortDirType): Promise<Ticket[]> {
  const res = await axios.get<Ticket[]>(`${API_URL}/api/tickets`, {
    withCredentials: true,
    params: { sortBy, sortDir },
  });
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

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ArrowUp className="ml-1 inline h-3 w-3" />;
  if (sorted === 'desc') return <ArrowDown className="ml-1 inline h-3 w-3" />;
  return <ArrowUpDown className="ml-1 inline h-3 w-3 text-muted-foreground" />;
}

const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: 'subject',
    header: ({ column }) => (
      <button
        className="flex cursor-pointer items-center font-medium"
        onClick={column.getToggleSortingHandler()}
      >
        Subject
        <SortIcon sorted={column.getIsSorted()} />
      </button>
    ),
    cell: ({ row }) => (
      <span className="font-medium max-w-xs truncate block">{row.original.subject}</span>
    ),
  },
  {
    accessorKey: 'fromEmail',
    header: ({ column }) => (
      <button
        className="flex cursor-pointer items-center font-medium"
        onClick={column.getToggleSortingHandler()}
      >
        From
        <SortIcon sorted={column.getIsSorted()} />
      </button>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.fromEmail}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <button
        className="flex cursor-pointer items-center font-medium"
        onClick={column.getToggleSortingHandler()}
      >
        Status
        <SortIcon sorted={column.getIsSorted()} />
      </button>
    ),
    cell: ({ row }) => (
      <span className={statusBadgeClass[row.original.status]}>{row.original.status}</span>
    ),
  },
  {
    accessorKey: 'category',
    header: ({ column }) => (
      <button
        className="flex cursor-pointer items-center font-medium"
        onClick={column.getToggleSortingHandler()}
      >
        Category
        <SortIcon sorted={column.getIsSorted()} />
      </button>
    ),
    cell: ({ row }) =>
      row.original.category ? (
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
          {categoryLabel[row.original.category]}
        </span>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      ),
  },
  {
    id: 'agent',
    header: 'Agent',
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.agent?.name ?? <span className="text-xs">Unassigned</span>}
      </span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <button
        className="flex cursor-pointer items-center font-medium"
        onClick={column.getToggleSortingHandler()}
      >
        Date
        <SortIcon sorted={column.getIsSorted()} />
      </button>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleString()}
      </span>
    ),
  },
];

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

export default function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);

  const sortBy = (sorting[0]?.id ?? TicketSortBy.CREATED_AT) as TicketSortByType;
  const sortDir = sorting[0]
    ? (sorting[0].desc ? TicketSortDir.DESC : TicketSortDir.ASC)
    : TicketSortDir.DESC;

  const { data: tickets = [], isPending, isError } = useQuery({
    queryKey: ['tickets', sortBy, sortDir],
    queryFn: () => fetchTickets(sortBy, sortDir),
  });

  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true,
    enableMultiSort: false,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
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
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="px-6">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {isPending
                    ? <SkeletonRows />
                    : table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="px-6">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
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
