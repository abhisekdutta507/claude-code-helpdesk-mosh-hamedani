import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FilterSelect } from '@/components/FilterSelect';
import { TicketStatus, TicketCategory, TicketDateRange, type TicketDateRange as TicketDateRangeType } from '@repo/shared/schemas/ticket';
import { type Agent } from '@/api/tickets';

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

type Props = {
  searchInput: string;
  status: string;
  category: string;
  agentId: string;
  dateRange: TicketDateRangeType;
  agents: Agent[];
  activeFilters: boolean;
  onSearchChange: (value: string) => void;
  onSearchCommit: (value: string) => void;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
};

export function TicketFilterBar({
  searchInput,
  status,
  category,
  agentId,
  dateRange,
  agents,
  activeFilters,
  onSearchChange,
  onSearchCommit,
  onFilterChange,
  onClearFilters,
}: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="flex flex-1 items-center gap-2 min-w-[200px]">
        <Input
          placeholder="Search subject or email…"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSearchCommit(searchInput); }}
          onBlur={() => onSearchCommit(searchInput)}
          className="h-9 max-w-xs"
        />
      </div>

      <FilterSelect value={status} onChange={(v) => onFilterChange('status', v)} ariaLabel="Filter by status">
        <option value="">All statuses</option>
        {Object.values(TicketStatus).map((s) => <option key={s} value={s}>{s}</option>)}
      </FilterSelect>

      <FilterSelect value={category} onChange={(v) => onFilterChange('category', v)} ariaLabel="Filter by category">
        <option value="">All categories</option>
        {Object.values(TicketCategory).map((c) => <option key={c} value={c}>{categoryLabel[c]}</option>)}
      </FilterSelect>

      <FilterSelect value={agentId} onChange={(v) => onFilterChange('agentId', v)} ariaLabel="Filter by agent">
        <option value="">All agents</option>
        <option value="unassigned">Unassigned</option>
        {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </FilterSelect>

      <FilterSelect value={dateRange} onChange={(v) => onFilterChange('dateRange', v)} ariaLabel="Filter by date range">
        {Object.values(TicketDateRange).map((d) => <option key={d} value={d}>{dateRangeLabel[d]}</option>)}
      </FilterSelect>

      {activeFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          Clear filters
        </button>
      )}
    </div>
  );
}
