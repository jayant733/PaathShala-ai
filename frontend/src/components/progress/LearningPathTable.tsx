import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { LearningPathResponse } from '../../api/ml.api';
import { pct } from '../../utils/progress.utils';
import { Compass, ChevronRight, BookOpen } from 'lucide-react';

interface LearningPathTableProps {
  path: LearningPathResponse | null;
  loading: boolean;
}

export function LearningPathTable({ path, loading }: LearningPathTableProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-surface-container-high rounded" />
        <div className="h-32 bg-surface-container-high rounded-xl" />
      </div>
    );
  }

  const items = path?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/10 text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Compass className="w-6 h-6" />
        </div>
        <h4 className="text-body-md font-bold text-on-surface">No Learning Path Generated Yet</h4>
        <p className="text-body-sm text-on-surface-variant max-w-sm mx-auto">
          Take quizzes to help the IRT engine rank your topics by difficulty and generate personalized next steps.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary" />
          <h3 className="text-title-medium font-bold text-on-surface">IRT Recommended Learning Path</h3>
        </div>
        <span className="text-label-sm text-on-surface-variant font-mono">
          Ranked Weakest → Strongest
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/10 text-label-sm font-label-md text-on-surface-variant">
              <th className="pb-3 pl-2 w-12">#</th>
              <th className="pb-3">Topic</th>
              <th className="pb-3">Mastery</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Suggested Action</th>
              <th className="pb-3 text-right pr-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10 text-body-sm">
            {items.map((item, idx) => {
              const statusColor =
                item.status === 'strong'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : item.status === 'improving'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30';

              return (
                <motion.tr
                  key={item.topic}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                  className="hover:bg-surface-container-high/40 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/quizzes/create?prompt=${encodeURIComponent(`Quiz on ${item.topic}`)}`)}
                >
                  <td className="py-3.5 pl-2 font-mono font-bold text-on-surface-variant/80">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 font-bold text-on-surface group-hover:text-primary transition-colors">
                    {item.topic}
                    {item.next_topics && item.next_topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.next_topics.map((nt) => (
                          <span key={nt} className="px-1.5 py-0.5 rounded bg-surface-container-highest text-[10px] text-on-surface-variant font-normal">
                            {nt}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 font-mono font-medium text-on-surface">
                    {pct(item.mastery)}
                  </td>
                  <td className="py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border uppercase tracking-wider ${statusColor}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-on-surface-variant max-w-xs leading-snug">
                    {item.suggested_action}
                  </td>
                  <td className="py-3.5 text-right pr-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/quizzes/create?prompt=${encodeURIComponent(`Quiz on ${item.topic}`)}`);
                      }}
                      className="p-1.5 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface-variant transition-all inline-flex items-center gap-1 text-label-sm font-medium"
                      title="Practice this topic"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
