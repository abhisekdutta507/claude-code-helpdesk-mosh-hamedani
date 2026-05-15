import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { useTicketDetail } from '@/hooks/useTicketDetail';
import { TicketMetaCard } from './TicketMetaCard';
import { TicketSummaryCard } from './TicketSummaryCard';
import { TicketMessageCard } from './TicketMessageCard';
import { TicketRepliesCard } from './TicketRepliesCard';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
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
  } = useTicketDetail(id);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link
            to="/tickets"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to tickets
          </Link>
        </div>

        {isError && <p className="text-destructive">Failed to load ticket.</p>}

        {!isError && (
          <div className="space-y-6">
            <TicketMetaCard
              ticket={ticket}
              agents={agents}
              isPending={isPending}
              isUpdating={isUpdating}
              isAssigning={isAssigning}
              onUpdate={update}
              onAssign={assign}
            />
            <TicketSummaryCard
              summary={ticket?.summary}
              isPending={isPending}
            />
            <TicketMessageCard
              body={ticket?.body}
              bodyHtml={ticket?.bodyHtml}
              isPending={isPending}
            />
            <TicketRepliesCard
              replies={replies}
              repliesPending={repliesPending}
              isSubmitting={isSubmitting}
              isPolishing={isPolishing}
              replyText={replyText}
              polishedText={polishedText}
              threadEndRef={threadEndRef}
              onReplyChange={setReplyText}
              onSubmit={handleSubmit}
              onPolish={handlePolish}
              onAcceptPolished={acceptPolished}
              onDiscardPolished={discardPolished}
            />
          </div>
        )}
      </main>
    </div>
  );
}
