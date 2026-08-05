import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

/**
 * Decorative hero visual — a miniature of the real AI Tutor conversation:
 * a question is asked, the tutor "streams" a %%%PAATHSHALA:{type}%%% envelope,
 * and it assembles into a compact concept card (the same fields the real
 * renderer shows: difficulty, concepts, steps, next topics).
 *
 * Purely presentational and loops forever. Settles on the final card and
 * stops animating when prefers-reduced-motion is set.
 */

type EnvelopeLine = { text: string; className?: string };

const ENVELOPE: EnvelopeLine[] = [
  { text: '%%%PAATHSHALA:concept%%%', className: 'text-primary-fixed' },
  { text: '{', className: 'text-on-surface-variant' },
  { text: '  "title": "Retrieval-Augmented Generation",', className: 'text-on-surface/75' },
  { text: '  "difficulty": "intermediate",', className: 'text-on-surface/75' },
  { text: '  "concepts": ["Embeddings", "Vector search", "Context grounding"],', className: 'text-on-surface/75' },
  { text: '  "steps": [', className: 'text-on-surface/75' },
  { text: '    { "title": "Index your documents" },', className: 'text-on-surface/55' },
  { text: '    { "title": "Embed every chunk" },', className: 'text-on-surface/55' },
  { text: '    { "title": "Search by similarity" }', className: 'text-on-surface/55' },
  { text: '  ]', className: 'text-on-surface/75' },
  { text: '}', className: 'text-on-surface-variant' },
  { text: '%%%END%%%', className: 'text-primary-fixed' },
];

const CONCEPTS = ['Embeddings', 'Vector search', 'Context grounding'];
const STEPS = ['Index your documents', 'Embed every chunk', 'Search by similarity'];
const NEXT = ['Chunking strategies', 'Reranking'];

const DURATIONS = { user: 1500, thinking: 1200, line: 300, settle: 600, hold: 5200 };

type Stage = 'user' | 'thinking' | 'typing' | 'card';

const EASE = [0.16, 1, 0.3, 1] as const;

function ThinkingDots() {
  return (
    <div className="w-fit flex items-center gap-1.5 px-3.5 py-3 rounded-2xl rounded-tl-sm bg-surface-container-high mb-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-on-surface-variant"
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.16 }}
        />
      ))}
    </div>
  );
}

function ConceptCard() {
  return (
    <motion.div
      key="card"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 p-3.5 space-y-3"
    >
      <div className="flex items-center gap-1.5">
        <span className="px-2 py-0.5 rounded-full bg-tertiary-container/25 text-tertiary text-[9px] font-mono uppercase tracking-wider">
          concept
        </span>
        <span className="px-2 py-0.5 rounded-full glass text-on-surface-variant text-[9px] font-mono uppercase tracking-wider">
          intermediate
        </span>
      </div>

      <div>
        <h4 className="text-headline-md text-on-surface leading-tight">Retrieval-Augmented Generation</h4>
        <p className="text-label-sm text-on-surface-variant mt-1">Ground LLM answers in your own documents.</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CONCEPTS.map((c) => (
          <span key={c} className="px-2 py-0.5 rounded-full bg-primary-fixed/40 text-on-primary-fixed text-[10px] font-mono">
            {c}
          </span>
        ))}
      </div>

      <ol className="space-y-1">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2 text-label-sm text-on-surface">
            <span className="w-4 h-4 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-mono">
              {i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>

      <div className="pt-2.5 border-t border-outline-variant/30">
        <p className="text-[9px] uppercase tracking-[0.18em] text-on-surface-variant mb-1.5">Next up</p>
        <div className="flex flex-wrap gap-1.5">
          {NEXT.map((n) => (
            <span key={n} className="px-2 py-0.5 rounded-full border border-outline-variant/50 text-on-surface-variant text-[10px] font-mono">
              {n}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function HeroChatMock() {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<Stage>(reduce ? 'card' : 'user');
  const [linesShown, setLinesShown] = useState(reduce ? ENVELOPE.length : 0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const t = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    t(DURATIONS.user, () => setStage('thinking'));
    const typingAt = DURATIONS.user + DURATIONS.thinking;
    t(typingAt, () => setStage('typing'));
    ENVELOPE.forEach((_, i) => {
      t(typingAt + DURATIONS.line * (i + 1), () => setLinesShown(i + 1));
    });
    const cardAt = typingAt + DURATIONS.line * ENVELOPE.length;
    t(cardAt + DURATIONS.settle, () => setStage('card'));
    t(cardAt + DURATIONS.settle + DURATIONS.hold, () => {
      setStage('user');
      setLinesShown(0);
      setRun((r) => r + 1);
    });

    return () => timers.forEach(clearTimeout);
  }, [run, reduce]);

  const statusLabel = stage === 'card' ? 'answered' : stage === 'thinking' ? 'thinking' : 'streaming';

  return (
    <div className="glass-strong rounded-2xl p-4 w-[19rem] sm:w-[21rem] shadow-2xl" aria-hidden="true">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[13px]">neurology</span>
          </div>
          <span className="text-label-md text-on-surface">AI Tutor</span>
        </div>
        <span className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {statusLabel}
        </span>
      </div>

      {/* User message */}
      <div className="flex justify-end mb-3">
        <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-primary text-on-primary px-3.5 py-2 text-label-md">
          Explain how RAG works
        </div>
      </div>

      {stage === 'thinking' && <ThinkingDots />}

      {/* Streaming envelope */}
      <AnimatePresence mode="wait">
        {stage === 'typing' && (
          <motion.div
            key="envelope"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-surface-container-lowest/70 rounded-xl border border-outline-variant/30 p-3 font-mono text-[10px] leading-[1.55] overflow-hidden mb-3"
          >
            {ENVELOPE.slice(0, linesShown).map((l, i) => (
              <div key={i} className={l.className ?? ''}>
                {l.text}
              </div>
            ))}
            <span className="inline-block w-1.5 h-3 bg-primary align-middle animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assembled lesson card */}
      <AnimatePresence mode="wait">
        {stage === 'card' && <ConceptCard />}
      </AnimatePresence>
    </div>
  );
}
