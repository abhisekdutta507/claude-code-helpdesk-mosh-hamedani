import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTicket,
  fetchAgents,
  fetchReplies,
  assignAgent,
  updateTicket,
  postReply,
  type TicketDetail,
  type Reply,
  type Agent,
} from '@/api/tickets';

export type { TicketDetail, Reply, Agent };

export function useTicketDetail(id: string | undefined) {
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState('');
  const threadEndRef = useRef<HTMLDivElement>(null);

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

  const { data: replies = [], isPending: repliesPending } = useQuery({
    queryKey: ['replies', id],
    queryFn: () => fetchReplies(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const { mutate: assign, isPending: isAssigning } = useMutation({
    mutationFn: (agentId: string | null) => assignAgent(id!, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: (data: { status?: string; category?: string | null }) => updateTicket(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const { mutate: submitReply, isPending: isSubmitting } = useMutation({
    mutationFn: (body: string) => postReply(id!, body),
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['replies', id] });
    },
  });

  useEffect(() => {
    if (!repliesPending) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [replies.length, repliesPending]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed) return;
    submitReply(trimmed);
  }

  return {
    ticket,
    isPending,
    isError,
    agents,
    replies,
    repliesPending,
    isAssigning,
    isUpdating,
    isSubmitting,
    replyText,
    setReplyText,
    threadEndRef,
    assign,
    update,
    handleSubmit,
  };
}
