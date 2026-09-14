import { RESPONSE_STATUS_LABELS, type ResponseStatus } from '@/lib/admin/guest-rows';
import { cn } from '@/lib/utils';

const STYLES: Record<ResponseStatus, string> = {
  attending: 'bg-success text-success-foreground',
  declined: 'bg-foreground text-background',
  awaiting: 'border border-border text-muted-foreground',
};

export function StatusBadge({ status }: { status: ResponseStatus }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-sm font-semibold whitespace-nowrap', STYLES[status])}>
      {RESPONSE_STATUS_LABELS[status]}
    </span>
  );
}
