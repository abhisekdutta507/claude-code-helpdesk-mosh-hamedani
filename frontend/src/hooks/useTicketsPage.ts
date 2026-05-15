import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type SortingState } from '@tanstack/react-table';
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
import { fetchTickets, fetchAgents } from '@/api/tickets';

const sortByValues = new Set(Object.values(TicketSortBy));
const sortDirValues = new Set(Object.values(TicketSortDir));
const statusValues = new Set(Object.values(TicketStatus));
const categoryValues = new Set(Object.values(TicketCategory));
const dateRangeValues = new Set(Object.values(TicketDateRange));

export function buildPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
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

function useSearchParamsInput(urlValue: string): [string, (v: string) => void] {
  const [local, setLocal] = useState(urlValue);
  useEffect(() => { setLocal(urlValue); }, [urlValue]);
  return [local, setLocal];
}

export function useTicketsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

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

  const [searchInput, setSearchInput] = useSearchParamsInput(search);

  const { data, isPending, isError } = useQuery({
    queryKey: ['tickets', sortBy, sortDir, page, status, category, agentId, dateRange, search],
    queryFn: () => fetchTickets(sortBy, sortDir, page, status, category, agentId, dateRange, search),
    staleTime: 60_000,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
    staleTime: 5 * 60_000,
  });

  const tickets = data?.tickets ?? [];
  const total = data?.total ?? 0;

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
      if (prev.get('sortBy')) next.set('sortBy', prev.get('sortBy')!);
      if (prev.get('sortDir')) next.set('sortDir', prev.get('sortDir')!);
      return next;
    }, { replace: false });
  }

  const sorting: SortingState = [{ id: sortBy, desc: sortDir === TicketSortDir.DESC }];

  function onSortingChange(updater: ((prev: SortingState) => SortingState) | SortingState) {
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
  }

  const activeFilters = status !== '' || category !== '' || agentId !== '' ||
    dateRange !== TicketDateRange.ALL_TIME || search !== '';

  return {
    sortBy,
    sortDir,
    page,
    status,
    category,
    agentId,
    dateRange,
    search,
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
  };
}
