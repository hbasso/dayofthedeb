import type { Metadata } from 'next';
import { LoteriaCard } from '@/components/loteria/loteria-card';
import { galleryPhotos } from '@/config/gallery';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: `Lotería cards · ${siteConfig.name}`,
};

// Design preview only — placeholder lotería-style names for existing gallery
// photos, not event facts. Each example uses a distinct palette to show range.
const examples = [
  {
    photo: galleryPhotos[0],
    number: 1,
    title: 'El Puente',
    subtitle: 'The Bridge',
    palette: { background: '#9FD6F2', accent: '#C2127A' },
    registered: true,
  },
  {
    photo: galleryPhotos[1],
    number: 2,
    title: 'El Paseo',
    subtitle: 'The Walk',
    palette: { background: '#008030', ink: '#FFFCF6', accent: '#F5C400' },
    registered: false,
  },
  {
    photo: galleryPhotos[2],
    number: 3,
    title: 'La Torre',
    subtitle: 'The Tower',
    palette: { background: '#FFF3D6', accent: '#D48000' },
    registered: false,
  },
  {
    photo: galleryPhotos[3],
    number: 4,
    title: 'El Malecón',
    subtitle: 'The Promenade',
    palette: { background: '#1565C0', ink: '#FFFCF6', accent: '#00A6A6' },
    registered: false,
  },
  {
    photo: galleryPhotos[4],
    number: 5,
    title: 'El Horizonte',
    subtitle: 'The Skyline',
    palette: { background: '#00A6A6', accent: '#1565C0' },
    registered: false,
  },
  {
    photo: galleryPhotos[5],
    number: 6,
    title: 'La Orilla',
    subtitle: 'The Waterfront',
    palette: { background: '#1B4332', ink: '#FFFCF6', accent: '#D48000' },
    registered: true,
  },
] as const;

export default function LoteriaPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10 sm:py-16">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-3xl">Lotería cards</h1>
        <p className="mx-auto max-w-prose text-sm text-muted-foreground">
          A design preview of the reusable Lotería card component, shown here with placeholder names against the
          River Walk gallery photos.
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {examples.map((example) => (
          <li key={example.photo.id}>
            <LoteriaCard
              title={example.title}
              subtitle={example.subtitle}
              number={example.number}
              image={{ src: example.photo.src, alt: example.photo.alt }}
              palette={example.palette}
              registered={example.registered}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
