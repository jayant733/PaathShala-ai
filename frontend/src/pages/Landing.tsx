import { lazy, Suspense, useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

import { Reveal } from '../components/ui/Reveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Magnetic } from '../components/ui/Magnetic';
import { Aurora } from '../components/ui/Aurora';
import { GradientText } from '../components/ui/GradientText';
import { AnimatedBadge } from '../components/ui/AnimatedBadge';
import { AnimatedStat } from '../components/ui/AnimatedStat';
import { Faq, type FaqItemData } from '../components/ui/Faq';
import { InfiniteSlider } from '../components/ui/Marquee';

import HeroChatMock from '../components/landing/HeroChatMock';
import AnswerTypeFan from '../components/landing/AnswerTypeFan';
import AgentShowcase from '../components/landing/AgentShowcase';
import RagMemoryShowcase from '../components/landing/RagMemoryShowcase';
import RoutingShowcase from '../components/landing/RoutingShowcase';

/* ---------------------------------------------------------------------------
   Content — every claim below is backed by the implemented product.
   No pricing, no testimonials, no invented benchmarks or latency numbers.
--------------------------------------------------------------------------- */

const NAV_LINKS = [
  { label: 'Answers', href: '#answers' },
  { label: 'Agents', href: '#agents' },
  { label: 'Documents', href: '#documents' },
  { label: 'Routing', href: '#routing' },
  { label: 'FAQ', href: '#faq' },
];

const STACK = ['Gemini', 'Ollama', 'FastAPI', 'PostgreSQL · pgvector', 'LangGraph', 'React', 'Mermaid', 'JWT Auth'];

const FAQS: FaqItemData[] = [
  {
    q: 'How is PaathShala powered?',
    a: 'Two real providers. Gemini in the cloud is the default, and any models you have installed in Ollama are available locally. Auto mode answers from Gemini and falls back to a local model when the cloud is unreachable.',
  },
  {
    q: 'What are the structured answers?',
    a: 'When a question maps to one of 10 types — architecture, concept, code, comparison, learning, system design, tutorial, research, roadmap or debugging — the tutor opens with a compact JSON envelope and renders it as a visual card: diagram, concepts, steps, difficulty and next topics, followed by the full markdown explanation.',
  },
  {
    q: 'Is my data private?',
    a: 'To be direct: your account, chat history, memories and uploaded documents are stored on the server (PostgreSQL with pgvector) and scoped to your account. For answers generated entirely on your machine, choose Ollama — but cloud Gemini is the default.',
  },
  {
    q: 'Do I need an account?',
    a: 'Yes. Register with an email or username to use the AI Tutor, Dashboard and Planner. Sessions are secured with JWT and your data is scoped to your account.',
  },
  {
    q: 'Does it cost anything?',
    a: 'The product has no billing. You bring your own Gemini API key for cloud answers; Ollama runs free on your machine. Either provider works on its own.',
  },
  {
    q: 'Can I use my own documents?',
    a: 'Yes. Upload a PDF, TXT or Markdown file and the tutor grounds its answers in your material using retrieval-augmented generation — embeddings, vector search, then a grounded answer.',
  },
];

/* ---------------------------------------------------------------------------
   Small shared pieces
--------------------------------------------------------------------------- */

function FloatingCard({
  className,
  children,
  floatDelay = 0,
  floatY = -8,
}: {
  className: string;
  children: ReactNode;
  floatDelay?: number;
  floatY?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`glass absolute rounded-2xl ${className}`}
      initial={reduce ? false : { opacity: 0, scale: 0.92 }}
      animate={
        reduce
          ? undefined
          : {
              opacity: 1,
              scale: 1,
              y: [0, floatY, 0],
            }
      }
      transition={
        reduce
          ? undefined
          : {
              opacity: { delay: 0.7, duration: 0.6 },
              scale: { delay: 0.7, duration: 0.6 },
              y: { delay: floatDelay, duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
            }
      }
    >
      {children}
    </motion.div>
  );
}

const OrbScene = lazy(() => import('../components/ui/OrbScene'));

function OrbFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-44 h-44">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-fixed via-tertiary-fixed to-secondary blur-2xl opacity-40" />
        <div className="absolute inset-8 rounded-full bg-primary/70 animate-pulse" />
        <div className="absolute inset-0 rounded-full border border-primary-fixed/30 animate-[spin_20s_linear_infinite]" style={{ borderStyle: 'dashed' }} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Sections
--------------------------------------------------------------------------- */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6 pt-3">
        <div
          className={`flex items-center justify-between px-4 lg:px-6 h-16 rounded-2xl transition-all duration-500 ${
            scrolled ? 'glass-strong shadow-[0_8px_40px_-12px_rgba(0,40,26,0.4)]' : 'glass'
          }`}
        >
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
              <span className="material-symbols-outlined text-on-primary text-[20px]">neurology</span>
            </div>
            <span className="font-semibold text-headline-md text-primary tracking-tight hidden sm:inline">PaathShala AI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="group text-label-md text-on-surface-variant hover:text-primary transition-colors relative"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:block text-label-md text-on-surface-variant hover:text-primary transition-colors">
              Sign In
            </Link>
            <Magnetic strength={0.2}>
              <Link
                to="/ai-tutor"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-full text-label-md font-semibold shadow-md shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 active:scale-95"
              >
                Start Learning
              </Link>
            </Magnetic>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={open}
              className="md:hidden w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface"
            >
              <span className="material-symbols-outlined text-[20px]">{open ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden mt-2 glass-strong rounded-2xl p-3 flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-container-high"
              >
                {l.label}
              </a>
            ))}
            <Link to="/login" onClick={() => setOpen(false)} className="px-4 py-3 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-container-high">
              Sign In
            </Link>
            <Link
              to="/ai-tutor"
              onClick={() => setOpen(false)}
              className="mt-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-on-primary bg-primary rounded-xl px-4 py-3"
            >
              Start Learning
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative w-full overflow-hidden px-5 lg:px-10 pb-16 lg:pb-24 pt-12 lg:pt-20">
      <Aurora className="z-0" />
      <div className="absolute inset-0 z-0 grid-backdrop" aria-hidden="true" />

      <div className="relative z-10 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Copy */}
          <div className="lg:col-span-6 flex flex-col gap-7">
            <Reveal y={12}>
              <AnimatedBadge className="self-start">Streaming AI tutor · real Gemini + Ollama inference</AnimatedBadge>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="text-[clamp(2.1rem,5.5vw,3.4rem)] leading-[1.06] font-semibold text-on-surface tracking-tighter text-balance">
                Ask anything. Get an answer <br className="hidden sm:block" />
                <GradientText>built like a lesson.</GradientText>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="text-body-lg text-on-surface-variant max-w-xl text-pretty">
                PaathShala streams answers from Gemini or your local Ollama models and renders them as
                presentations — architecture diagrams, code walkthroughs, comparisons and learning
                roadmaps — grounded in your documents and long-term memory.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                <Magnetic>
                  <Link
                    to="/ai-tutor"
                    className="group inline-flex items-center gap-2.5 px-8 py-4 bg-primary text-on-primary rounded-full text-label-md font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
                  >
                    Start Chatting with AI
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </Link>
                </Magnetic>
                <Magnetic strength={0.2}>
                  <a
                    href="#answers"
                    className="inline-flex items-center gap-2.5 px-8 py-4 glass rounded-full text-label-md text-on-surface hover:bg-surface-container-high transition-colors duration-300"
                  >
                    See structured answers
                  </a>
                </Magnetic>
              </div>
            </Reveal>
          </div>

          {/* 3D orb + live tutor mock + floating facts */}
          <div className="lg:col-span-6">
            <Reveal delay={0.1} scale={0.96} y={20}>
              <div className="relative h-[440px] sm:h-[520px] lg:h-[580px]">
                <Suspense fallback={<OrbFallback />}>
                  <OrbScene className="absolute inset-0" />
                </Suspense>

                <div className="absolute inset-0 flex items-center justify-center">
                  <HeroChatMock />
                </div>

                <FloatingCard className="top-4 right-0 w-44 p-3.5" floatY={-8}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-primary-container text-[16px]">bolt</span>
                    </div>
                    <div>
                      <p className="text-label-md text-on-surface leading-none">Auto mode</p>
                      <p className="font-mono text-[10px] text-on-surface-variant mt-1">Gemini → Ollama</p>
                    </div>
                  </div>
                </FloatingCard>

                <FloatingCard className="bottom-10 left-0 w-44 p-3.5" floatDelay={1} floatY={10}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-secondary-container/50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-secondary-container text-[16px]">upload_file</span>
                    </div>
                    <div>
                      <p className="text-label-md text-on-surface leading-none">Documents</p>
                      <p className="font-mono text-[10px] text-on-surface-variant mt-1">PDF · TXT · MD</p>
                    </div>
                  </div>
                </FloatingCard>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Honest stats */}
        <Reveal delay={0.3}>
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 rounded-[2rem] glass p-8">
            <AnimatedStat to={10} label="answer types" caption="architecture → debugging" />
            <AnimatedStat to={2} label="providers" caption="Gemini · Ollama" />
            <AnimatedStat to={3} label="specialist agents" caption="tutor · planner · quiz" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PoweredBy() {
  return (
    <section className="w-full px-5 lg:px-10 py-10 lg:py-14">
      <div className="max-w-[1280px] mx-auto">
        <Reveal>
          <p className="text-center text-label-sm text-on-surface-variant uppercase tracking-[0.22em] mb-8">
            Built on a real, working stack
          </p>
        </Reveal>
        <InfiniteSlider duration={34} gap={16} durationOnHover={60}>
          {STACK.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass text-label-md text-on-surface-variant whitespace-nowrap"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary/70" />
              {s}
            </span>
          ))}
        </InfiniteSlider>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="relative w-full px-5 lg:px-10 py-20 lg:py-28 scroll-mt-24 bg-surface-container-low/60">
      <Aurora
        className="z-0"
        blobs={[{ color: 'var(--color-primary-fixed)', size: 420, top: '-10%', left: '20%', opacity: 0.14, duration: 30 }]}
      />
      <div className="relative z-10 max-w-[760px] mx-auto">
        <SectionHeading eyebrow="FAQ" title="Straight answers" subtitle="No marketing — here is how the product actually works today." />
        <Faq items={FAQS} className="mt-12" />
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative w-full px-5 lg:px-10 py-20 lg:py-28 overflow-hidden">
      <div className="max-w-[1200px] mx-auto">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-primary px-8 py-16 lg:py-20 text-center">
            <Aurora
              className="z-0"
              blobs={[
                { color: 'var(--color-on-primary)', size: 300, top: '-20%', left: '10%', opacity: 0.08, duration: 26 },
                { color: 'var(--color-on-primary)', size: 360, bottom: '-25%', right: '10%', opacity: 0.06, duration: 32 },
              ]}
            />
            <div className="relative z-10">
              <h2 className="text-headline-lg lg:text-[40px] lg:leading-[48px] text-on-primary font-bold tracking-tight">
                Learn with a tutor that explains.
              </h2>
              <p className="mt-3 text-on-primary/80 max-w-xl mx-auto text-body-lg">
                Free to use. Bring a Gemini key, run Ollama locally, or both — the tutor works either way.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <Magnetic>
                  <Link
                    to="/register"
                    className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-on-primary text-primary font-semibold text-label-md shadow-lg hover:shadow-xl transition-all"
                  >
                    Start Learning
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </Link>
                </Magnetic>
                <Magnetic strength={0.2}>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-primary-container text-on-primary-container font-semibold text-label-md hover:bg-primary-container/80 transition-all"
                  >
                    Sign in
                  </Link>
                </Magnetic>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Page
--------------------------------------------------------------------------- */

export default function Landing() {
  return (
    <div className="bg-surface text-on-surface font-sans min-h-screen overflow-x-hidden antialiased">
      <Nav />
      <main className="w-full pt-20">
        <Hero />
        <PoweredBy />
        <AnswerTypeFan />
        <AgentShowcase />
        <RagMemoryShowcase />
        <RoutingShowcase />
        <FaqSection />
        <CTA />
      </main>
    </div>
  );
}
