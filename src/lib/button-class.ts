import type { VariantProps } from 'class-variance-authority';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Button classes for an <a> or <Link>, with overrides that actually win.
 *
 * buttonVariants() is cva, which concatenates rather than merges: passing className straight to
 * it leaves both `text-sm` and `text-base` on the element and lets CSS source order decide the
 * winner, which is the base every time. That silently shrank button text to 14px and, through
 * `whitespace-nowrap`, stopped labels wrapping on narrow phones. Running the result through cn()
 * lets tailwind-merge resolve each conflict in the caller's favour.
 *
 * The <Button> component already does this internally; this is for the link-shaped cases.
 */
export function buttonClass({
  className,
  ...variants
}: VariantProps<typeof buttonVariants> & { className?: string }): string {
  return cn(buttonVariants(variants), className);
}
