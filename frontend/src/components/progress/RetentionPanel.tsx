import { motion } from 'framer-motion';
import type { ReviewDue } from '../../api/ml.api';
import { reviewUrgency, pct } from '../../utils/progress.utils';
import { CheckCircle2, Clock, RotateCcw, AlertTriangle, Loader2, Sparkles } from 'lucide-react';

interface RetentionPanelProps {
  dueReviews: ReviewDue[];
  onMarkReviewed: (topic: string) => void;
  reviewingTopic: string | null;
  loading: boolean;
}

export function RetentionPanel({ dueReviews, onMarkReviewed, reviewingTopic, loading }: RetentionPanelProps) {
  if (loading) {
    return (
      <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-surface-container-high rounded" />
        <div className="h-24 bg-surface-container-high rounded-xl" />
        <div className="h-24 bg-surface-container-high rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          <h3 className="text-title-medium font-bold text-on-surface">Ebbinghaus Retention & Spaced Reviews</h3>
        </div>
        {dueReviews.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-label-sm font-medium border border-amber-500/30">
            {dueReviews.length} Due
          </span>
        )}
      </div>

      {dueReviews.length === 0 ? (
        <div className="p-6 rounded-xl bg-surface-container-high/40 text-center flex flex-col items-center justify-center space-y-2 border border-outline-variant/10">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-body-md font-bold text-on-surface">Memory Fresh & Up to Date!</h4>
          <p className="text-body-sm text-on-surface-variant max-w-xs">
            No topics currently require spaced repetition based on the Ebbinghaus decay model.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {dueReviews.map((item, idx) => {
            const urgency = reviewUrgency(item.due_date);
            const retentionPct = pct(item.decayed_mastery);
            const isReviewing = reviewingTopic === item.topic;

            const ringColor =
              item.decayed_mastery >= 0.7
                ? 'text-emerald-500'
                : item.decayed_mastery >= 0.4
                ? 'text-amber-500'
                : 'text-rose-500';

            const strokeDashoffset = 125.6 - (125.6 * item.decayed_mastery);

            return (
              <motion.div
                key={item.topic}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={`p-4 rounded-xl bg-surface-container-high/60 border flex flex-col gap-3 transition-all ${
                  urgency === 'overdue'
                    ? 'border-rose-500/30 hover:border-rose-500/50'
                    : 'border-outline-variant/20 hover:border-primary/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-body-md font-bold text-on-surface">{item.topic}</h4>
                      {urgency === 'overdue' && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </span>
                      )}
                    </div>
                    <p className="text-body-sm text-on-surface-variant/90 leading-snug">{item.reason}</p>
                  </div>

                  {/* Retention Ring */}
                  <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" className="text-surface-container-highest" fill="transparent" />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="currentColor"
                        strokeWidth="4"
                        className={ringColor}
                        fill="transparent"
                        strokeDasharray="125.6"
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className={`text-[10px] font-bold absolute ${ringColor}`}>{retentionPct}</span>
                  </div>
                </div>

                {/* Metadata details */}
                <div className="flex items-center justify-between text-[11px] text-on-surface-variant bg-surface-container-lowest/60 px-3 py-1.5 rounded-lg border border-outline-variant/10">
                  <span className="flex items-center gap-1">
                    <RotateCcw className="w-3 h-3 text-primary" />
                    Reps: <strong>{item.repetitions}</strong>
                  </span>
                  <span>
                    Ease Factor: <strong>{item.ease_factor.toFixed(1)}</strong>
                  </span>
                  <span>
                    Interval: <strong>{item.interval_days}d</strong>
                  </span>
                </div>

                {/* Action button */}
                <button
                  onClick={() => onMarkReviewed(item.topic)}
                  disabled={isReviewing}
                  className="w-full py-2 px-3 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-on-primary text-label-md font-medium transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {isReviewing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Recording SM-2 Review...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      Mark Topic as Reviewed (SM-2 Advance)
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
