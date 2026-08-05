import { motion } from 'framer-motion';
import { SectionHeading } from '../ui/SectionHeading';
import { Aurora } from '../ui/Aurora';
import { SpotlightCard } from '../ui/SpotlightCard';
import { TiltCard } from '../ui/TiltCard';
import { Reveal, RevealGroup, RevealItem } from '../ui/Reveal';

/**
 * Honest multi-agent planner section. The /agent-chat page really does run a
 * LangGraph supervisor that classifies each message and dispatches to a
 * specialist agent. Research is the one stub, so it's called out as on the
 * roadmap rather than shown as a live agent.
 */

type Agent = { icon: string; name: string; tag: string; desc: string };

const AGENTS: Agent[] = [
  { icon: 'menu_book', name: 'Tutor', tag: 'dispatch → tutor', desc: 'The everyday teacher — grounded in your documents and memory.' },
  { icon: 'map', name: 'Planner', tag: 'dispatch → planner', desc: 'Turns “learn X” into a week-by-week roadmap.' },
  { icon: 'quiz', name: 'Quiz', tag: 'dispatch → quiz', desc: 'Generates practice questions from any topic you have covered.' },
];

const CONNECTORS = [
  { x1: 230, y1: 0, x2: 60, y2: 130 },
  { x1: 230, y1: 0, x2: 230, y2: 130 },
  { x1: 230, y1: 0, x2: 400, y2: 130 },
];

export default function AgentShowcase() {
  return (
    <section id="agents" className="relative w-full px-5 lg:px-10 py-20 lg:py-28 scroll-mt-24 bg-surface-container-low/60">
      <Aurora
        className="z-0"
        blobs={[{ color: 'var(--color-tertiary-fixed)', size: 520, top: '10%', right: '-10%', opacity: 0.2, duration: 32 }]}
      />

      <div className="relative z-10 max-w-[1280px] mx-auto">
        <SectionHeading
          eyebrow="Multi-agent planner"
          title="One message, the right specialist"
          subtitle="A LangGraph supervisor reads each message and dispatches it to a specialist agent — no prompt-engineering required."
        />

        <div className="relative mt-16">
          {/* Animated connectors (desktop only) */}
          <svg
            className="hidden lg:block absolute left-1/2 top-5 -translate-x-1/2 w-[46rem] h-[12rem] text-primary/40 pointer-events-none"
            viewBox="0 0 460 120"
            fill="none"
            aria-hidden="true"
          >
            {CONNECTORS.map((c, i) => (
              <motion.line
                key={i}
                x1={c.x1}
                y1={c.y1}
                x2={c.x2}
                y2={c.y2}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="3 5"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.9, delay: 0.3, ease: 'easeInOut' }}
              />
            ))}
          </svg>

          {/* Supervisor */}
          <div className="flex justify-center">
            <Reveal>
              <TiltCard className="glass-strong rounded-2xl px-8 py-5 flex items-center gap-4 max-w-md" maxTilt={6}>
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-md shadow-primary/25">
                  <span className="material-symbols-outlined text-on-primary text-[24px]">account_tree</span>
                </div>
                <div>
                  <h3 className="text-headline-md text-on-surface">Supervisor</h3>
                  <p className="text-label-sm text-on-surface-variant">LangGraph · classifies each message → dispatches to a specialist</p>
                </div>
              </TiltCard>
            </Reveal>
          </div>

          {/* Specialist agents */}
          <RevealGroup className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
            {AGENTS.map((a, i) => (
              <RevealItem key={a.name}>
                <SpotlightCard className="h-full p-7 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-primary-container/25 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px] text-primary">{a.icon}</span>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">agent 0{i + 1}</span>
                  </div>
                  <div>
                    <h4 className="text-headline-md text-on-surface">{a.name}</h4>
                    <p className="text-body-md text-on-surface-variant mt-1.5">{a.desc}</p>
                  </div>
                  <p className="mt-auto font-mono text-[11px] text-primary">{a.tag}</p>
                </SpotlightCard>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal delay={0.1}>
            <p className="text-center text-label-sm text-on-surface-variant mt-8">
              On the roadmap: a dedicated research agent for live web search.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
