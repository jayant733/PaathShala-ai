import React from 'react';

interface TimelineProps {
  timeline: {
    security_check?: number;
    intent_classification?: number;
    complexity_and_context?: number;
    decision_scoring?: number;
    execution?: number;
    validation?: number;
    total?: number;
  };
}

export const VisualRouterGraph: React.FC<TimelineProps> = ({ timeline }) => {
  const steps = [
    { label: 'Security', ms: timeline?.security_check || 0, icon: 'shield' },
    { label: 'Intent', ms: timeline?.intent_classification || 0, icon: 'psychology' },
    { label: 'Complexity', ms: timeline?.complexity_and_context || 0, icon: 'analytics' },
    { label: 'Decision', ms: timeline?.decision_scoring || 0, icon: 'tune' },
    { label: 'Execution', ms: timeline?.execution || 0, icon: 'memory' },
    { label: 'Validation', ms: timeline?.validation || 0, icon: 'fact_check' },
  ];

  return (
    <div className="w-full bg-surface-container-low/60 backdrop-blur-md rounded-xl p-4 border border-outline-variant/10 my-4">
      <h4 className="text-label-sm uppercase tracking-wider text-on-surface-variant mb-3 font-semibold flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-[18px]">timeline</span>
        Router Execution Timeline
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {steps.map((s, idx) => (
          <div key={idx} className="bg-surface-container-high/40 p-2.5 rounded-lg border border-outline-variant/10 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-primary text-[20px] mb-1">{s.icon}</span>
            <span className="text-label-sm text-on-surface font-medium">{s.label}</span>
            <span className="text-label-sm text-primary font-mono mt-0.5">{s.ms} ms</span>
          </div>
        ))}
      </div>
    </div>
  );
};
