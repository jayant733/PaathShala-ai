import React, { useState } from 'react';

interface JiraIssue {
  key: string;
  summary: string;
  priority: string;
  status: string;
  services: string[];
  created_at: string;
  ai_confidence_pct: number;
}

export const JiraIncidentDashboard: React.FC = () => {
  const [issues] = useState<JiraIssue[]>([
    {
      key: 'LOCALAI-101',
      summary: '[P1 Critical] Backend: Container health check failure',
      priority: 'P1 Critical',
      status: 'AUTO-RECOVERED',
      services: ['backend', 'gateway'],
      created_at: new Date().toISOString(),
      ai_confidence_pct: 89.0
    },
    {
      key: 'LOCALAI-102',
      summary: '[P2 High] Qwen2.5-coder:7b: Quality Validation Failed (Malformed JSON)',
      priority: 'P2 High',
      status: 'OPEN',
      services: ['qwen2.5-coder:7b'],
      created_at: new Date().toISOString(),
      ai_confidence_pct: 92.5
    }
  ]);

  return (
    <div className="bg-surface-container/80 backdrop-blur-md rounded-xl p-5 border border-outline-variant/20 shadow-md space-y-4 my-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-outline-variant/10 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-[24px]">bug_report</span>
          <div>
            <h3 className="font-title-lg text-title-lg font-bold text-on-surface">Jira Incident & SRE Operations</h3>
            <p className="text-body-sm text-on-surface-variant">Event-Driven Incident Subsystem & AI Root Cause Analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 rounded-full text-label-sm font-medium border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Connected (Mock Engine)
          </span>
          <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant rounded-full text-label-sm font-mono">
            Project: LOCALAI
          </span>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface-container-high/40 p-3 rounded-lg border border-outline-variant/10">
          <span className="text-label-sm text-on-surface-variant block">Total Incidents</span>
          <span className="text-title-lg font-bold text-on-surface">14</span>
        </div>
        <div className="bg-surface-container-high/40 p-3 rounded-lg border border-outline-variant/10">
          <span className="text-label-sm text-amber-400 block">Open Tickets</span>
          <span className="text-title-lg font-bold text-amber-400">3</span>
        </div>
        <div className="bg-surface-container-high/40 p-3 rounded-lg border border-outline-variant/10">
          <span className="text-label-sm text-emerald-400 block">Auto-Recovered</span>
          <span className="text-title-lg font-bold text-emerald-400">11</span>
        </div>
        <div className="bg-surface-container-high/40 p-3 rounded-lg border border-outline-variant/10">
          <span className="text-label-sm text-primary block">Avg MTTR</span>
          <span className="text-title-lg font-bold text-primary">12.4s</span>
        </div>
      </div>

      {/* Incident List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/10 text-label-sm text-on-surface-variant">
              <th className="py-2.5 px-3">Ticket Key</th>
              <th className="py-2.5 px-3">Summary</th>
              <th className="py-2.5 px-3">Priority</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">AI Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10 text-body-sm">
            {issues.map((iss) => (
              <tr key={iss.key} className="hover:bg-surface-container-high/30 transition-colors">
                <td className="py-3 px-3 font-mono font-semibold text-primary">{iss.key}</td>
                <td className="py-3 px-3 text-on-surface">{iss.summary}</td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-0.5 rounded text-label-sm font-medium ${iss.priority.includes('P1') ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {iss.priority}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-0.5 rounded text-label-sm font-medium ${iss.status === 'AUTO-RECOVERED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {iss.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-on-surface-variant font-mono">{iss.ai_confidence_pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
