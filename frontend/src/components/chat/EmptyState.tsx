import { Brain, Boxes, GraduationCap, Code2, Columns3, BookOpen, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  onExample: (prompt: string) => void;
}

const EXAMPLES: { icon: React.ComponentType<{ className?: string }>; label: string; prompt: string }[] = [
  { icon: Boxes, label: 'Explain Kubernetes architecture', prompt: 'Explain Kubernetes architecture with a diagram' },
  { icon: GraduationCap, label: 'Teach me distributed systems', prompt: 'Teach me distributed systems step by step' },
  { icon: Code2, label: 'Review my code', prompt: 'Review my code and suggest improvements' },
  { icon: Columns3, label: 'Compare PostgreSQL vs MongoDB', prompt: 'Compare PostgreSQL vs MongoDB' },
  { icon: BookOpen, label: 'What is RAG?', prompt: 'What is RAG? Explain it simply' },
];

/** Premium welcome screen shown before the first AI answer. */
export default function EmptyState({ onExample }: EmptyStateProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4 py-10">
      <div className="relative">
        <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full scale-150 pointer-events-none" />
        <div className="relative w-20 h-20 rounded-3xl glass-strong flex items-center justify-center shadow-inner">
          <Brain className="w-10 h-10 text-primary" />
        </div>
      </div>

      <h2 className="mt-6 font-display text-headline-md text-on-surface font-semibold">
        Start learning <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-tertiary">anything</span>
      </h2>
      <p className="mt-2 max-w-md text-body-md text-on-surface-variant/80">
        Ask me to break down a topic into a structured lesson, quiz you, or analyze your documents.
      </p>

      <div className="mt-8 w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {EXAMPLES.map((ex) => {
          const Icon = ex.icon;
          return (
            <button
              key={ex.prompt}
              onClick={() => onExample(ex.prompt)}
              className="group flex items-center gap-3 px-4 py-3 rounded-2xl border border-surface-container-highest/30 bg-surface-container-lowest/50 hover:border-primary/40 hover:bg-primary/10 transition-colors text-left"
            >
              <span className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </span>
              <span className="font-body-sm text-body-sm text-on-surface group-hover:text-primary transition-colors">
                {ex.label}
              </span>
              <Sparkles className="w-4 h-4 text-primary/0 group-hover:text-primary/60 transition-colors ml-auto flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
