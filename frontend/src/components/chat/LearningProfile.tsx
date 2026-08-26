import { useState } from 'react';
import { GraduationCap, ChevronDown, TrendingUp, CheckCircle2, Target } from 'lucide-react';
import { useLearningStore } from '../../store/learningStore';

const CATEGORY_COLORS: Record<string, string> = {
  Architecture: 'bg-primary',
  'System Design': 'bg-primary',
  Concept: 'bg-emerald-400',
  Coding: 'bg-sky-400',
  Comparison: 'bg-violet-400',
  Learning: 'bg-amber-400',
  Tutorial: 'bg-cyan-400',
  Research: 'bg-rose-400',
  Roadmap: 'bg-teal-400',
  Debugging: 'bg-orange-400',
};

const LEVEL_SIZE = 10;

const getLevelInfo = (count: number) => {
  const level = Math.floor(count / LEVEL_SIZE) + 1;
  const progressInLevel = count % LEVEL_SIZE;
  const pct = Math.round((progressInLevel / LEVEL_SIZE) * 100);
  return { level, progress: progressInLevel, pct };
};

/** Sidebar card showing the learner's journey: progress %, completed lessons
 *  (by category) and the recommended next topic. */
export default function LearningProfile() {
  const completed = useLearningStore((s) => s.completed);
  const current = useLearningStore((s) => s.current);
  const recommendedNext = useLearningStore((s) => s.recommendedNext());
  const [open, setOpen] = useState(true);

  if (!current && completed.length === 0) return null;

  const { level, progress, pct } = getLevelInfo(completed.length);
  const next = current?.nextTopics?.[0] ?? recommendedNext;

  return (
    <div className="mx-3 my-3 rounded-xl border border-surface-container-highest/30 bg-surface-container-lowest/60 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="learning-profile-panel"
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-container-high/40 transition-colors"
      >
        <span className="font-label-md text-label-md text-on-surface flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-primary" /> Learning Journey
          <span className="px-1.5 py-0.5 ml-1 rounded-md bg-primary/10 text-primary text-[10px] uppercase font-bold tracking-wider">
            Level {level}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div id="learning-profile-panel" className="px-3 pb-3 space-y-3">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between font-label-sm text-label-sm mb-1">
              <span className="text-on-surface-variant flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-secondary" /> {progress} of {LEVEL_SIZE} to Level {level + 1}
              </span>
              <span className="text-primary font-semibold">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface-container-highest/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary transition-[width] duration-700 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Recommended next */}
          {next && (
            <div className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1.5">
              <p className="font-label-sm text-label-sm text-primary flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Recommended next
              </p>
              <p className="font-label-sm text-label-sm text-on-surface mt-0.5 leading-snug">{next}</p>
            </div>
          )}

          {/* Completed lessons */}
          {completed.length > 0 && (
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Completed ({completed.length})
              </p>
              <ul className="space-y-1">
                {completed.slice(0, 8).map((c) => (
                  <li
                    key={c.ts + c.topic}
                    className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant"
                    title={c.difficulty ? `Difficulty: ${c.difficulty}` : c.topic}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        CATEGORY_COLORS[c.category ?? ''] ?? 'bg-surface-container-highest'
                      }`}
                    />
                    <span className="truncate">{c.topic.length > 22 ? c.topic.slice(0, 21) + '…' : c.topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
