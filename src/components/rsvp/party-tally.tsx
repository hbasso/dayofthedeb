export function PartyTally({ count }: { count: number }) {
  return (
    <p aria-live="polite" className="text-center text-lg">
      <span className="font-display text-4xl text-primary">{count}</span>{' '}
      {count === 1 ? 'person' : 'people'} from your party attending
    </p>
  );
}
