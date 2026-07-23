import React from 'react';

interface ExplainabilityProps {
  explainability: {
    selected_model: string;
    confidence_pct: number;
    policy_used: string;
    score_contributions: Record<string, string>;
    candidate_scores: Array<Record<string, number>>;
  };
  timeline_ms: Record<string, number>;
}

export const ExplainabilityCard: React.FC<ExplainabilityProps> = ({ explainability, timeline_ms }) => {
  if (!explainability) return null;

  return (
    <div className="bg-surface-container/80 backdrop-blur-md rounded-xl p-4 border border-outline-variant/20 shadow-md space-y-3 my-4">
      <div className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">auto_awesome</span>
          <h4 className="font-title-md text-title-md text-on-surface font-semibold">Router Decision Explanation</h4>
        </div>
        <span className="px-2.5 py-1 bg-primary/15 text-primary rounded-full text-label-sm font-medium">
          {explainability.confidence_pct}% Confidence
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 py-1">
        {Object.entries(explainability.score_contributions || {}).map(([key, val]) => (
          <div key={key} className="bg-surface-container-high/50 p-2 rounded-lg text-center">
            <span className="text-label-sm text-on-surface-variant uppercase tracking-wider block">{key}</span>
            <span className="text-body-md font-medium text-on-surface">{val}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-outline-variant/10 pt-2 text-label-sm text-on-surface-variant flex flex-wrap gap-4">
        <span>Policy: <strong className="text-on-surface">{explainability.policy_used}</strong></span>
        <span>Decision Time: <strong className="text-primary">{timeline_ms?.decision_scoring || 0} ms</strong></span>
        <span>Total Pipeline: <strong className="text-primary">{timeline_ms?.total || 0} ms</strong></span>
      </div>
    </div>
  );
};
