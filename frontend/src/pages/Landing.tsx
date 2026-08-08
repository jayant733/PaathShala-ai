import { lazy, Suspense, useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { Reveal, RevealGroup, RevealItem } from '../components/ui/Reveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Magnetic } from '../components/ui/Magnetic';
import { Aurora } from '../components/ui/Aurora';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { TiltCard } from '../components/ui/TiltCard';
import { GradientText } from '../components/ui/GradientText';
import { AnimatedBadge } from '../components/ui/AnimatedBadge';
import { AnimatedStat } from '../components/ui/AnimatedStat';
import CountUp from '../components/ui/CountUp';
import { Faq, type FaqItemData } from '../components/ui/Faq';
import { TestimonialCard } from '../components/ui/TestimonialCard';
import { InfiniteSlider } from '../components/ui/Marquee';

/* ---------------------------------------------------------------------------
   Content — same branding, voice and messaging as the original page.
--------------------------------------------------------------------------- */

const MODELS = ['Qwen2.5-Coder', 'Llama 3', 'Gemma'];

const FEATURES = [
  { icon: 'bolt', title: 'Smart auto-routing', desc: 'Every prompt is matched to the model best at the task — planning, coding, or quizzes — automatically.' },
  { icon: 'code', title: 'Best-in-class coding', desc: 'Qwen2.5-Coder handles your code questions, from a binary search to a full repo walkthrough.' },
  { icon: 'quiz', title: 'Quizzes & learning', desc: 'Practice quizzes that grade your answers and adapt to what you need next.' },
  { icon: 'hub', title: 'GitHub connected', desc: 'Ask questions about your repositories with the model best suited to explain them.' },
  { icon: 'lock', title: 'Private by default', desc: 'Runs fully on your machine — your chats and code never leave your device.' },
  { icon: 'bolt', title: 'Sub-15ms routing', desc: 'A lightweight router decides the ideal model before you finish typing.' },
];

const STEPS = [
  { icon: 'chat_bubble', title: 'Your question', desc: 'The prompt you type' },
  { icon: 'psychology', title: 'Intent detection', desc: 'Planning, coding, or a quiz?' },
  { icon: 'tune', title: 'Model ranking', desc: 'Capability · benchmark · speed · resources' },
  { icon: 'memory', title: 'Best model', desc: 'The one strongest at the task' },
  { icon: 'check_circle', title: 'Best answer', desc: 'A reply from the winning model' },
];

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

const TOOLCHAIN = ['Qwen2.5-Coder', 'Llama 3', 'Gemma', 'Ollama', 'GitHub', 'VS Code', 'Python', 'Docker', 'Jupyter'];

const CAPABILITIES = [
  { icon: 'lock', title: 'Fully local & private', desc: 'Runs entirely on your machine. Chats and code never leave your device — no cloud, no tracking.', color: 'bg-primary' },
  { icon: 'bolt', title: 'Sub-15ms routing', desc: 'A lightweight router classifies intent and picks the winning model before you finish typing.', color: 'bg-secondary' },
  { icon: 'tune', title: 'Benchmark-ranked selection', desc: 'Every model is scored on capability, benchmarks, speed and resources — the best one always answers.', color: 'bg-tertiary' },
];

const TESTIMONIALS = [
  { quote: 'I ask it to explain a repo and it routes to the model that actually reads code best. Feels like a tutor that knows its strengths.', name: 'Aarav S.', role: 'CS Student', icon: 'school' },
  { quote: 'Everything runs locally — no account, no uploads. My code stays mine, and the answers are fast.', name: 'Priya M.', role: 'Developer', icon: 'code' },
  { quote: 'The router picked the perfect model for my quiz prep. It adapts to exactly what I need next.', name: 'Rohan K.', role: 'ML Engineer', icon: 'psychology' },
  { quote: 'Sub-15ms routing is real. Questions feel instant, and I trust the ranking every time.', name: 'Neha R.', role: 'Research Assistant', icon: 'auto_awesome' },
];

type Plan = {
  name: string;
  price: string;
  period?: string;
  desc: string;
  features: string[];
  cta: string;
  featured?: boolean;
};
const PLANS: Plan[] = [
  { name: 'Free', price: '$0', desc: 'For getting started with local AI.', features: ['1 active model', 'Basic routing', 'Community support'], cta: 'Start free' },
  { name: 'Pro', price: '$12', period: '/mo', desc: 'For serious learners and builders.', features: ['All local models', 'Smart auto-routing', 'Quizzes & grading', 'Priority support'], cta: 'Go Pro', featured: true },
  { name: 'Enterprise', price: 'Custom', desc: 'For teams and on-prem deployments.', features: ['Unlimited models', 'Self-hosted', 'SSO & audit logs', 'Dedicated engineer'], cta: 'Contact sales' },
];

const FAQS: FaqItemData[] = [
  { q: 'Does anything leave my device?', a: 'No. PaathShala AI runs fully on your machine — your chats, code and study history never leave your device.' },
  { q: 'Which models are available?', a: 'Qwen2.5-Coder, Llama 3 and Gemma are wired in today. The router picks whichever is strongest for each task.' },
  { q: 'How does auto-routing decide the best model?', a: 'Each prompt is scored against capability, benchmark pass-rates, speed and local resources — the winning model answers in real time.' },
  { q: 'Is it free?', a: 'Free to start with one model. Pro unlocks every local model plus quizzes and priority support.' },
  { q: 'Can I use it for coding?', a: 'Yes — Qwen2.5-Coder is optimized for code from a binary search to a full repo walkthrough.' },
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

function MiniBars({ color }: { color: string }) {
  const reduce = useReducedMotion();
  const heights = [45, 70, 55, 90, 65, 100];
  return (
    <div className="flex items-end gap-1.5 h-10" aria-hidden="true">
      {heights.map((h, i) => (
        <motion.span
          key={i}
          className={`w-1.5 rounded-full ${color}`}
          initial={reduce ? false : { height: 0, opacity: 0.4 }}
          animate={reduce ? undefined : { height: `${h}%`, opacity: 1 }}
          transition={{ delay: 0.15 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
        />
      ))}
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

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="md:hidden mt-2 glass-strong rounded-2xl p-3 flex flex-col gap-1"
            >
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
            </motion.div>
          )}
        </AnimatePresence>
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
              <AnimatedBadge className="self-start">All local models online</AnimatedBadge>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="text-[clamp(2.1rem,5.5vw,3.4rem)] leading-[1.06] font-semibold text-on-surface tracking-tighter text-balance">
                Chat, learn &amp; build with AI — <br className="hidden sm:block" />
                <GradientText>the best model answers every time.</GradientText>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="text-body-lg text-on-surface-variant max-w-xl text-pretty">
                PaathShala AI connects local models —{' '}
                {MODELS.map((m, i) => (
                  <span key={m}>
                    <span className="font-mono text-sm text-primary">{m}</span>
                    {i < MODELS.length - 1 ? ', ' : ''}
                  </span>
                ))}{' '}
                — into one intelligent tutor. Each prompt is analyzed and routed to the model strongest
                at the task, automatically.
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
                    href="#how-it-works"
                    className="inline-flex items-center gap-2.5 px-8 py-4 glass rounded-full text-label-md text-on-surface hover:bg-surface-container-high transition-colors duration-300"
                  >
                    See How It Works
                  </a>
                </Magnetic>
              </div>
            </Reveal>
            <Reveal delay={0.32}>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">Powered by</span>
                {MODELS.map((m) => (
                  <span key={m} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-label-md text-on-surface whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {m}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          {/* 3D orb + floating cards */}
          <div className="lg:col-span-6">
            <Reveal delay={0.1} scale={0.96} y={20}>
              <div className="relative h-[380px] sm:h-[460px] lg:h-[560px]">
                <Suspense fallback={<OrbFallback />}>
                  <OrbScene className="absolute inset-0" />
                </Suspense>

                <FloatingCard className="top-5 left-0 w-52 sm:w-56 p-4" floatY={-8}>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-primary-container text-[15px]">psychology</span>
                    </div>
                    <span className="text-label-md text-on-surface">Intent Router</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-3/4 rounded-full" />
                  </div>
                  <p className="mt-2 font-mono text-on-surface-variant/60 text-xs">Latency 12ms</p>
                </FloatingCard>

                <FloatingCard className="bottom-8 right-0 w-56 sm:w-60 p-4" floatDelay={1} floatY={10}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-label-md text-on-surface">Model cluster</span>
                    <span className="material-symbols-outlined text-secondary text-[20px]">memory</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-12 w-1/3 bg-secondary-container/40 rounded-lg animate-pulse" />
                    <div className="h-12 w-1/3 bg-secondary-container/60 rounded-lg animate-pulse [animation-delay:80ms]" />
                    <div className="h-12 w-1/3 bg-secondary-container/25 rounded-lg animate-pulse [animation-delay:160ms]" />
                  </div>
                </FloatingCard>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Animated stats */}
        <Reveal delay={0.3}>
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 rounded-[2rem] glass p-8">
            <AnimatedStat to={15} suffix="ms" label="routing latency" />
            <AnimatedStat to={3} label="local models" />
            <AnimatedStat to={100} suffix="%" label="on-device · private" />
            <AnimatedStat to={40} suffix="+" label="benchmarks ranked" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function TrustedBy() {
  return (
    <section className="w-full px-5 lg:px-10 py-10 lg:py-14">
      <div className="max-w-[1280px] mx-auto">
        <Reveal>
          <p className="text-center text-label-sm text-on-surface-variant uppercase tracking-[0.22em] mb-8">
            Works with the stack you already use
          </p>
        </Reveal>
        <InfiniteSlider duration={34} gap={16} durationOnHover={60}>
          {TOOLCHAIN.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass text-label-md text-on-surface-variant whitespace-nowrap"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary/70" />
              {t}
            </span>
          ))}
        </InfiniteSlider>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="relative w-full px-5 lg:px-10 py-20 lg:py-28 scroll-mt-24">
      <Aurora
        className="z-0"
        blobs={[{ color: 'var(--color-primary-fixed)', size: 540, top: '-8%', right: '-12%', opacity: 0.16, duration: 32, x: '-60px', y: '40px' }]}
      />
      <div className="relative z-10 max-w-[1280px] mx-auto">
        <SectionHeading
          eyebrow="Features"
          title={
            <>
              One tutor for every kind of question. <span className="text-on-surface-variant">The right model answers, every time.</span>
            </>
          }
          subtitle="From a quick code fix to a full study plan — every component is crafted for the perfect learning experience."
        />

        <RevealGroup className="grid grid-cols-1 md:grid-cols-12 gap-5 auto-rows-[220px] mt-14">
          {/* Large: auto-routing */}
          <RevealItem className="md:col-span-7 row-span-2">
            <SpotlightCard className="h-full p-8 md:p-12">
              <div className="absolute right-0 bottom-0 w-2/3 h-2/3 opacity-25 group-hover:scale-105 transition-transform duration-700 origin-bottom-right">
                <svg className="w-full h-full text-primary-fixed" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path
                    d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18,95.5,-2.9C94.2,12.2,85.5,26.9,75.4,39.6C65.3,52.3,53.8,63.1,40.4,71.3C27,79.5,11.7,85.1,-3.5,91.1C-18.7,97.1,-33.9,103.5,-46.8,98.1C-59.7,92.7,-70.3,75.5,-79.1,60C-87.9,44.5,-94.9,30.7,-97.2,16.2C-99.5,1.7,-97.1,-13.5,-90.6,-26.8C-84.1,-40.1,-73.5,-51.5,-60.8,-59.5C-48.1,-67.5,-33.3,-72.1,-19.1,-74.6C-4.9,-77.1,8.7,-77.5,22.1,-75.9C35.5,-74.3,48.7,-70.7,44.7,-76.4Z"
                    fill="currentColor"
                    transform="translate(100 100) scale(1.1)"
                  />
                </svg>
              </div>
              <div className="relative h-full flex flex-col justify-between">
                <div className="w-14 h-14 bg-primary-container rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary-container text-[28px]">account_tree</span>
                </div>
                <div className="max-w-md">
                  <h3 className="text-headline-md text-on-surface mb-3">{FEATURES[0].title}</h3>
                  <p className="text-body-md text-on-surface-variant">{FEATURES[0].desc}</p>
                </div>
              </div>
            </SpotlightCard>
          </RevealItem>

          {/* Small 1: coding */}
          <RevealItem className="md:col-span-5">
            <SpotlightCard className="h-full p-8 flex flex-col justify-between" color="var(--color-secondary)">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-headline-md text-on-surface">{FEATURES[1].title}</h3>
                <span className="material-symbols-outlined text-secondary text-[26px]">{FEATURES[1].icon}</span>
              </div>
              <p className="text-body-md text-on-surface-variant mt-4">{FEATURES[1].desc}</p>
            </SpotlightCard>
          </RevealItem>

          {/* Small 2: quizzes */}
          <RevealItem className="md:col-span-5">
            <SpotlightCard className="h-full p-8 flex flex-col justify-between" color="var(--color-tertiary-fixed)">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-headline-md text-on-surface">{FEATURES[2].title}</h3>
                <span className="material-symbols-outlined text-tertiary text-[26px]">{FEATURES[2].icon}</span>
              </div>
              <p className="text-body-md text-on-surface-variant mt-4">{FEATURES[2].desc}</p>
            </SpotlightCard>
          </RevealItem>

          {/* Row 3: github / privacy / routing summary */}
          <RevealItem className="md:col-span-4">
            <SpotlightCard className="h-full p-7 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-primary text-[24px]">{FEATURES[3].icon}</span>
                <h3 className="text-headline-md text-on-surface">{FEATURES[3].title}</h3>
              </div>
              <p className="text-body-md text-on-surface-variant">{FEATURES[3].desc}</p>
            </SpotlightCard>
          </RevealItem>
          <RevealItem className="md:col-span-4">
            <SpotlightCard className="h-full p-7 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-primary text-[24px]">{FEATURES[4].icon}</span>
                <h3 className="text-headline-md text-on-surface">{FEATURES[4].title}</h3>
              </div>
              <p className="text-body-md text-on-surface-variant">{FEATURES[4].desc}</p>
            </SpotlightCard>
          </RevealItem>
          <RevealItem className="md:col-span-4">
            <SpotlightCard className="h-full p-7 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-primary text-[24px]">{FEATURES[5].icon}</span>
                <h3 className="text-headline-md text-on-surface">{FEATURES[5].title}</h3>
              </div>
              <p className="text-body-md text-on-surface-variant">{FEATURES[5].desc}</p>
            </SpotlightCard>
          </RevealItem>

          {/* Stat band */}
          <RevealItem className="md:col-span-12">
            <div className="relative overflow-hidden rounded-[1.75rem] bg-primary text-on-primary p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                <div className="absolute top-0 right-0 w-64 h-64 bg-on-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-on-primary/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
              </div>
              <div className="relative z-10 flex items-baseline gap-3">
                <span className="font-mono text-5xl md:text-6xl font-semibold tracking-tight">
                  <CountUp to={15} suffix="ms" digitEffect="slide" />
                </span>
                <span className="text-label-md uppercase tracking-widest text-on-primary/80">routing latency</span>
              </div>
              <p className="relative z-10 text-on-primary/85 max-w-md text-center md:text-left">
                A lightweight router decides the ideal model before you finish typing — rated on capability,
                benchmarks, speed and resources.
              </p>
              <Link
                to="/ai-tutor"
                className="relative z-10 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-on-primary text-primary font-semibold text-label-md hover:shadow-lg transition-all shrink-0"
              >
                Try it
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
            </div>
          </RevealItem>
        </RevealGroup>
      </div>
    </section>
  );
}

function Capabilities() {
  return (
    <section id="capabilities" className="w-full px-5 lg:px-10 py-20 lg:py-28 scroll-mt-24 bg-surface-container-low/60">
      <div className="max-w-[1280px] mx-auto">
        <SectionHeading
          eyebrow="AI capabilities"
          title="Engineered for trust, speed and accuracy"
          subtitle="Every layer of the router is designed to feel instant and stay private — without compromising on which model answers."
        />
        <RevealGroup className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
          {CAPABILITIES.map((c) => (
            <RevealItem key={c.title}>
              <SpotlightCard className="h-full p-8 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-primary-container/70 flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-primary-container text-[24px]">{c.icon}</span>
                  </div>
                  <MiniBars color={c.color} />
                </div>
                <h3 className="text-headline-md text-on-surface">{c.title}</h3>
                <p className="text-body-md text-on-surface-variant">{c.desc}</p>
              </SpotlightCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full px-5 lg:px-10 py-20 lg:py-28 scroll-mt-24">
      <div className="max-w-[1280px] mx-auto">
        <SectionHeading
          eyebrow="How it works"
          title="Every prompt, matched to its ideal model"
          subtitle="From raw prompt to the best possible answer — a transparent pipeline you never have to think about."
        />
        <div className="relative mt-16">
          <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary-fixed to-transparent" aria-hidden="true" />
          <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
            {STEPS.map((s, i) => (
              <RevealItem key={s.title}>
                <TiltCard className="relative flex flex-col items-center text-center glass rounded-3xl p-6 h-full">
                  <div className="relative w-16 h-16 mb-5 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-2xl bg-primary-container/60" />
                    <span className="material-symbols-outlined text-on-primary-container text-[28px]">{s.icon}</span>
                    <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-[11px] font-mono">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-label-md text-on-surface mb-2">{s.title}</h3>
                  <p className="text-label-sm text-on-surface-variant leading-snug">{s.desc}</p>
                </TiltCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="w-full px-5 lg:px-10 py-20 lg:py-28 bg-surface-container-low/60 overflow-hidden">
      <div className="max-w-[1280px] mx-auto">
        <SectionHeading
          eyebrow="Loved by learners & builders"
          title="A tutor that knows its strengths"
          subtitle="Real feedback from people who route every question to the model that answers it best."
        />
        <div className="mt-14">
          <InfiniteSlider duration={42} gap={20} reverse>
            {TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.name} {...t} />
            ))}
          </InfiniteSlider>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="w-full px-5 lg:px-10 py-20 lg:py-28 scroll-mt-24">
      <div className="max-w-[1200px] mx-auto">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple plans, local by default"
          subtitle="Start free. Scale when your learning does."
        />
        <RevealGroup className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14 items-stretch">
          {PLANS.map((p) => (
            <RevealItem key={p.name} className="h-full">
              <div className={`h-full ${p.featured ? 'gradient-border scale-[1.02] z-10' : ''}`}>
                <SpotlightCard
                  className={`h-full p-8 flex flex-col ${p.featured ? 'bg-surface-container-lowest' : ''}`}
                >
                  {p.featured && (
                    <span className="self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary text-label-sm uppercase tracking-wider mb-4">
                      <span className="material-symbols-outlined text-[14px]">stars</span>
                      Most popular
                    </span>
                  )}
                  <div className="mb-6">
                    <h3 className="text-label-md text-on-surface uppercase tracking-wider">{p.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-[2.6rem] leading-none font-semibold text-on-surface">{p.price}</span>
                      {p.period && <span className="text-on-surface-variant text-body-md">{p.period}</span>}
                    </div>
                    <p className="text-body-md text-on-surface-variant mt-2">{p.desc}</p>
                  </div>
                  <ul className="flex flex-col gap-3 mb-8">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-body-md text-on-surface">
                        <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/register"
                    className={`mt-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-label-md font-semibold transition-all duration-300 ${
                      p.featured
                        ? 'bg-primary text-on-primary shadow-lg shadow-primary/25 hover:shadow-primary/40'
                        : 'glass text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {p.cta}
                  </Link>
                </SpotlightCard>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="w-full px-5 lg:px-10 py-20 lg:py-28 scroll-mt-24 bg-surface-container-low/60">
      <div className="max-w-[760px] mx-auto">
        <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
        <Faq items={FAQS} className="mt-12" />
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="w-full px-5 lg:px-10 py-20 lg:py-28">
      <div className="max-w-[1200px] mx-auto">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-primary px-8 py-16 lg:py-20 text-center glass-strong">
            <Aurora
              className="z-0"
              blobs={[
                { color: 'var(--color-on-primary)', size: 300, top: '-20%', left: '10%', opacity: 0.08, duration: 26 },
                { color: 'var(--color-on-primary)', size: 360, bottom: '-25%', right: '10%', opacity: 0.06, duration: 32 },
              ]}
            />
            <div className="relative z-10">
              <h2 className="text-headline-lg lg:text-[40px] lg:leading-[48px] text-on-primary font-bold tracking-tight">
                Ready to learn with the best model?
              </h2>
              <p className="mt-3 text-on-primary/80 max-w-xl mx-auto text-body-lg">
                Start a chat and watch every question get routed to the model that answers it best.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <Magnetic>
                  <Link
                    to="/ai-tutor"
                    className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-on-primary text-primary font-semibold text-label-md shadow-lg hover:shadow-xl transition-all"
                  >
                    Start Chatting with AI
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

function Footer() {
  const columns = [
    { title: 'Product', links: ['AI Tutor', 'Smart Router', 'Quiz Engine'] },
    { title: 'Company', links: ['About', 'Careers', 'Security'] },
    { title: 'Support', links: ['Documentation', 'API Status', 'GitHub'] },
  ];
  return (
    <footer className="w-full bg-surface-container-low/70 border-t border-outline-variant/20">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-10 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px]">neurology</span>
              </div>
              <span className="text-headline-md text-primary">PaathShala</span>
            </div>
            <p className="text-body-md text-on-surface-variant max-w-xs">
              Your multi-model AI tutor for chat, coding &amp; quizzes. Building the future of AI-powered learning.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-label-md text-on-surface mb-6 uppercase tracking-wider">{col.title}</h4>
              <ul className="space-y-4">
                {col.links.map((l) => (
                  <li key={l} className="text-body-md text-on-surface-variant hover:text-primary cursor-pointer transition-colors">
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-4 text-label-sm text-on-surface-variant">
          <p>© 2026 PaathShala AI. All rights reserved.</p>
          <div className="flex gap-8">
            <span className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
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
        <TrustedBy />
        <Features />
        <Capabilities />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FaqSection />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
