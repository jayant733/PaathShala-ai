import { useLayoutEffect, useRef } from 'react';
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

      <div className="relative">
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
