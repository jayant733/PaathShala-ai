import { SectionHeading } from '../ui/SectionHeading';
import { Aurora } from '../ui/Aurora';
import { SpotlightCard } from '../ui/SpotlightCard';
import { TiltCard } from '../ui/TiltCard';
import { RevealGroup, RevealItem } from '../ui/Reveal';

/**
 * Honest "documents, memory and progress" section. Maps 1:1 to implemented
 * subsystems: document upload → chunking → Gemini embeddings → pgvector search
 * (RAG), the long-term memory service, and the learning-journey store.
 */

const PIPELINE = [
  { icon: 'upload_file', title: 'Upload', desc: 'PDF · TXT · MD' },
  { icon: 'content_cut', title: 'Chunk', desc: 'split into retrievable pieces' },
  { icon: 'hub', title: 'Embed', desc: 'Gemini embeddings → pgvector' },
  { icon: 'auto_awesome', title: 'Grounded answer', desc: 'top chunks injected into the prompt' },
];

const CAPS = [
  {
    icon: 'upload_file',
    title: 'Ask your documents',
    desc: 'Upload PDF, TXT or MD and the tutor grounds every answer in your own material — retrieved, not recalled.',
  },
  {
    icon: 'memory',
    title: 'Memory that compounds',
    desc: 'Liked answers and every conversation are distilled into long-term memory that follows you across sessions.',
  },
  {
    icon: 'trending_up',
    title: 'Your learning journey',
    desc: 'Progress toward your goal, completed lessons and the tutor’s recommended next topic — tracked as you learn.',
  },
];

export default function RagMemoryShowcase() {
  return (
    <section id="documents" className="relative w-full px-5 lg:px-10 py-20 lg:py-28 scroll-mt-24">
      <Aurora
        className="z-0"
        blobs={[{ color: 'var(--color-secondary-fixed)', size: 480, top: '-6%', left: '30%', opacity: 0.16, duration: 30 }]}
      />

      <div className="relative z-10 max-w-[1280px] mx-auto">
        <SectionHeading
          eyebrow="Documents · memory · progress"
          title="A tutor that remembers and grounds itself"
          subtitle="Bring your own material, and the tutor keeps context across every session."
        />

        {/* RAG pipeline */}
        <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mt-14">
          {PIPELINE.map((s, i) => (
            <RevealItem key={s.title}>
              <TiltCard className="relative glass rounded-2xl p-5 h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-container/25 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px] text-primary">{s.icon}</span>
                  </div>
                  <span className="font-mono text-[10px] text-on-surface-variant">step {i + 1}</span>
                </div>
                <h4 className="text-label-md text-on-surface">{s.title}</h4>
                <p className="text-label-sm text-on-surface-variant mt-1">{s.desc}</p>
              </TiltCard>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* Feature cards */}
        <RevealGroup className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {CAPS.map((c) => (
            <RevealItem key={c.title}>
              <SpotlightCard className="h-full p-8 flex flex-col gap-5">
                <div className="w-12 h-12 rounded-2xl bg-primary-container/25 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px] text-primary">{c.icon}</span>
                </div>
                <div>
                  <h3 className="text-headline-md text-on-surface">{c.title}</h3>
                  <p className="text-body-md text-on-surface-variant mt-2">{c.desc}</p>
                </div>
              </SpotlightCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
