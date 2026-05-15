import DOMPurify from 'dompurify';
import { Send, Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { type Reply } from '@/api/tickets';
import { PolishPreviewModal } from './PolishPreviewModal';

type Props = {
  replies: Reply[];
  repliesPending: boolean;
  isSubmitting: boolean;
  isPolishing: boolean;
  replyText: string;
  polishedText: string | null;
  threadEndRef: React.RefObject<HTMLDivElement | null>;
  onReplyChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onPolish: () => void;
  onAcceptPolished: () => void;
  onDiscardPolished: () => void;
};

export function TicketRepliesCard({
  replies,
  repliesPending,
  isSubmitting,
  isPolishing,
  replyText,
  polishedText,
  threadEndRef,
  onReplyChange,
  onSubmit,
  onPolish,
  onAcceptPolished,
  onDiscardPolished,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Replies{!repliesPending && replies.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">({replies.length})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {repliesPending ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : replies.length === 0 ? (
          <p className="text-sm text-muted-foreground">No replies yet.</p>
        ) : (
          <div className="space-y-3">
            {replies.map((reply) => (
              <div key={reply.id} className="rounded-lg border bg-muted/30 px-4 py-3">
                <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {reply.author ? reply.author.name : (reply.fromEmail ?? 'Customer')}
                  </span>
                  <span>·</span>
                  <span>{new Date(reply.createdAt).toLocaleString()}</span>
                </div>
                {reply.bodyHtml ? (
                  <div
                    className="prose prose-sm max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.bodyHtml) }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{reply.body}</p>
                )}
              </div>
            ))}
            <div ref={threadEndRef} />
          </div>
        )}

        {polishedText !== null && (
          <PolishPreviewModal
            originalText={replyText}
            polishedText={polishedText}
            onAccept={onAcceptPolished}
            onDiscard={onDiscardPolished}
          />
        )}
        <form onSubmit={onSubmit} className="mt-4 space-y-2">
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            rows={4}
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => onReplyChange(e.target.value)}
            disabled={isSubmitting || isPolishing}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPolishing || isSubmitting || !replyText.trim()}
              onClick={onPolish}
            >
              <Wand2 className="mr-1.5 h-3.5 w-3.5" />
              {isPolishing ? 'Polishing…' : 'Polish'}
            </Button>
            <Button type="submit" disabled={isSubmitting || isPolishing || !replyText.trim()} size="sm">
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {isSubmitting ? 'Sending…' : 'Send reply'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
