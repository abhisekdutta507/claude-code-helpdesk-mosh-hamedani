import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type Props = {
  summary: string | null | undefined;
  isPending: boolean;
};

export function TicketSummaryCard({ summary, isPending }: Props) {
  if (!isPending && !summary) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">AI Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{summary}</p>
        )}
      </CardContent>
    </Card>
  );
}
