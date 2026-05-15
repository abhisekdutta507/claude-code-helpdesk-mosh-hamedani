import NavBar from '@/components/NavBar';
import { PAGE_SIZE } from '@repo/shared/schemas/ticket';
import { useTicketsPage } from '@/hooks/useTicketsPage';
import { TicketFilterBar } from './TicketFilterBar';
import { TicketTable } from './TicketTable';
import { TicketPagination } from './TicketPagination';

export default function TicketsPage() {
  const {
    page,
    status,
    category,
    agentId,
    dateRange,
    searchInput,
    setSearchInput,
    tickets,
    total,
    agents,
    isPending,
    isError,
    sorting,
    onSortingChange,
    setParam,
    setPage,
    commitSearch,
    clearFilters,
    activeFilters,
  } = useTicketsPage();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Tickets</h1>
        </div>

        <TicketFilterBar
          searchInput={searchInput}
          status={status}
          category={category}
          agentId={agentId}
          dateRange={dateRange}
          agents={agents}
          activeFilters={activeFilters}
          onSearchChange={setSearchInput}
          onSearchCommit={commitSearch}
          onFilterChange={setParam}
          onClearFilters={clearFilters}
        />

        {isError && <p className="text-destructive">Failed to load tickets.</p>}

        {!isError && (
          <TicketTable
            tickets={tickets}
            total={total}
            isPending={isPending}
            sorting={sorting}
            onSortingChange={onSortingChange}
          >
            {!isPending && totalPages > 1 && (
              <TicketPagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </TicketTable>
        )}
      </main>
    </div>
  );
}
