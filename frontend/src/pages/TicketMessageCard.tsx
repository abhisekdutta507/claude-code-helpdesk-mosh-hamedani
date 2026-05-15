import DOMPurify from 'dompurify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type Props = {
  body: string | undefined;
  bodyHtml: string | null | undefined;
  isPending: boolean;
};

export function TicketMessageCard({ body, bodyHtml, isPending }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Message</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : bodyHtml ? (
          <div
            className="prose prose-sm max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bodyHtml) }}
          />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{body}</pre>
        )}
      </CardContent>
    </Card>
  );
}
