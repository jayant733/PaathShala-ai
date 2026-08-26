import { useLayoutEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SocialCards, { type CardItem } from '../ui/card-fan-carousel';
import { SectionHeading } from '../ui/SectionHeading';
import { Reveal } from '../ui/Reveal';
import { Aurora } from '../ui/Aurora';

gsap.registerPlugin(ScrollTrigger);

/**
 * "Structured answers" showcase. Fans out seven of the real answer types the
 * tutor can produce (architecture, concept, code, comparison, learning,
 * roadmap, debugging) using the GSAP card-fan-carousel — the one UI component
 * the app shipped but never wired up. A scrubbed ScrollTrigger parallax keeps
 * the section alive while scrolling.
 */

type AnswerTileProps = {
  icon: string;
  type: string;
  title: string;
  desc: string;
};

function PreviewFrame({ children }: { children: ReactNode }) { return <div className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest/80 p-3 shadow-[0_12px_28px_-22px_rgba(11,79,61,0.4)]">{children}</div>; }
function AnswerPreview({ type }: Pick<AnswerTileProps, 'type'>) {
  if (type === 'architecture') return <PreviewFrame><div className="flex items-center justify-between gap-1.5 text-[9px] font-mono text-primary">{['Question', 'Route', 'Answer'].map((label, index) => <div key={label} className="contents"><span className="rounded-md bg-primary/10 px-2 py-1.5 text-center">{label}</span>{index < 2 && <span className="material-symbols-outlined text-[13px] text-tertiary">arrow_forward</span>}</div>)}</div><div className="mt-2 flex items-center gap-1.5"><span className="h-1.5 flex-1 rounded-full bg-primary/20" /><span className="h-1.5 w-2/5 rounded-full bg-tertiary/35" /><span className="h-1.5 w-1/5 rounded-full bg-secondary/40" /></div></PreviewFrame>;
  if (type === 'concept') return <PreviewFrame><p className="text-[11px] font-semibold text-on-surface">Vector search, simply</p><p className="mt-1 text-[9px] leading-relaxed text-on-surface-variant">Finds ideas by meaning, not only the words they share.</p><div className="mt-3 flex gap-1.5"><span className="rounded-full bg-primary/10 px-2 py-1 text-[8px] font-medium text-primary">meaning</span><span className="rounded-full bg-tertiary-container px-2 py-1 text-[8px] font-medium text-on-tertiary-container">similarity</span></div></PreviewFrame>;
  if (type === 'code') return <PreviewFrame><div className="flex items-center gap-1.5 border-b border-outline-variant/25 pb-2 text-[8px] font-mono text-on-surface-variant"><span className="h-2 w-2 rounded-full bg-secondary/60" /><span className="h-2 w-2 rounded-full bg-primary/50" /><span>route.ts</span></div><pre className="mt-2 overflow-hidden text-[8px] leading-[1.8] font-mono text-on-surface"><code><span className="text-tertiary">const</span> lesson = <span className="text-primary">await</span>{'\n'}  tutor.<span className="text-secondary">explain</span>(topic);</code></pre></PreviewFrame>;
  if (type === 'comparison') return <PreviewFrame><div className="grid grid-cols-[1.1fr_1fr_1fr] gap-px overflow-hidden rounded-lg bg-outline-variant/30 text-[8px]">{['', 'React', 'Next.js', 'Routing', 'Client', 'File-based', 'Rendering', 'Client', 'Hybrid'].map((cell, index) => <span key={`${cell}-${index}`} className={`bg-surface-container-lowest px-1.5 py-1.5 ${index < 3 ? 'font-semibold text-primary' : 'text-on-surface-variant'}`}>{cell}</span>)}</div></PreviewFrame>;
  if (type === 'learning') return <PreviewFrame><p className="text-[10px] font-semibold text-on-surface">Understand React state</p><div className="mt-2 space-y-2">{['See the mental model', 'Try a small example', 'Check your understanding'].map((step, index) => <div key={step} className="flex items-center gap-2 text-[8px] text-on-surface-variant"><span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[8px] font-bold text-primary">{index + 1}</span>{step}</div>)}</div></PreviewFrame>;
  if (type === 'roadmap') return <PreviewFrame><div className="flex items-center justify-between text-[8px] font-medium"><span className="text-primary">Frontend foundations</span><span className="text-on-surface-variant">4 weeks</span></div><div className="mt-3 grid grid-cols-4 gap-1">{['HTML', 'CSS', 'React', 'Build'].map((week, index) => <div key={week} className="space-y-1"><span className={`block h-7 rounded-md ${index < 3 ? 'bg-primary/15' : 'bg-tertiary/20'}`} /><span className="block text-center text-[7px] text-on-surface-variant">{week}</span></div>)}</div></PreviewFrame>;
  return <PreviewFrame><div className="flex items-center justify-between text-[9px] font-mono"><span className="text-error">TypeError</span><span className="text-on-surface-variant">line 24</span></div><div className="mt-2 rounded-lg bg-error/8 px-2 py-1.5 text-[8px] text-on-surface-variant">Cannot read properties of undefined</div><div className="mt-2 flex items-center gap-1.5 text-[8px] font-medium text-primary"><span className="material-symbols-outlined text-[12px]">check_circle</span> Trace the missing value</div></PreviewFrame>;
}

function AnswerTile({ icon, type, title, desc }: AnswerTileProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-surface-container-low flex flex-col justify-between p-5 md:p-6">
      <div className="absolute inset-0 grid-backdrop opacity-50" aria-hidden="true" />
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-primary-fixed/20 blur-3xl" aria-hidden="true" />

      <div className="relative flex items-center justify-between">
        <span className="w-10 h-10 rounded-xl bg-primary-container/25 border border-primary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{type}</span>
      </div>

      <div className="relative mt-5 mb-auto"><AnswerPreview type={type} /></div>
      <div className="relative mt-5">
        <h4 className="text-headline-md text-on-surface leading-snug">{title}</h4>
        <p className="text-label-sm text-on-surface-variant mt-2 leading-snug">{desc}</p>
      </div>
    </div>
  );
}

const ANSWER_TYPES: AnswerTileProps[] = [
  { icon: 'account_tree', type: 'architecture', title: 'Architecture & pipelines', desc: 'Ask how a system works — get an interactive Mermaid diagram.' },
  { icon: 'lightbulb', type: 'concept', title: 'What is…?', desc: 'Definitions and how-it-works built on what you already know.' },
  { icon: 'code', type: 'code', title: 'Code walkthroughs', desc: 'Explain any snippet — highlighted, line by line.' },
  { icon: 'compare_arrows', type: 'comparison', title: 'A vs B', desc: 'Side-by-side tables — like React vs Next.js.' },
  { icon: 'school', type: 'learning', title: 'Teach me a topic', desc: 'Lessons with steps, notes and suggested actions.' },
  { icon: 'map', type: 'roadmap', title: 'Roadmaps', desc: 'Week-by-week plans to reach a goal.' },
  { icon: 'bug_report', type: 'debugging', title: 'Debugging', desc: 'Guided error triage for whatever broke.' },
];

const CARDS: CardItem[] = ANSWER_TYPES.map((t) => ({ visual: <AnswerTile {...t} /> }));

export default function AnswerTypeFan() {
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (innerRef.current) {
        gsap.fromTo(
          innerRef.current,
          { yPercent: 5 },
          {
            yPercent: -5,
            ease: 'none',
            scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: 1 },
          },
        );
      }
      if (ringRef.current) {
        gsap.to(ringRef.current, {
          rotation: 160,
          ease: 'none',
          scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: 1 },
        });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="answers" ref={sectionRef} className="relative w-full px-5 lg:px-10 py-20 lg:py-28 scroll-mt-24 overflow-hidden">
      <Aurora
        className="z-0"
        blobs={[
          { color: 'var(--color-primary-fixed)', size: 520, top: '4%', left: '-10%', opacity: 0.22, duration: 30 },
          { color: 'var(--color-tertiary-fixed)', size: 460, bottom: '-12%', right: '-8%', opacity: 0.2, duration: 34 },
        ]}
      />

      <div ref={innerRef} className="relative z-10 max-w-[1280px] mx-auto">
        <SectionHeading
          eyebrow="Structured answers"
          title="Answers that look like lessons"
          subtitle="When a question fits, the tutor opens with a structured envelope and renders it as a visual card — diagrams, comparisons, roadmaps — then writes the full explanation below."
        />

        <div className="relative mt-6">
          <div
            ref={ringRef}
            className="absolute left-1/2 top-[55%] w-[38rem] h-[38rem] lg:w-[52rem] lg:h-[52rem] rounded-full border border-dashed border-primary/15 pointer-events-none -ml-[19rem] -mt-[19rem] lg:-ml-[26rem] lg:-mt-[26rem]"
            aria-hidden="true"
          />
          <SocialCards cards={CARDS} />
        </div>

        <Reveal>
          <p className="text-center text-label-sm text-on-surface-variant mt-2">
            …plus research, system design and tutorials — 10 structured types in total, rendered live from the model's envelope.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
