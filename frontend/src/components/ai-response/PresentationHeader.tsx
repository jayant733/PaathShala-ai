import { useMemo } from 'react';
import {
  Clock,
  Signal,
  CheckCircle2,
  TrendingUp,
  Tags,
  Boxes,
  BookOpen,
  Code2,
  Columns3,
  GraduationCap,
  Map,
  FlaskConical,
  Compass,
  Bug,
  Sparkles,
} from 'lucide-react';
import type { AnswerType, Presentation } from './types';

const TYPE_META: Record<AnswerType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  architecture: { label: 'System Architecture', icon: Boxes },
  system_design: { label: 'System Design', icon: Boxes },
  concept: { label: 'Concept', icon: BookOpen },
  code: { label: 'Code Walkthrough', icon: Code2 },
  comparison: { label: 'Comparison', icon: Columns3 },
  learning: { label: 'Learning Path', icon: GraduationCap },
  tutorial: { label: 'Tutorial', icon: Compass },
  research: { label: 'Research', icon: FlaskConical },
  roadmap: { label: 'Roadmap', icon: Map },
  debugging: { label: 'Debugging', icon: Bug },
  default: { label: 'Lesson', icon: Sparkles },
};

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  intermediate: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  advanced: 'text-rose-400 border-rose-400/30 bg-rose-400/10',
};

/** Estimate reading time (minutes) from all the prose in a presentation. */
function readingMinutes(p: Presentation): number {
  const words = [
    p.summary || '',
    p.markdown || '',
    ...(p.sections ?? []).map((s) => `${s.title} ${s.content}`),
    ...(p.cards ?? []).map((c) => `${c.title} ${c.description}`),
    ...(p.steps ?? []).map((s) => `${s.title} ${s.description}`),
  ]
    .join(' ')
    .trim();
  const count = words.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(count / 180));
}

function Badge({
  icon,
  children,
  className = '',
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-label-sm text-label-sm px-2.5 py-1 rounded-full border ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}

/** Premium hero header: type badge, difficulty, reading time, tags + prereqs. */
export default function PresentationHeader({ p }: { p: Presentation }) {
  const meta = TYPE_META[p.answerType] ?? TYPE_META.default;
  const Icon = meta.icon;
  const minutes = useMemo(() => readingMinutes(p), [p]);
  const difficulty = String(p.difficulty ?? '').toLowerCase();
  const tags = (p.concepts?.length ? p.concepts : p.tech) ?? [];
  const hasExtra = p.prerequisites?.length || p.nextTopics?.length;

  return (
    <div className="relative overflow-hidden rounded-2xl glass-strong p-5">
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-tertiary/20 blur-3xl pointer-events-none" />

      {/* Type / difficulty / reading time */}
      <div className="relative flex flex-wrap items-center gap-2">
        <Badge icon={<Icon className="w-3.5 h-3.5 text-primary" />} className="border-primary/30 bg-primary/10 text-primary">
          {meta.label}
        </Badge>
        {difficulty && (
          <Badge
            icon={<Signal className="w-3.5 h-3.5" />}
            className={`capitalize ${DIFFICULTY_STYLES[difficulty] ?? 'text-on-surface-variant border-outline-variant/30 bg-surface-container-high/40'}`}
          >
            {difficulty}
          </Badge>
        )}
        <Badge icon={<Clock className="w-3.5 h-3.5 text-on-surface-variant" />} className="text-on-surface-variant border-outline-variant/20 bg-surface-container-high/30">
          {minutes} min read
        </Badge>
      </div>

      {/* Title */}
      {p.title && (
        <h2 className="relative mt-3 font-display font-title-lg text-title-lg text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-tertiary leading-tight">
          {p.title}
        </h2>
      )}

      {/* Topic tags */}
      {tags.length > 0 && (
        <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
          <Tags className="w-3.5 h-3.5 text-on-surface-variant/70" />
          {tags.map((tag) => (
            <span
              key={tag}
              className="font-label-sm text-label-sm px-2 py-0.5 rounded-md border border-surface-container-highest/40 bg-surface-container-high/40 text-on-surface"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Summary */}
      {p.summary && (
        <p className="relative mt-3 font-body-md text-body-md text-on-surface-variant leading-relaxed max-w-3xl">{p.summary}</p>
      )}

      {/* Prerequisites + next topics */}
      {hasExtra && (
        <div className="relative mt-3 space-y-1.5">
          {p.prerequisites?.length ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
                <CheckCircle2 className="w-3.5 h-3.5 text-secondary" /> Prerequisites:
              </span>
              {p.prerequisites.map((item) => (
                <span
                  key={item}
                  className="font-label-sm text-label-sm px-2 py-0.5 rounded-md border border-surface-container-highest/40 bg-surface-container-high/40 text-on-surface"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}
          {p.nextTopics?.length ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
                <TrendingUp className="w-3.5 h-3.5 text-tertiary" /> Next up:
              </span>
              {p.nextTopics.map((item) => (
                <span
                  key={item}
                  className="font-label-sm text-label-sm px-2 py-0.5 rounded-md border border-primary/20 bg-primary/10 text-primary"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
