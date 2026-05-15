import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TicketCategory, TicketStatus } from '@repo/shared/schemas/ticket';
import { type TicketDetail, type Agent } from '@/api/tickets';

const categoryLabel: Record<string, string> = {
  [TicketCategory.GENERAL_QUESTION]: 'General',
  [TicketCategory.TECHNICAL_QUESTION]: 'Technical',
  [TicketCategory.REFUND_REQUEST]: 'Refund',
};

const selectClass =
  'h-9 w-48 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50';

type Props = {
  ticket: TicketDetail | undefined;
  agents: Agent[];
  isPending: boolean;
  isUpdating: boolean;
  isAssigning: boolean;
  onUpdate: (data: { status?: string; category?: string | null }) => void;
  onAssign: (agentId: string | null) => void;
};

export function TicketMetaCard({ ticket, agents, isPending, isUpdating, isAssigning, onUpdate, onAssign }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl leading-snug">
          {isPending ? <Skeleton className="h-6 w-96" /> : ticket!.subject}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="mb-1 font-medium text-muted-foreground">From</dt>
            <dd>{isPending ? <Skeleton className="h-4 w-48" /> : ticket!.fromEmail}</dd>
          </div>
          <div>
            <dt className="mb-1 font-medium text-muted-foreground">Created</dt>
            <dd>
              {isPending ? (
                <Skeleton className="h-4 w-40" />
              ) : (
                new Date(ticket!.createdAt).toLocaleString()
              )}
            </dd>
          </div>
          <div>
            <dt className="mb-1 font-medium text-muted-foreground">Status</dt>
            <dd>
              {isPending ? (
                <Skeleton className="h-9 w-36" />
              ) : (
                <select
                  className={selectClass}
                  value={ticket!.status}
                  disabled={isUpdating}
                  onChange={(e) => onUpdate({ status: e.target.value })}
                  aria-label="Ticket status"
                >
                  {Object.values(TicketStatus).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </dd>
          </div>
          <div>
            <dt className="mb-1 font-medium text-muted-foreground">Category</dt>
            <dd>
              {isPending ? (
                <Skeleton className="h-9 w-36" />
              ) : (
                <select
                  className={selectClass}
                  value={ticket!.category ?? ''}
                  disabled={isUpdating}
                  onChange={(e) => onUpdate({ category: e.target.value === '' ? null : e.target.value })}
                  aria-label="Ticket category"
                >
                  <option value="">Uncategorised</option>
                  {Object.entries(categoryLabel).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              )}
            </dd>
          </div>
          <div>
            <dt className="mb-1 font-medium text-muted-foreground">Assigned agent</dt>
            <dd>
              {isPending ? (
                <Skeleton className="h-9 w-36" />
              ) : (
                <select
                  className={selectClass}
                  value={ticket!.agent?.id ?? ''}
                  disabled={isAssigning}
                  onChange={(e) => onAssign(e.target.value === '' ? null : e.target.value)}
                  aria-label="Assign agent"
                >
                  <option value="">Unassigned</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              )}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
