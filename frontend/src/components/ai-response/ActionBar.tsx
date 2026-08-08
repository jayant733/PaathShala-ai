import { useMemo, useState } from 'react';
import { StickyNote, MessageSquarePlus, Sparkles } from 'lucide-react';
import { parsePresentation } from './parsePresentation';
import NotesModal from './NotesModal';
import type { AnswerType, Presentation, SuggestedAction } from './types';

interface ActionBarProps {
  content: string;
  onSend: (prompt: string) => void;
  onFocusInput: () => void;
}

function extractTopic(content: string): string {
  const parsed = parsePresentation(content);
  if (parsed.status === 'parsed' && parsed.presentation.title) return parsed.presentation.title;
  // Fallback: first markdown heading.
  const heading = content.match(/^#+\s+(.+)$/m);
  if (heading) return heading[1].trim();
  return 'this topic';
}

/** Type-tailored default follow-ups, used when the model sends none. */
function typeDefaults(type: AnswerType, topic: string): SuggestedAction[] {
  const q = (p: string) => p.replaceAll('{topic}', topic);
  switch (type) {
    case 'architecture':
    case 'system_design':
      return [
        { title: 'Explain Components', prompt: q(`Explain each component of the "${topic}" architecture in detail.`) },
        { title: 'Interview Questions', prompt: q(`Generate 5 system design interview questions about "${topic}".`) },
        { title: 'Architecture Notes', prompt: q(`Turn this "${topic}" architecture into structured study notes.`) },
      ];
    case 'code':
    case 'debugging':
      return [
        { title: 'Optimize This', prompt: q(`Optimize the code for "${topic}".`) },
        { title: 'Explain Complexity', prompt: q(`Explain the time and space complexity of "${topic}".`) },
        { title: 'Generate Tests', prompt: q(`Generate unit tests for "${topic}".`) },
      ];
    case 'concept':
      return [
        { title: 'Create Flashcards', prompt: q(`Create flashcards for "${topic}".`) },
        { title: 'Generate Quiz', prompt: q(`Create a 5-question quiz about "${topic}" with an answer key.`) },
        { title: 'Real-World Example', prompt: q(`Give a real-world example that illustrates "${topic}".`) },
      ];
    case 'comparison':
      return [
        { title: 'Deeper Comparison', prompt: q(`Compare the options in "${topic}" in more depth.`) },
        { title: 'When to Choose Each', prompt: q(`When should you choose each option within "${topic}"?`) },
        { title: 'Recommend for Me', prompt: q(`Recommend one option for "${topic}" for my use case.`) },
      ];
    case 'research':
      return [
        { title: 'Summarize Key Ideas', prompt: q(`Summarize the key ideas in "${topic}".`) },
        { title: 'Generate Quiz', prompt: q(`Create a 5-question quiz about "${topic}" with an answer key.`) },
        { title: 'Create Notes', prompt: q(`Turn "${topic}" into structured study notes.`) },
      ];
    default:
      return [
        { title: 'Generate Quiz', prompt: q(`Create a 5-question quiz about "${topic}" with an answer key.`) },
        { title: 'Create Notes', prompt: q(`Turn "${topic}" into structured study notes.`) },
        { title: 'Practice Exercises', prompt: q(`Give me practice exercises for "${topic}".`) },
      ];
  }
}

interface Action {
  key: string;
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
}

/**
 * "Continue Learning" action bar shown after a presentation. Actions are
 * context-aware: they use the model-supplied `suggestedActions` when present,
 * otherwise type-specific defaults — plus universal notes / follow-up.
 */
export default function ActionBar({ content, onSend, onFocusInput }: ActionBarProps) {
  const topic = useMemo(() => extractTopic(content), [content]);
  const parsed = useMemo(() => parsePresentation(content), [content]);
  const presentation: Presentation | null =
    parsed.status === 'parsed' ? parsed.presentation : null;

  const [notesOpen, setNotesOpen] = useState(false);

  if (parsed.status !== 'parsed') return null;
  if (!presentation) return null;

  const contextual: SuggestedAction[] =
    presentation.suggestedActions?.length
      ? presentation.suggestedActions
      : typeDefaults(presentation.answerType, topic);

  // Built-in labels are canonical. AI-generated actions whose title collides
  // with a built-in one (e.g. default-type "Create Notes") are dropped so the
  // modal action wins and no duplicate button renders.
  const normalize = (t: string) => t.trim().toLowerCase();
  const builtinLabels = new Set(
    ['Create Notes', 'Ask Follow-up'].map(normalize),
  );
  const dedupedContextual = contextual.filter(
    (a) => !builtinLabels.has(normalize(a.title)),
  );

  const actions: Action[] = [
    {
      key: 'notes',
      icon: <StickyNote className="w-4 h-4" />,
      label: 'Create Notes',
      hint: 'Turn this into study notes',
      onClick: () => setNotesOpen(true),
    },
    ...dedupedContextual.slice(0, 3).map((a, i) => ({
      key: `ctx-${i}`,
      icon: <Sparkles className="w-4 h-4" />,
      label: a.title,
      hint: a.prompt,
      onClick: () => onSend(a.prompt),
    })),
    {
      key: 'followup',
      icon: <MessageSquarePlus className="w-4 h-4" />,
      label: 'Ask Follow-up',
      hint: 'Continue the conversation',
      onClick: onFocusInput,
    },
  ];

  return (
    <>
      <div className="mt-3 rounded-2xl border border-surface-container-highest/30 bg-surface-container-lowest/50 backdrop-blur p-3">
        <p className="font-label-md text-label-md text-on-surface flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" /> Continue Learning
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {actions.map((a) => (
            <button
              key={a.key}
              onClick={a.onClick}
              title={a.hint}
              className="flex flex-col items-start gap-1 p-2.5 rounded-xl bg-surface-container-high/40 border border-surface-container-highest/20 hover:border-primary/40 hover:bg-primary/10 transition-colors text-left"
            >
              <span className="text-primary">{a.icon}</span>
              <span className="font-label-sm text-label-sm text-on-surface leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      <NotesModal
        open={notesOpen}
        presentation={presentation}
        rawContent={content}
        onClose={() => setNotesOpen(false)}
      />
    </>
  );
}
