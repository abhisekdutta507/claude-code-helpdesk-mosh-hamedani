import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Props = {
  originalText: string;
  polishedText: string;
  onAccept: () => void;
  onDiscard: () => void;
};

export function PolishPreviewModal({ originalText, polishedText, onAccept, onDiscard }: Props) {
  return (
    <Dialog open={true}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-2xl"
        onOpenChange={(open) => { if (!open) onDiscard(); }}
      >
        <DialogHeader>
          <DialogTitle>Polish preview</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Original</p>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed min-h-[8rem]">
              {originalText}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Polished</p>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed min-h-[8rem]">
              {polishedText}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onDiscard}>
            Discard
          </Button>
          <Button size="sm" onClick={onAccept}>
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
