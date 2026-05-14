import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  TicketStatus,
  TicketCategory,
  TicketSortBy,
  TicketSortDir,
  TicketDateRange,
  PAGE_SIZE,
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

type TicketsResponse = {
  tickets: Ticket[];
  total: number;
  page: number;
  pageSize: number;
};

type Agent = { id: string; name: string };

async function fetchTickets(
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
  if (dateRange && dateRange !== TicketDateRange.ALL_TIME) params.dateRange = dateRange;
  if (search.trim()) params.search = search.trim();

  const res = await axios.get<TicketsResponse>(`${API_URL}/api/tickets`, {
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

const sortByValues = new Set(Object.values(TicketSortBy));
const sortDirValues = new Set(Object.values(TicketSortDir));
const statusValues = new Set(Object.values(TicketStatus));
const categoryValues = new Set(Object.values(TicketCategory));
const dateRangeValues = new Set(Object.values(TicketDateRange));

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ArrowUp className="ml-1 inline h-3 w-3" />;
  if (sorted === 'desc') return <ArrowDown className="ml-1 inline h-3 w-3" />;
  return <ArrowUpDown className="ml-1 inline h-3 w-3 text-muted-foreground" />;
}

const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: 'subject',
    header: ({ column }) => (
      <button className="flex cursor-pointer items-center font-medium" onClick={column.getToggleSortingHandler()}>
        Subject <SortIcon sorted={column.getIsSorted()} />
      </button>
    ),
    cell: ({ row }) => <span className="font-medium max-w-xs truncate block">{row.original.subject}</span>,
  },
  {
    accessorKey: 'fromEmail',
    header: ({ column }) => (
      <button className="flex cursor-pointer items-center font-medium" onClick={column.getToggleSortingHandler()}>
        From <SortIcon sorted={column.getIsSorted()} />
      </button>
    ),
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.fromEmail}</span>,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <button className="flex cursor-pointer items-center font-medium" onClick={column.getToggleSortingHandler()}>
        Status <SortIcon sorted={column.getIsSorted()} />
      </button>
    ),
    cell: ({ row }) => <span className={statusBadgeClass[row.original.status]}>{row.original.status}</span>,
  },
  {
    accessorKey: 'category',
    header: ({ column }) => (
      <button className="flex cursor-pointer items-center font-medium" onClick={column.getToggleSortingHandler()}>
        Category <SortIcon sorted={column.getIsSorted()} />
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
      <button className="flex cursor-pointer items-center font-medium" onClick={column.getToggleSortingHandler()}>
        Date <SortIcon sorted={column.getIsSorted()} />
      </button>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{new Date(row.original.createdAt).toLocaleString()}</span>
    ),
  },
];

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
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

function buildPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

export default function TicketsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read all state from URL — with validation/fallback for invalid values
  const sortBy = (sortByValues.has(searchParams.get('sortBy') as TicketSortByType)
    ? searchParams.get('sortBy')
    : TicketSortBy.CREATED_AT) as TicketSortByType;

  const sortDir = (sortDirValues.has(searchParams.get('sortDir') as TicketSortDirType)
    ? searchParams.get('sortDir')
    : TicketSortDir.DESC) as TicketSortDirType;

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const status = statusValues.has(searchParams.get('status') as (typeof TicketStatus)[keyof typeof TicketStatus])
    ? (searchParams.get('status') ?? '')
    : '';
  const category = categoryValues.has(searchParams.get('category') as (typeof TicketCategory)[keyof typeof TicketCategory])
    ? (searchParams.get('category') ?? '')
    : '';
  const agentId = searchParams.get('agentId') ?? '';
  const dateRange = (dateRangeValues.has(searchParams.get('dateRange') as TicketDateRangeType)
    ? searchParams.get('dateRange')
    : TicketDateRange.ALL_TIME) as TicketDateRangeType;
  const search = searchParams.get('search') ?? '';

  // search input is kept as local state so typing doesn't fire a request on every keystroke
  const [searchInput, setSearchInput] = useSearchParamsInput(search);

  const { data, isPending, isError } = useQuery({
    queryKey: ['tickets', sortBy, sortDir, page, status, category, agentId, dateRange, search],
    queryFn: () => fetchTickets(sortBy, sortDir, page, status, category, agentId, dateRange, search),
    staleTime: 60_000,
  });

  const tickets = data?.tickets ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
    staleTime: 5 * 60_000,
  });

  function setParam(key: string, value: string, resetPage = true) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      if (resetPage) next.delete('page');
      return next;
    }, { replace: false });
  }

  function setPage(p: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (p === 1) next.delete('page'); else next.set('page', String(p));
      return next;
    }, { replace: false });
  }

  function commitSearch(value: string) {
    setParam('search', value.trim());
  }

  function clearFilters() {
    setSearchInput('');
    setSearchParams((prev) => {
      const next = new URLSearchParams();
      // preserve sort
      if (prev.get('sortBy')) next.set('sortBy', prev.get('sortBy')!);
      if (prev.get('sortDir')) next.set('sortDir', prev.get('sortDir')!);
      return next;
    }, { replace: false });
  }

  const sorting: SortingState = [{ id: sortBy, desc: sortDir === TicketSortDir.DESC }];

  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      if (next.length > 0) {
        setSearchParams((prev) => {
          const params = new URLSearchParams(prev);
          params.set('sortBy', next[0].id);
          params.set('sortDir', next[0].desc ? TicketSortDir.DESC : TicketSortDir.ASC);
          params.delete('page');
          return params;
        }, { replace: false });
      }
    },
    manualSorting: true,
    enableMultiSort: false,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
  });

  const activeFilters = status !== '' || category !== '' || agentId !== '' ||
    dateRange !== TicketDateRange.ALL_TIME || search !== '';

  const pageNumbers = buildPageNumbers(page, totalPages);

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
              onKeyDown={(e) => { if (e.key === 'Enter') commitSearch(searchInput); }}
              onBlur={() => commitSearch(searchInput)}
              className="h-9 max-w-xs"
            />
          </div>

          <select
            className={filterSelectClass}
            value={status}
            onChange={(e) => setParam('status', e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {Object.values(TicketStatus).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            className={filterSelectClass}
            value={category}
            onChange={(e) => setParam('category', e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {Object.values(TicketCategory).map((c) => <option key={c} value={c}>{categoryLabel[c]}</option>)}
          </select>

          <select
            className={filterSelectClass}
            value={agentId}
            onChange={(e) => setParam('agentId', e.target.value)}
            aria-label="Filter by agent"
          >
            <option value="">All agents</option>
            <option value="unassigned">Unassigned</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          <select
            className={filterSelectClass}
            value={dateRange}
            onChange={(e) => setParam('dateRange', e.target.value)}
            aria-label="Filter by date range"
          >
            {Object.values(TicketDateRange).map((d) => <option key={d} value={d}>{dateRangeLabel[d]}</option>)}
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
                {isPending
                  ? <Skeleton className="h-5 w-24" />
                  : `${total} ticket${total !== 1 ? 's' : ''}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="px-6">
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {isPending
                    ? <SkeletonRows />
                    : tickets.length === 0
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

              {!isPending && totalPages > 1 && (
                <div className="border-t px-6 py-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }}
                          aria-disabled={page === 1}
                          className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>

                      {pageNumbers.map((p, i) =>
                        p === 'ellipsis' ? (
                          <PaginationItem key={`ellipsis-${i}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={p}>
                            <PaginationLink
                              href="#"
                              isActive={p === page}
                              onClick={(e) => { e.preventDefault(); setPage(p); }}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1); }}
                          aria-disabled={page === totalPages}
                          className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

// Keeps the search input in sync with the URL param without firing a request on every keystroke.
// Returns [localValue, setter] — setter only updates local state; commitSearch writes to URL.
function useSearchParamsInput(urlValue: string): [string, (v: string) => void] {
  const [local, setLocal] = useState(urlValue);
  useEffect(() => { setLocal(urlValue); }, [urlValue]);
  return [local, setLocal];
}
