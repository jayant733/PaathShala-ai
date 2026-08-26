import { motion } from 'framer-motion';
import type { MasterySummary } from '../../api/ml.api';
import { Award, Flame, AlertCircle, ShieldCheck } from 'lucide-react';

interface HeroSummaryRowProps {
  mastery: MasterySummary | null;
  loading: boolean;
}

export function HeroSummaryRow({ mastery, loading }: HeroSummaryRowProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-surface-container-low border border-outline-variant/10 animate-pulse p-4 flex flex-col justify-between" />
        ))}
      </div>
    );
  }

  const goalProgress = mastery?.goal_progress ?? 0;
  const strokeDashoffset = 251.3 - (251.3 * goalProgress) / 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Overall Mastery Ring */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10 flex items-center justify-between shadow-sm hover:border-outline-variant/30 transition-all"
      >
        <div>
          <p className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Overall Mastery</p>
          <h3 className="text-display-sm font-bold text-on-surface mt-1">{goalProgress}%</h3>
          <p className="text-body-sm text-on-surface-variant/80 mt-0.5">Average across all topics</p>
        </div>
        <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="currentColor"
              strokeWidth="7"
              className="text-surface-container-highest"
              fill="transparent"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="36"
              stroke="currentColor"
              strokeWidth="7"
              className={goalProgress >= 70 ? 'text-emerald-500' : goalProgress >= 40 ? 'text-amber-500' : 'text-rose-500'}
              fill="transparent"
              strokeDasharray="251.3"
              initial={{ strokeDashoffset: 251.3 }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>
          <Award className="w-6 h-6 absolute text-primary" />
        </div>
      </motion.div>

      {/* Strong / Mastered */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10 flex items-center justify-between shadow-sm hover:border-outline-variant/30 transition-all"
      >
        <div>
          <p className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Mastered</p>
          <h3 className="text-display-sm font-bold text-emerald-500 mt-1">{mastery?.strong_count ?? 0}</h3>
          <p className="text-body-sm text-on-surface-variant/80 mt-0.5">Topics ≥ 70% confidence</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
      </motion.div>

      {/* Building Up */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10 flex items-center justify-between shadow-sm hover:border-outline-variant/30 transition-all"
      >
        <div>
          <p className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Building Up</p>
          <h3 className="text-display-sm font-bold text-amber-500 mt-1">{mastery?.improving_count ?? 0}</h3>
          <p className="text-body-sm text-on-surface-variant/80 mt-0.5">Topics between 40-70%</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
          <Flame className="w-6 h-6" />
        </div>
      </motion.div>

      {/* Needs Work */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10 flex items-center justify-between shadow-sm hover:border-outline-variant/30 transition-all"
      >
        <div>
          <p className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Needs Work</p>
          <h3 className="text-display-sm font-bold text-rose-500 mt-1">{mastery?.weak_count ?? 0}</h3>
          <p className="text-body-sm text-on-surface-variant/80 mt-0.5">Topics under 40% mastery</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-6 h-6" />
        </div>
      </motion.div>
    </div>
  );
}
