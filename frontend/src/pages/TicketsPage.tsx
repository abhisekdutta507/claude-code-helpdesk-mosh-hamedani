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
import { ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
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
  TicketDateRange,
  type TicketSortBy as TicketSortByType,
  type TicketSortDir as TicketSortDirType,
  type TicketDateRange as TicketDateRangeType,
} from '@repo/shared/schemas/ticket';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type Ticket = {
  id: string;
  fromEmail: string;
  subject: string;
  status: (typeof TicketStatus)[keyof typeof TicketStatus];
  category: (typeof TicketCategory)[keyof typeof TicketCategory] | null;
  summary: string | null;
  createdAt: string;
  agent: { id: string; name: string } | null;
};

type Agent = { id: string; name: string };

type Filters = {
  status: (typeof TicketStatus)[keyof typeof TicketStatus] | '';
  category: (typeof TicketCategory)[keyof typeof TicketCategory] | '';
  agentId: string;
  dateRange: TicketDateRangeType;
  search: string;
};

const defaultFilters: Filters = {
  status: '',
  category: '',
  agentId: '',
  dateRange: TicketDateRange.ALL_TIME,
  search: '',
};

async function fetchTickets(
  sortBy: TicketSortByType,
  sortDir: TicketSortDirType,
  filters: Filters,
): Promise<Ticket[]> {
  const params: Record<string, string> = { sortBy, sortDir };
  if (filters.status) params.status = filters.status;
  if (filters.category) params.category = filters.category;
  if (filters.agentId) params.agentId = filters.agentId;
  if (filters.dateRange !== TicketDateRange.ALL_TIME) params.dateRange = filters.dateRange;
  if (filters.search.trim()) params.search = filters.search.trim();

  const res = await axios.get<Ticket[]>(`${API_URL}/api/tickets`, {
    withCredentials: true,
    params,
  });
  return res.data;
}

async function fetchAgents(): Promise<Agent[]> {
  const res = await axios.get<Agent[]>(`${API_URL}/api/agents`, { withCredentials: true });
  return res.data;
}

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

const dateRangeLabel: Record<TicketDateRangeType, string> = {
  [TicketDateRange.ALL_TIME]: 'All time',
  [TicketDateRange.TODAY]: 'Today',
  [TicketDateRange.LAST_7_DAYS]: 'Last 7 days',
  [TicketDateRange.LAST_30_DAYS]: 'Last 30 days',
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

const filterSelectClass =
  'h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring';

function hasActiveFilters(filters: Filters): boolean {
  return (
    filters.status !== '' ||
    filters.category !== '' ||
    filters.agentId !== '' ||
    filters.dateRange !== TicketDateRange.ALL_TIME ||
    filters.search.trim() !== ''
  );
}

export default function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [searchInput, setSearchInput] = useState('');

  const sortBy = (sorting[0]?.id ?? TicketSortBy.CREATED_AT) as TicketSortByType;
  const sortDir = sorting[0]
    ? (sorting[0].desc ? TicketSortDir.DESC : TicketSortDir.ASC)
    : TicketSortDir.DESC;

  const { data: tickets = [], isPending, isError } = useQuery({
    queryKey: ['tickets', sortBy, sortDir, filters],
    queryFn: () => fetchTickets(sortBy, sortDir, filters),
    staleTime: 60_000,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
    staleTime: 5 * 60_000,
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

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function commitSearch() {
    updateFilter('search', searchInput);
  }

  function clearFilters() {
    setFilters(defaultFilters);
    setSearchInput('');
  }

  const activeFilters = hasActiveFilters(filters);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Tickets</h1>
        </div>

        {/* Filter bar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex flex-1 items-center gap-2 min-w-[200px]">
            <Input
              placeholder="Search subject or email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && commitSearch()}
              onBlur={commitSearch}
              className="h-9 max-w-xs"
            />
          </div>

          <select
            className={filterSelectClass}
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value as Filters['status'])}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {Object.values(TicketStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            className={filterSelectClass}
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value as Filters['category'])}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {Object.values(TicketCategory).map((c) => (
              <option key={c} value={c}>{categoryLabel[c]}</option>
            ))}
          </select>

          <select
            className={filterSelectClass}
            value={filters.agentId}
            onChange={(e) => updateFilter('agentId', e.target.value)}
            aria-label="Filter by agent"
          >
            <option value="">All agents</option>
            <option value="unassigned">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <select
            className={filterSelectClass}
            value={filters.dateRange}
            onChange={(e) => updateFilter('dateRange', e.target.value as TicketDateRangeType)}
            aria-label="Filter by date range"
          >
            {Object.values(TicketDateRange).map((d) => (
              <option key={d} value={d}>{dateRangeLabel[d]}</option>
            ))}
          </select>

          {activeFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              Clear filters
            </button>
          )}
        </div>

        {isError && <p className="text-destructive">Failed to load tickets.</p>}

        {!isError && (
          <Card>
            <CardHeader>
              <CardTitle>
                {isPending ? <Skeleton className="h-5 w-24" /> : `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}`}
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
                    : table.getRowModel().rows.length === 0
                      ? (
                        <TableRow>
                          <TableCell colSpan={columns.length} className="px-6 py-10 text-center text-muted-foreground">
                            No tickets match the current filters.
                          </TableCell>
                        </TableRow>
                      )
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
