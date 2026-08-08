import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { parsePresentation } from './parsePresentation';
import Markdown from './Markdown';
import PresentationHeader from './PresentationHeader';
import { ArchitectureView, ConceptView, CodeView, ComparisonView, LearningView } from './views';
import SectionedView from './SectionedView';
import type { AnswerType, Presentation } from './types';

interface ResponseRendererProps {
  content: string;
  /** True while the response is still streaming in; keeps the skeleton until done. */
  streaming?: boolean;
}

const VIEWS: Record<AnswerType, React.ComponentType<{ p: Presentation }>> = {
  architecture: ArchitectureView,
  concept: ConceptView,
  code: CodeView,
  comparison: ComparisonView,
  learning: LearningView,
  system_design: ArchitectureView,
  tutorial: LearningView,
  roadmap: LearningView,
  research: SectionedView,
  debugging: SectionedView,
  default: SectionedView,
};

const EASE = [0.16, 1, 0.3, 1] as const;

function PresentationLoading({ type }: { type: AnswerType }) {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4 py-2"
      aria-busy="true"
    >
      <div className="flex items-center gap-3 text-on-surface-variant font-label-md text-label-md">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        Composing your {type} presentation…
      </div>
      {/* skeleton hero */}
      <div className="h-16 rounded-2xl glass animate-pulse" />
      <div className="h-24 rounded-2xl glass animate-pulse [animation-delay:150ms]" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="h-24 rounded-2xl glass animate-pulse" />
        <div className="h-24 rounded-2xl glass animate-pulse [animation-delay:100ms]" />
        <div className="h-24 rounded-2xl glass animate-pulse [animation-delay:200ms] hidden sm:block" />
      </div>
    </motion.div>
  );
}

/**
 * Top-level structured-response renderer. Detects the PaathShala presentation
 * envelope, renders a type-specific premium view, and falls back to markdown
 * when the envelope is absent or unparseable. A staggered cascade (header →
 * view) animates the transform from the loading skeleton into the final
 * presentation without being distracting.
 */
export default function ResponseRenderer({ content, streaming = false }: ResponseRendererProps) {
  const result = useMemo(
    () => parsePresentation(content, { isDone: !streaming }),
    [content, streaming],
  );

  if (result.status === 'none') return null;

  return (
    <AnimatePresence mode="wait">
      {result.status === 'streaming' && <PresentationLoading type={result.type} />}

      {result.status === 'invalid' && (
        <motion.div
          key="invalid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <Markdown content={result.markdown} />
        </motion.div>
      )}

      {result.status === 'parsed' && (
        <motion.div
          key="parsed"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="space-y-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.5, ease: EASE }}
          >
            <PresentationHeader p={result.presentation} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.5, ease: EASE }}
          >
            {(() => {
              const View = VIEWS[result.presentation.answerType] ?? SectionedView;
              return <View p={result.presentation} />;
            })()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
