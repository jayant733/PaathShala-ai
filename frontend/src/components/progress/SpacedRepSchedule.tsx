import { useState } from 'react';
import { motion } from 'framer-motion';
import type { TopicMastery } from '../../api/ml.api';
import { easeFactorLabel } from '../../utils/progress.utils';
import { Calendar, HelpCircle, ChevronDown, ChevronUp, Layers } from 'lucide-react';

interface SpacedRepScheduleProps {
  topics: TopicMastery[];
  loading: boolean;
}

export function SpacedRepSchedule({ topics, loading }: SpacedRepScheduleProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  if (loading) {
    return (
      <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-surface-container-high rounded" />
        <div className="h-32 bg-surface-container-high rounded-xl" />
      </div>
    );
  }

  if (topics.length === 0) {
    return null;
  }

  return (
    <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-500" />
          <h3 className="text-title-medium font-bold text-on-surface">SM-2 Spaced Repetition Engine</h3>
        </div>
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="text-label-sm text-primary hover:underline flex items-center gap-1"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          How it works
          {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {showExplanation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 text-body-sm text-on-surface-variant space-y-2"
        >
          <p className="font-bold text-on-surface flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-primary" />
            SuperMemo SM-2 & Ebbinghaus Decay Model
          </p>
          <p>
            The engine monitors your quiz performance per topic. Correct attempts double or triple your review interval (e.g. 1d → 3d → 6d → 20d), while incorrect answers collapse the schedule back to 1 day.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/10 text-[11px]">
            <div>
              <strong className="text-on-surface">Ease Factor (EF):</strong> Determines interval expansion multiplier (Base: 2.5, Floor: 1.3).
            </div>
            <div>
              <strong className="text-on-surface">Retention (R):</strong> Calculated via Ebbinghaus decay R = e^(-λt) to predict forgetting probability.
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-2">
        <h4 className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">
          Topic SM-2 Performance
        </h4>
        <div className="divide-y divide-outline-variant/10 rounded-xl bg-surface-container-high/30 border border-outline-variant/10 overflow-hidden">
          {topics.map((item) => {
            const easeLabel = easeFactorLabel(2.5); // Default SM-2 starting EF
            return (
              <div key={item.topic} className="p-3 flex items-center justify-between hover:bg-surface-container-high/60 transition-colors">
                <div>
                  <h5 className="text-body-sm font-bold text-on-surface">{item.topic}</h5>
                  <p className="text-[11px] text-on-surface-variant">
                    {item.attempts} attempts ({item.correct_count} correct)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[12px]">
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest font-mono text-on-surface-variant">
                    EF: 2.5 ({easeLabel})
                  </span>
                  <span className="font-mono text-primary font-medium">
                    {item.status === 'strong' ? 'Interval: 20d+' : item.status === 'improving' ? 'Interval: 3d-6d' : 'Interval: 1d'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
