import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { TopicMastery } from '../../api/ml.api';
import { masteryColor, pct, timeAgo } from '../../utils/progress.utils';
import { Zap, ArrowUpDown, CheckCircle2, XCircle, Target, BookOpen, HelpCircle } from 'lucide-react';

interface TopicMasteryGridProps {
  topics: TopicMastery[];
  loading: boolean;
}

export function TopicMasteryGrid({ topics, loading }: TopicMasteryGridProps) {
  const [sortAscending, setSortAscending] = useState(false);

  const sortedTopics = useMemo(() => {
    return [...topics].sort((a, b) => {
      return sortAscending ? a.mastery - b.mastery : b.mastery - a.mastery;
    });
  }, [topics, sortAscending]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-36 bg-surface-container-high rounded animate-pulse" />
          <div className="h-8 w-28 bg-surface-container-high rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-surface-container-low border border-outline-variant/10 animate-pulse p-4" />
          ))}
        </div>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-surface-container-low border border-outline-variant/10 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <BookOpen className="w-8 h-8" />
        </div>
        <div className="max-w-md space-y-1">
          <h4 className="text-title-medium font-bold text-on-surface">No Topic Mastery Data Yet</h4>
          <p className="text-body-md text-on-surface-variant">
            Complete a quiz to let the IRT & Elo engines analyze your knowledge across topics!
          </p>
        </div>
        <Link
          to="/quizzes"
          className="px-4 py-2 rounded-xl bg-primary text-on-primary font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
        >
          Take a Quiz
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-title-lg font-title-lg text-on-surface">Topic Mastery (IRT & Elo)</h3>
          <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-label-sm font-mono text-on-surface-variant">
            {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
          </span>
        </div>

        <button
          onClick={() => setSortAscending(!sortAscending)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 text-label-md font-label-md text-on-surface-variant hover:text-on-surface transition-all"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
          {sortAscending ? 'Weakest First' : 'Highest First'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedTopics.map((item, idx) => {
          const colors = masteryColor(item.mastery);
          const accuracy = item.attempts > 0 ? Math.round((item.correct_count / item.attempts) * 100) : 0;

          return (
            <motion.div
              key={item.topic}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10 flex flex-col justify-between hover:border-outline-variant/30 transition-all group"
            >
              <div>
                {/* Header: Title + Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="font-title-medium text-title-medium text-on-surface truncate group-hover:text-primary transition-colors">
                    {item.topic}
                  </h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-label-sm font-medium border uppercase tracking-wider flex-shrink-0 ${colors.badgeBg}`}>
                    {item.status}
                  </span>
                </div>

                {/* Mastery Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between items-center text-label-md">
                    <span className="text-on-surface-variant font-medium">Mastery</span>
                    <span className={`font-bold ${colors.text}`}>{pct(item.mastery)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                    <motion.div
                      className={`h-full ${colors.bar}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.mastery * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                    />
                  </div>
                </div>

                {/* Micro Stats Row */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-surface-container-high/50 text-center mb-3">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-emerald-500 text-label-sm font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {item.correct_count}
                    </div>
                    <span className="text-[10px] text-on-surface-variant uppercase">Correct</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-rose-500 text-label-sm font-medium">
                      <XCircle className="w-3.5 h-3.5" />
                      {item.wrong_count}
                    </div>
                    <span className="text-[10px] text-on-surface-variant uppercase">Wrong</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-primary text-label-sm font-medium">
                      <Target className="w-3.5 h-3.5" />
                      {accuracy}%
                    </div>
                    <span className="text-[10px] text-on-surface-variant uppercase">Accuracy</span>
                  </div>
                </div>

                {/* Confidence bar & Elo */}
                <div className="space-y-2 text-label-sm">
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      Confidence
                      <span title="Confidence grows with more quiz attempts" className="cursor-help text-on-surface-variant/60 hover:text-on-surface-variant">
                        <HelpCircle className="w-3 h-3" />
                      </span>
                    </span>
                    <span className="font-mono text-on-surface">{pct(item.confidence)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-surface-container-highest overflow-hidden">
                    <div
                      className="h-full bg-primary/70"
                      style={{ width: `${item.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-outline-variant/10 text-[11px] text-on-surface-variant">
                <span className="font-mono bg-surface-container-highest px-2 py-0.5 rounded text-primary flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {Math.round(item.elo_rating)} ELO
                </span>
                <span>Updated {timeAgo(item.updated_at)}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
