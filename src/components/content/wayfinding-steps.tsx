import { cn } from '@/lib/utils';

/**
 * A numbered route. Numbers earn their place here: these really are steps in order, and a guest
 * reads them while walking. `className` exists so a step list on a filled background can recolor
 * its markers, which would otherwise disappear.
 */
export function WayfindingSteps({
  steps,
  placeholder,
  className,
}: {
  steps: readonly string[];
  placeholder?: string;
  className?: string;
}) {
  if (steps.length === 0) {
    return placeholder ? <p className="text-base text-muted-foreground italic">{placeholder}</p> : null;
  }
  return (
    <ol className={cn('list-decimal space-y-2 pl-6 text-base marker:font-semibold marker:text-primary', className)}>
      {steps.map((step, index) => (
        <li key={`${index}-${step}`}>{step}</li>
      ))}
    </ol>
  );
}
