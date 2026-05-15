import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

type SortableHeaderProps = {
  label: string;
  sorted: false | 'asc' | 'desc';
  onToggle?: ((event: unknown) => void) | undefined;
};

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ArrowUp className="ml-1 inline h-3 w-3" />;
  if (sorted === 'desc') return <ArrowDown className="ml-1 inline h-3 w-3" />;
  return <ArrowUpDown className="ml-1 inline h-3 w-3 text-muted-foreground" />;
}

export function SortableHeader({ label, sorted, onToggle }: SortableHeaderProps) {
  return (
    <button className="flex cursor-pointer items-center font-medium" onClick={(e) => onToggle?.(e)}>
      {label} <SortIcon sorted={sorted} />
    </button>
  );
}
