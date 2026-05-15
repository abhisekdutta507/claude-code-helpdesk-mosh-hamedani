import { Link } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
} from '@tanstack/react-table';
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
import { TicketStatus, TicketCategory, PAGE_SIZE } from '@repo/shared/schemas/ticket';
import { type Ticket } from '@/api/tickets';
import { SortableHeader } from '@/components/SortableHeader';

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

const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: 'subject',
    header: ({ column }) => (
      <SortableHeader label="Subject" sorted={column.getIsSorted()} onToggle={column.getToggleSortingHandler()} />
    ),
    cell: ({ row }) => (
      <Link
        to={`/tickets/${row.original.id}`}
        className="font-medium max-w-xs truncate block hover:underline"
      >
        {row.original.subject}
      </Link>
    ),
  },
  {
    accessorKey: 'fromEmail',
    header: ({ column }) => (
      <SortableHeader label="From" sorted={column.getIsSorted()} onToggle={column.getToggleSortingHandler()} />
    ),
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.fromEmail}</span>,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <SortableHeader label="Status" sorted={column.getIsSorted()} onToggle={column.getToggleSortingHandler()} />
    ),
    cell: ({ row }) => <span className={statusBadgeClass[row.original.status]}>{row.original.status}</span>,
  },
  {
    accessorKey: 'category',
    header: ({ column }) => (
      <SortableHeader label="Category" sorted={column.getIsSorted()} onToggle={column.getToggleSortingHandler()} />
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
      <SortableHeader label="Date" sorted={column.getIsSorted()} onToggle={column.getToggleSortingHandler()} />
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

type Props = {
  tickets: Ticket[];
  total: number;
  isPending: boolean;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  children?: React.ReactNode;
};

export function TicketTable({ tickets, total, isPending, sorting, onSortingChange, children }: Props) {
  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    enableMultiSort: false,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
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
        {children}
      </CardContent>
    </Card>
  );
}
