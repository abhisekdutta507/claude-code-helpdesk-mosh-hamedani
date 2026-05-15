import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTicket,
  fetchAgents,
  fetchReplies,
  assignAgent,
  updateTicket,
  postReply,
  polishReply,
} from '@/api/tickets';

export function useTicketDetail(id: string | undefined) {
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState('');
  const [polishedText, setPolishedText] = useState<string | null>(null);
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

  const { mutate: polish, isPending: isPolishing } = useMutation({
    mutationFn: (body: string) => polishReply(id!, body),
    onSuccess: (text) => setPolishedText(text),
  });

  function handlePolish() {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    polish(trimmed);
  }

  function acceptPolished() {
    if (polishedText) setReplyText(polishedText);
    setPolishedText(null);
  }

  function discardPolished() {
    setPolishedText(null);
  }

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
    isPolishing,
    polishedText,
    handlePolish,
    acceptPolished,
    discardPolished,
  };
}
