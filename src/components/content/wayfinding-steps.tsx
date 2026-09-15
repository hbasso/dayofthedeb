export function WayfindingSteps({ steps, placeholder }: { steps: string[]; placeholder: string }) {
  if (steps.length === 0) {
    return <p className="text-base text-muted-foreground italic">{placeholder}</p>;
  }
  return (
    <ol className="list-decimal space-y-2 pl-6 text-base marker:font-semibold marker:text-primary">
      {steps.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  );
}
