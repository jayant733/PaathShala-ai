import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SectionHeading } from '../ui/SectionHeading';
import { Aurora } from '../ui/Aurora';
import { Magnetic } from '../ui/Magnetic';
import { Reveal, RevealGroup, RevealItem } from '../ui/Reveal';

/**
 * Honest model-routing section. No invented latency or benchmark claims:
 * Auto mode = Gemini first with Ollama fallback, plus user-defined,
 * priority-ordered rules (always / message contains / regex) — exactly what
 * the RoutingTable modal in the AI Tutor manages.
 */

const RULES = [
  { priority: '01', condition: 'message contains', value: 'explain · teach · walk me through', target: 'Gemini · cloud', icon: 'cloud' },
  { priority: '02', condition: 'regex ^quiz', value: 'quiz|practice|questions', target: 'Ollama · qwen2.5-coder', icon: 'cpu' },
  { priority: '03', condition: 'message contains', value: 'dockerfile · terraform', target: 'Ollama · default local', icon: 'cpu' },
];

const ROW_GRID = 'grid grid-cols-[3rem_1fr_1fr] gap-4 px-5';

export default function RoutingShowcase() {
  return (
    <section id="routing" className="relative w-full px-5 lg:px-10 py-20 lg:py-28 scroll-mt-24 bg-surface-container-low/60">
      <Aurora
        className="z-0"
        blobs={[{ color: 'var(--color-primary-fixed)', size: 460, bottom: '-10%', left: '-8%', opacity: 0.18, duration: 30 }]}
      />

      <div className="relative z-10 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Copy */}
          <div className="lg:col-span-5">
            <SectionHeading
              align="left"
              eyebrow="Model routing"
              title="Routing you can see and control"
              subtitle="Auto mode answers from Gemini and falls back to a local model when the cloud is unreachable. Add your own rules and the first match wins."
            />

            <Reveal delay={0.15}>
              <div className="mt-8 flex items-center gap-3">
                <div className="glass rounded-xl px-4 py-3 flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-blue-400">cloud</span>
                  <div>
                    <p className="text-label-md text-on-surface leading-none">Gemini</p>
                    <p className="text-[10px] font-mono text-on-surface-variant mt-1">cloud · default</p>
                  </div>
                </div>
                <motion.span
                  className="material-symbols-outlined text-on-surface-variant"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  arrow_forward
                </motion.span>
                <div className="glass rounded-xl px-4 py-3 flex items-center gap-2.5 opacity-90">
                  <span className="material-symbols-outlined text-[18px] text-green-400">cpu</span>
                  <div>
                    <p className="text-label-md text-on-surface leading-none">Ollama</p>
                    <p className="text-[10px] font-mono text-on-surface-variant mt-1">local · fallback</p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.25}>
              <p className="text-body-md text-on-surface-variant mt-6">
                In the AI Tutor, the <span className="font-mono text-primary">Routing table</span> lets you reorder
                rules and watch the live health of your local models.
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <Magnetic strength={0.2}>
                <Link
                  to="/ai-tutor"
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full glass text-label-md text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  Open the routing table
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </Magnetic>
            </Reveal>
          </div>

          {/* Rules table */}
          <div className="lg:col-span-7">
            <Reveal delay={0.1}>
              <div className="glass-strong rounded-2xl overflow-hidden border border-outline-variant/30">
                <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/30">
                  <p className="text-label-md text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
                    Routing rules · priority order
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-label-sm text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Auto mode ON
                  </span>
                </div>

                <div className={`${ROW_GRID} py-2.5 text-label-sm text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/20`}>
                  <span>#</span>
                  <span>Condition</span>
                  <span>Target</span>
                </div>

                <RevealGroup>
                  {RULES.map((r) => (
                    <RevealItem key={r.priority}>
                      <div className={`${ROW_GRID} py-4 border-b border-outline-variant/20 items-center`}>
                        <span className="font-mono text-on-surface-variant">{r.priority}</span>
                        <div className="min-w-0">
                          <p className="font-mono text-[11px] text-primary truncate">{r.condition}</p>
                          <p className="text-label-sm text-on-surface-variant truncate">{r.value}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-[16px] ${r.icon === 'cloud' ? 'text-blue-400' : 'text-green-400'}`}>
                            {r.icon}
                          </span>
                          <span className="text-label-sm text-on-surface whitespace-nowrap">{r.target}</span>
                        </div>
                      </div>
                    </RevealItem>
                  ))}
                </RevealGroup>

                <div className="flex items-center justify-between px-5 py-4">
                  <span className="text-label-sm text-on-surface-variant">No rule matches?</span>
                  <span className="font-mono text-[11px] text-on-surface-variant">auto → Gemini, fallback to Ollama</span>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="text-label-sm text-on-surface-variant mt-3 text-center">
                Example rules — create your own with{' '}
                <span className="font-mono">message contains</span>, <span className="font-mono">regex</span> or{' '}
                <span className="font-mono">always</span>.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
