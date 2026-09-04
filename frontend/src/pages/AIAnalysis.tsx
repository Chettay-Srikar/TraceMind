/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TraceMindAnalysisResponse } from '../types';
import {
  Cpu, Activity, AlertTriangle, CheckCircle2, TrendingUp,
  ShieldCheck, ArrowRight, BookOpen, Layers, Sparkles, ExternalLink,
  Info, Database, Clock, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AIAnalysis: React.FC = () => {
  const [analysis, setAnalysis] = useState<TraceMindAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalysis = async () => {
    try {
      const data = await api.getAnalysis();
      setAnalysis(data);
    } catch (err) {
      console.error("Failed to load analysis:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalysis();
  };

  return (
    <div className="space-y-6 animate-pop-up pb-12">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-mono text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI INVESTIGATOR & CAUSAL CORRELATION ENGINE</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Cpu className="w-7 h-7 text-emerald-400" />
            AI Incident Intelligence
          </h1>
          <p className="text-xs mt-1 text-slate-400 max-w-2xl leading-relaxed">
            Multi-signal correlation across logs, metrics, and deployment history to diagnose root cause and synthesize remediation evidence.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-ghost text-xs flex items-center gap-1.5 border border-slate-700 text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{refreshing ? 'Evaluating Signals...' : 'Re-run Analysis'}</span>
          </button>

          <Link
            to="/app/recommendations"
            className="btn btn-primary text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:scale-105 transition-transform"
          >
            <span>View Ranked Recommendations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Top Summary Ribbons ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex flex-col justify-between border border-slate-800 bg-slate-900/60">
          <span className="text-xs font-medium text-slate-400">Incident Classification</span>
          <div className="my-2">
            <span className="badge badge-critical text-[10px]">CRITICAL SEVERITY</span>
            <div className="text-sm font-bold text-white mt-1">Database Exhaustion</div>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">INC-001 · payment-service</span>
        </div>

        <div className="card p-4 flex flex-col justify-between border border-slate-800 bg-slate-900/60">
          <span className="text-xs font-medium text-slate-400">AI Confidence Score</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-400">{analysis?.confidence || 94}%</span>
            <span className="text-xs text-slate-400">Strong causal fit</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '94%' }} />
          </div>
        </div>

        <div className="card p-4 flex flex-col justify-between border border-slate-800 bg-slate-900/60">
          <span className="text-xs font-medium text-slate-400">Affected Component</span>
          <div className="my-2">
            <div className="text-sm font-mono font-bold text-white">payment-service:v2.4</div>
            <div className="text-xs text-red-400 mt-0.5">100/100 DB Handles Active</div>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Deployed: 10:20:00 UTC</span>
        </div>

        <div className="card p-4 flex flex-col justify-between border border-slate-800 bg-slate-900/60">
          <span className="text-xs font-medium text-slate-400">Primary Recommendation</span>
          <div className="my-2">
            <div className="text-sm font-bold text-emerald-400 truncate">Rollback v2.4 → v2.3</div>
            <div className="text-xs text-slate-300 mt-0.5">Est. Recovery: 1-2 min</div>
          </div>
          <span className="text-[11px] text-slate-500">Immediate reversibility</span>
        </div>
      </div>

      {/* ── Main Investigation Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Column: Correlation Overview & Causal Chain (7 Cols) ── */}
        <div className="lg:col-span-7 space-y-6">

          {/* Root Cause Card */}
          <div className="card p-5 border border-emerald-500/30 bg-slate-900/70 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
                  <AlertTriangle className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Likely Root Cause Diagnosis</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Derived from Logs + Metrics + Deployments</span>
                </div>
              </div>
              <span className="badge badge-success text-xs font-mono">94% Confidence</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-500" />
              <p className="text-xs text-slate-200 leading-relaxed pl-2">
                <strong className="text-emerald-400 font-semibold font-mono">Payment Service v2.4</strong> deployment at 10:20:00 is strongly correlated with PostgreSQL database connection pool exhaustion. 63 seconds post-deployment, connections saturated at 100/100, triggering cascading HTTP 500 timeouts and surging P95 latency to 4,800 ms.
              </p>
            </div>

            {/* Causal Relationship Flow Diagram */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Causal Relationship Flow
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 font-mono flex items-center justify-center text-[10px] font-bold">1</span>
                  <span className="font-semibold text-white">v2.4 Deploy</span>
                </div>
                <span className="text-slate-600">→</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 font-mono flex items-center justify-center text-[10px] font-bold">2</span>
                  <span className="font-semibold text-white">DB Timeouts</span>
                </div>
                <span className="text-slate-600">→</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-md bg-red-500/20 text-red-400 font-mono flex items-center justify-center text-[10px] font-bold">3</span>
                  <span className="font-semibold text-white">Pool Saturation (100/100)</span>
                </div>
                <span className="text-slate-600">→</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-md bg-red-500/20 text-red-400 font-mono flex items-center justify-center text-[10px] font-bold">4</span>
                  <span className="font-semibold text-white">42.7% Error Spike</span>
                </div>
              </div>
            </div>

            {/* Evidence Checklist */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Correlated Telemetry Evidence Chain
              </div>
              <div className="space-y-2">
                {[
                  { time: '10:20:00', text: 'Payment Service v2.4 deployed (from v2.3)', type: 'Deployment' },
                  { time: '10:21:03', text: 'Database errors began in logs ("Connection pool exhausted")', type: 'Log Signal' },
                  { time: '10:22:00', text: 'DB connections reached ceiling (35 → 100/100)', type: 'Metric Anomaly' },
                  { time: '10:22:00', text: 'Error rate increased from baseline 1.2% to 42.7%', type: 'Impact' },
                  { time: '10:22:00', text: 'Response latency surged from 180ms to 4,800ms', type: 'Customer Impact' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 flex items-center justify-between gap-2">
                      <span className="text-slate-200">{item.text}</span>
                      <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Technical Limitation Transparency Box */}
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/25 flex items-start gap-3 text-xs text-slate-300">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Defensible AI Decision Boundary:</strong>
              The AI does not assert certainty as an empirical proof. It formulates a probabilistic, evidence-weighted hypothesis: <em className="text-blue-300">Likely Root Cause + Evidence Chain + Confidence Interval</em>. This provides transparent decision support for human SRE authorization.
            </div>
          </div>

        </div>

        {/* ── Right Column: External Solution Research & Platform Fit (5 Cols) ── */}
        <div className="lg:col-span-5 space-y-6">

          {/* External Research Engine Box */}
          <div className="card p-5 border border-slate-800 bg-slate-900/70 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">External Solution Research</h3>
                  <span className="text-[10px] text-slate-400">Automated Technical Synthesis</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">3 Sources Synthesized</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              The AI engine queried external technical documentation, official database guidelines, and engineering playbooks to extract proven remediation approaches:
            </p>

            <div className="space-y-3">
              {[
                {
                  title: 'Mitigating Incidents: Rollback First, Diagnose Later',
                  source: 'Google SRE Book - Chapter 17',
                  tag: 'SRE Playbook',
                  summary: 'When a critical failure closely follows a deployment, prioritizing instant rollback minimizes MTTR. Deep root-cause debugging should be conducted offline.'
                },
                {
                  title: 'Handling Idle In Transaction Sessions & Pool Saturation',
                  source: 'PostgreSQL Documentation (v15)',
                  tag: 'Official Docs',
                  summary: 'Configure aggressive idle transaction timeouts and pool reap intervals to avoid thread starvation when application workers leak sockets.'
                },
                {
                  title: 'Connection Leak Detection & Pool Sizing',
                  source: 'HikariCP Best Practices',
                  tag: 'Engineering Post',
                  summary: 'Enable leakDetectionThreshold=5000ms to automatically capture thread stack traces of unclosed connection handles in staging environments.'
                }
              ].map((res, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{res.title}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {res.tag}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400">{res.source}</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic">
                    "{res.summary}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Platform Relevance Card */}
          <div className="card p-5 border border-slate-800 bg-slate-900/70 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Relevant Platform Capabilities</span>
              <Link to="/app/providers" className="text-[11px] text-emerald-400 hover:underline">
                View All →
              </Link>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="font-bold text-white">Dynatrace</span>
                <span className="text-slate-400 font-mono text-[11px]">Davis AI causal topology</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="font-bold text-white">PagerDuty</span>
                <span className="text-slate-400 font-mono text-[11px]">Rollback runbook automation</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="font-bold text-white">Datadog</span>
                <span className="text-slate-400 font-mono text-[11px]">Postgres DBM query explain</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
