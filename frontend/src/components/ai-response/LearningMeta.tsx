import { Signal, CheckCircle2, TrendingUp } from 'lucide-react';
import type { Presentation } from './types';

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  intermediate: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  advanced: 'text-rose-400 border-rose-400/30 bg-rose-400/10',
};

function ChipRow({
  icon,
  label,
  items,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
  color?: string;
}) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
      <span className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
        {icon} {label}
      </span>
      {items.map((item) => (
        <span
          key={item}
          className={`font-label-sm text-label-sm px-2 py-0.5 rounded-md border border-surface-container-highest/40 bg-surface-container-high/40 text-on-surface ${color ?? ''}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

/** Difficulty badge + prerequisite / next-topic chips for a presentation. */
export default function LearningMeta({ p }: { p: Presentation }) {
  const hasMeta = p.difficulty || p.prerequisites?.length || p.nextTopics?.length;
  if (!hasMeta) return null;

  const difficulty = String(p.difficulty ?? '').toLowerCase();

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 pb-1">
      {difficulty && (
        <span
          className={`inline-flex items-center gap-1.5 font-label-sm text-label-sm px-2.5 py-1 rounded-full border ${
            DIFFICULTY_STYLES[difficulty] ?? 'text-on-surface-variant border-outline-variant/30 bg-surface-container-high/40'
          } capitalize`}
        >
          <Signal className="w-3.5 h-3.5" /> {difficulty}
        </span>
      )}

      <ChipRow
        icon={<CheckCircle2 className="w-3.5 h-3.5 text-secondary" />}
        label="You'll need:"
        items={p.prerequisites ?? []}
      />

      <ChipRow
        icon={<TrendingUp className="w-3.5 h-3.5 text-tertiary" />}
        label="Next up:"
        items={p.nextTopics ?? []}
      />
    </div>
  );
}
