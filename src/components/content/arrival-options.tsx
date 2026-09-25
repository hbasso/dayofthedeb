import type { ReactNode } from 'react';
import { Tbd } from '@/components/content/tbd';
import { WayfindingSteps } from '@/components/content/wayfinding-steps';
import { directionsConfig } from '@/config/directions';

function Option({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-xl border border-border bg-card">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-lg font-semibold [&::-webkit-details-marker]:hidden focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-hidden">
        {title}
        <span aria-hidden className="text-2xl text-muted-foreground transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="space-y-3 px-4 pb-4 text-base">{children}</div>
    </details>
  );
}

export function ArrivalOptions() {
  const { valet, walking, accessibility } = directionsConfig;
  const valetStatus = valet.available === null ? null : valet.available ? 'Valet is available.' : 'Valet is not offered.';

  return (
    <section aria-labelledby="arrival-heading" className="space-y-4">
      <h2 id="arrival-heading" className="font-display text-3xl">
        More arrival details
      </h2>
      <div className="space-y-3">
        <Option title="Walking from the drop-off">
          <WayfindingSteps steps={walking.steps} placeholder="Step-by-step walking directions coming soon." />
          {walking.note && <p>{walking.note}</p>}
        </Option>
        <Option title="Step-free and elevator route">
          <WayfindingSteps steps={accessibility.stepFreeRoute} placeholder="Step-free route coming soon." />
          {accessibility.note && <p>{accessibility.note}</p>}
        </Option>
        <Option title="Valet">
          <p>
            <Tbd value={valetStatus} />
          </p>
          {valet.details && <p>{valet.details}</p>}
        </Option>
      </div>
    </section>
  );
}
