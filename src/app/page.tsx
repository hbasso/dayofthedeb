import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';

const swatches = ['bg-primary', 'bg-secondary', 'bg-link', 'bg-success', 'bg-turquoise', 'bg-sunny', 'bg-foreground'];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {siteConfig.venue.name} · {siteConfig.venue.city}
      </p>
      <h1 className="font-display text-5xl sm:text-6xl">{siteConfig.name}</h1>
      <p className="text-lg text-muted-foreground">{siteConfig.description}</p>
      <div className="flex gap-2" aria-hidden>
        {swatches.map((swatch) => (
          <span key={swatch} className={`size-8 rounded-full ${swatch}`} />
        ))}
      </div>
      <Button size="lg">RSVP opens soon</Button>
    </main>
  );
}
