import { Route } from 'lucide-react';
import type { PresentationStep } from './types';

/** Animated vertical timeline for ordered steps / data-flow. */
export default function TimelineSteps({ steps }: { steps: PresentationStep[] }) {
  if (!steps?.length) return null;
  return (
    <div>
      <h4 className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant flex items-center gap-2 mb-4">
        <Route className="w-4 h-4 text-tertiary" /> How it flows
      </h4>
      <ol className="relative space-y-0">
        <span
          aria-hidden
          className="absolute left-[13px] top-2 bottom-2 w-px bg-gradient-to-b from-primary via-tertiary to-transparent"
        />
        {steps.map((step, i) => (
          <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
            <div className="relative z-10 flex-shrink-0 w-7 h-7 rounded-full bg-surface-container-highest border border-surface-container-highest flex items-center justify-center">
              <span className="font-label-sm text-label-sm text-primary font-bold">{i + 1}</span>
            </div>
            <div className="pt-0.5">
              <p className="font-label-md text-label-md text-on-surface font-semibold">{step.title}</p>
              {step.description && (
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-relaxed">{step.description}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
