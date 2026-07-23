import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, ShieldCheck, Zap, Activity, Bug, ArrowRight, Terminal, CheckCircle2, Layers } from 'lucide-react';

export default function Landing() {
  const [testPrompt, setTestPrompt] = useState("Write a Python binary search function with O(log n) complexity");
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>({
    intent: "coding",
    selected_model: "qwen2.5-coder:7b",
    confidence_pct: 70.0,
    policy_used: "coding_policy_v1",
    timeline_ms: { security_check: 0.05, intent_classification: 0.02, decision_scoring: 12.4, total: 12.47 },
    score_contributions: {
      capability: "45% (Rating: 9.3/10)",
      benchmark: "35% (Pass Rate: 7.0/10)",
      speed: "10% (Speed: 6.0/10)",
      resources: "10% (Hardware: 5.7/10)"
    }
  });

  const handleSimulate = (promptText: string) => {
    setSimulating(true);
    setTimeout(() => {
      const isMath = promptText.toLowerCase().includes("math") || promptText.toLowerCase().includes("integral") || promptText.toLowerCase().includes("calculate");
      setSimResult({
        intent: isMath ? "math" : "coding",
        selected_model: isMath ? "qwen3:4b" : "qwen2.5-coder:7b",
        confidence_pct: isMath ? 88.5 : 70.0,
        policy_used: isMath ? "reasoning_policy_v1" : "coding_policy_v1",
        timeline_ms: { security_check: 0.05, intent_classification: 0.02, decision_scoring: 14.1, total: 14.17 },
        score_contributions: {
          capability: isMath ? "40% (Rating: 8.8/10)" : "45% (Rating: 9.3/10)",
          benchmark: isMath ? "35% (Pass Rate: 8.5/10)" : "35% (Pass Rate: 7.0/10)",
          speed: "15% (Speed: 8.0/10)",
          resources: "10% (Hardware: 6.5/10)"
        }
      });
      setSimulating(false);
    }, 400);
  };

  return (
    <div className="bg-[#0b0f17] font-sans text-slate-100 min-h-screen overflow-x-hidden relative selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Background Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/15 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-cyan-600/15 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '3s' }} />
        <div className="absolute top-[40%] left-[30%] w-[35vw] h-[35vw] bg-purple-600/10 rounded-full blur-[150px]" />
      </div>

      {/* Navigation Bar */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[#0b0f17]/70 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#0f172a] rounded-[11px] flex items-center justify-center font-bold text-transparent bg-clip-text bg-gradient-to-tr from-indigo-400 to-cyan-300">
                <Cpu className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white block">PaathShala AI</span>
              <span className="text-[10px] font-mono text-cyan-400 tracking-wider uppercase block -mt-1">LocalAI Router OS</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#playground" className="hover:text-cyan-400 transition-colors">Live Teaser</a>
            <a href="#architecture" className="hover:text-cyan-400 transition-colors">Architecture</a>
            <a href="#sre" className="hover:text-cyan-400 transition-colors">SRE & Jira Engine</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-2">
              Login
            </Link>
            <Link to="/ai-tutor" className="relative group overflow-hidden rounded-xl p-[1px] focus:outline-none">
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-xl transition-all duration-300 group-hover:opacity-90" />
              <span className="relative block px-5 py-2.5 rounded-[11px] bg-[#0f172a] text-sm font-semibold text-white transition-colors group-hover:bg-transparent">
                Launch Router Playground →
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-24">
        
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 text-center pt-8 pb-16">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-mono text-cyan-300 shadow-inner mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>🟢 Status: 99.9% SLO Availability | Local Runtime Active</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.15] max-w-5xl mx-auto">
            Intelligent Multi-Agent <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400">
              Model Router & Autonomous SRE Platform
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Route prompts dynamically across local models (<code className="text-indigo-300 font-mono text-sm bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/50">Qwen2.5-Coder</code>, <code className="text-indigo-300 font-mono text-sm bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/50">Llama3</code>, <code className="text-indigo-300 font-mono text-sm bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/50">Gemma</code>) and cloud fallbacks with 4-factor scoring, auto-healing recovery, and AI-assisted Jira incident management.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/ai-tutor" className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold text-base shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
              <span>Explore AI Router Playground</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#architecture" className="px-8 py-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-base transition-all flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <span>View Architecture Specs</span>
            </a>
          </div>

          {/* SRE Stats Banner */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
            <div className="p-3 text-center border-r border-slate-800/80">
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider block">Platform Tests</span>
              <span className="text-2xl font-bold text-emerald-400 mt-1 block">16/16 Passed</span>
            </div>
            <div className="p-3 text-center border-r border-slate-800/80">
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider block">Mean MTTR</span>
              <span className="text-2xl font-bold text-cyan-400 mt-1 block">12.4 sec</span>
            </div>
            <div className="p-3 text-center border-r border-slate-800/80">
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider block">Router Latency</span>
              <span className="text-2xl font-bold text-indigo-400 mt-1 block">&lt; 14 ms</span>
            </div>
            <div className="p-3 text-center">
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider block">Explainability</span>
              <span className="text-2xl font-bold text-purple-400 mt-1 block">100% Deterministic</span>
            </div>
          </div>
        </section>

        {/* Live Teaser Sandbox Section */}
        <section id="playground" className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-2">Live Router Test</span>
            <h2 className="text-3xl font-bold text-white">Test Intent Classification & XAI Scoring</h2>
          </div>

          <div className="max-w-4xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-sm"
                placeholder="Enter prompt to evaluate..."
              />
              <button
                onClick={() => handleSimulate(testPrompt)}
                disabled={simulating}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {simulating ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Zap className="w-4 h-4 text-cyan-300" />}
                <span>Evaluate Route</span>
              </button>
            </div>

            {/* Quick Sample Chips */}
            <div className="flex flex-wrap gap-2 mt-4 items-center">
              <span className="text-xs text-slate-500 font-mono">Sample Prompts:</span>
              <button
                onClick={() => { setTestPrompt("Write a Python binary search function"); handleSimulate("Write a Python binary search function"); }}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-full font-mono transition-colors"
              >
                Coding (Python)
              </button>
              <button
                onClick={() => { setTestPrompt("Calculate the integral of sin(x) * cos(x)"); handleSimulate("Calculate the integral of sin(x) * cos(x)"); }}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-full font-mono transition-colors"
              >
                Math (Calculus)
              </button>
            </div>

            {/* Output Card */}
            {simResult && (
              <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-slate-400 uppercase">Selected Model</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      {simResult.confidence_pct}% Confidence
                    </span>
                  </div>
                  <div className="text-lg font-bold text-cyan-300 font-mono mb-2">{simResult.selected_model}</div>
                  <div className="text-xs text-slate-400 space-y-1 font-mono">
                    <div>Intent: <span className="text-indigo-300">{simResult.intent}</span></div>
                    <div>Policy: <span className="text-slate-300">{simResult.policy_used}</span></div>
                    <div>Decision Latency: <span className="text-emerald-400">{simResult.timeline_ms.decision_scoring} ms</span></div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-mono text-slate-400 uppercase block mb-3">4-Factor Score Contributions</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(simResult.score_contributions || {}).map(([key, val]) => (
                      <div key={key} className="bg-slate-900/80 p-2 rounded border border-slate-800/50">
                        <span className="text-slate-400 uppercase font-mono block text-[10px]">{key}</span>
                        <span className="text-slate-200 font-medium">{val as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-2">Core Platform Pillars</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white">Built for SRE & AI Engineering Excellence</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-300 backdrop-blur-xl group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Deterministic 4-Factor Router</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Evaluates capability ratings, benchmark pass rates, hardware resources, and model speed to choose the optimal local or cloud model.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/50 transition-all duration-300 backdrop-blur-xl group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Autonomous Auto-Healing Engine</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Runs health probes every 30s, enforcing a 3-failure / 60s cooldown circuit breaker, automatic container restarts, and safe Docker log pruning.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/50 transition-all duration-300 backdrop-blur-xl group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Bug className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI Jira Incident Subsystem</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Event-driven Jira integration with automated 15-minute deduplication, cross-service correlation, RCA zip packaging, and AI postmortem generation.
              </p>
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 bg-[#070a0f] text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-white">PaathShala LocalAI Router OS</span>
          </div>
          <p>© 2026 PaathShala AI. Built for SRE, AI Engineering & Production Systems.</p>
        </div>
      </footer>

    </div>
  );
}
