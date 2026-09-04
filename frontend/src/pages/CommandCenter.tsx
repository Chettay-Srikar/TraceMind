/* eslint-disable */
import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, Clock, Database,
  Activity, ShieldCheck, ArrowRight, Cpu, Wifi, AlertTriangle, Sparkles, ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';
import { Link } from 'react-router-dom';
import { api, checkBackendStatus } from '../services/api';
import { LogImportCenter } from '../components/import/LogImportCenter';
import { SystemHealthResponse, LogEntry, TraceMindAnalysisResponse } from '../types';

type IncidentScenario = 'critical_db' | 'healthy_normal' | 'memory_leak' | 'latency_spike';

export const CommandCenter: React.FC = () => {
  const [scenario, setScenario] = useState<IncidentScenario>('critical_db');
  const [backendOnline, setBackendOnline] = useState(false);
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [latestLog, setLatestLog] = useState<LogEntry | null>(null);
  const [analysis, setAnalysis] = useState<TraceMindAnalysisResponse | null>(null);
  
  // Poll backend health & latest log
  useEffect(() => {
    let mounted = true;

    const syncBackend = async () => {
      const isLive = await checkBackendStatus();
      if (!mounted) return;
      setBackendOnline(isLive);

      try {
        const [h, l, a] = await Promise.all([
          api.getHealth(),
          api.getLatestLog(),
          api.getAnalysis()
        ]);
        if (!mounted) return;
        setHealth(h);
        setLatestLog(l);
        setAnalysis(a);
      } catch (err) {
        console.warn("Backend sync notice:", err);
      }
    };

    syncBackend();
    const interval = setInterval(syncBackend, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Telemetry Chart Data for Scenario
  const handleAnalysisSuccess = async () => {
    const a = await api.getAnalysis();
    setAnalysis(a);
  };

  const chartData = Array.from({ length: 30 }, (_, i) => {
        const sec = (i * 2).toString().padStart(2, '0');
    const timeLabel = `10:${sec}`;

    if (scenario === 'healthy_normal') {
      return {
        t: timeLabel,
        err: Math.max(0.2, 1.1 + Math.sin(i * 0.4) * 0.3 + (Math.random() * 0.2)),
        lat: Math.floor(160 + Math.sin(i * 0.3) * 15 + Math.random() * 10),
        db: Math.floor(32 + Math.random() * 5),
      };
    }

    if (scenario === 'critical_db') {
      // At 10:20 (i >= 10), deploy v2.4 happens and metrics spike
      if (i < 10) {
        return {
          t: timeLabel,
          err: 1.2,
          lat: 180,
          db: 35,
        };
      } else if (i < 15) {
        return {
          t: timeLabel,
          err: 12.4 + (i - 10) * 4,
          lat: 600 + (i - 10) * 400,
          db: 55 + (i - 10) * 9,
        };
      } else {
        return {
          t: timeLabel,
          err: Math.min(48.5, 42.7 + Math.sin(i * 0.5) * 3 + Math.random() * 1.5),
          lat: Math.floor(4800 + Math.sin(i * 0.4) * 200 + Math.random() * 150),
          db: 100,
        };
      }
    }

    if (scenario === 'memory_leak') {
      return {
        t: timeLabel,
        err: i > 15 ? 18.4 + (i - 15) * 1.2 : 0.8,
        lat: i > 15 ? 1200 + (i - 15) * 80 : 150,
        db: 42,
      };
    }

    // latency_spike
    return {
      t: timeLabel,
      err: i > 12 ? 8.5 : 0.6,
      lat: i > 12 ? 5400 : 140,
      db: 40,
    };
  });

  return (
    <div className="space-y-6 pb-12 animate-pop-up">
      {!analysis && <LogImportCenter onSuccess={handleAnalysisSuccess} />}
      
      {analysis && (
        <>

      {/* ── Top Bar: System Status & Hackathon Demo Switcher ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-[#090D1C] border border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${backendOnline ? 'bg-emerald-500 shadow-[0_0_12px_#22C55E]' : 'bg-blue-500 shadow-[0_0_12px_#3B82F6]'}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">IncidentAI Observability Engine</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                backendOnline 
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                  : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
              }`}>
                {backendOnline ? 'FastAPI Connected (Port 8000)' : 'Simulated Production Telemetry'}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3 font-mono">
              <span>DB State: <strong className="text-slate-200">{health?.mongodb_status || 'connected'}</strong></span>
              <span>•</span>
              <span>Telemetry Logs: <strong className="text-slate-200">{health?.total_logs || 1420}</strong></span>
              <span>•</span>
              <span>Health Score: <strong className={scenario === 'critical_db' ? 'text-red-400' : 'text-emerald-400'}>{scenario === 'critical_db' ? '34 / 100' : '98 / 100'}</strong></span>
            </div>
          </div>
        </div>

      </div>

      
      {/* ── Main Incident Banner ── */}
      {analysis?.incident ? (
        <div className="p-5 rounded-xl border border-red-500/40 bg-gradient-to-r from-red-950/40 via-[#130B1A] to-slate-950 shadow-[0_0_30px_rgba(239,68,68,0.15)] animate-pop-up">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 mt-0.5">
                <AlertTriangle className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold tracking-wider ${analysis.incident.severity === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'}`}>
                    {analysis.incident.severity === 'CRITICAL' ? '🔴 CRITICAL' : '⚠️ WARNING'} INCIDENT
                  </span>
                  <span className="font-mono text-xs text-red-300 font-semibold">{analysis.incident.incident_id || 'INC-001'}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-300 font-mono">{analysis.incident.affected_service || 'unknown-service'}</span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {analysis.incident.incident_type || 'Unknown Incident'}
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {analysis.incident.description || 'System anomaly detected. Investigating telemetry patterns.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/app/analysis"
                className="btn btn-primary text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:scale-105 transition-transform"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>AI Root Cause & Evidence</span>
              </Link>
              <Link
                to="/app/recommendations"
                className="btn btn-ghost text-xs flex items-center gap-1.5 border border-slate-700 hover:border-emerald-500 text-slate-200"
              >
                <span>Ranked Recommendations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      ) : backendOnline && scenario === 'healthy_normal' ? (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/15 flex items-center justify-between gap-4 animate-pop-up">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">🟢 System Healthy</div>
              <div className="text-sm font-semibold text-white">All microservices running within nominal operational bounds</div>
            </div>
          </div>
          <span className="badge badge-success">0 ACTIVE INCIDENTS</span>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/15 flex items-center justify-between gap-4 animate-pop-up">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">⚠️ System Degraded</div>
              <div className="text-sm font-semibold text-white">
                {scenario === 'memory_leak' ? 'Worker Node Memory Pressure (98% heap)' : 'Downstream API Latency Spike (5400ms)'}
              </div>
            </div>
          </div>
          <span className="badge badge-warning">INVESTIGATING</span>
        </div>
      )}

      {/* ── 4 Telemetry KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Error Rate */}
        <div className="card p-4 flex flex-col justify-between card-pop border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Wifi className="w-3.5 h-3.5 text-red-400" /> Error Rate
            </span>
            <span className="text-[10px] font-mono text-slate-500">Baseline 1.2%</span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">
              {scenario === 'critical_db' ? '42.7%' : scenario === 'healthy_normal' ? '0.3%' : '18.4%'}
            </span>
            <span className={`text-xs font-semibold flex items-center ${scenario === 'critical_db' ? 'text-red-400' : 'text-emerald-400'}`}>
              {scenario === 'critical_db' ? '+41.5% spike' : '−0.9% nominal'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${scenario === 'critical_db' ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: scenario === 'critical_db' ? '85%' : '15%' }}
            />
          </div>
        </div>

        {/* KPI 2: Latency */}
        <div className="card p-4 flex flex-col justify-between card-pop border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> P95 Latency
            </span>
            <span className="text-[10px] font-mono text-slate-500">Baseline 180ms</span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">
              {scenario === 'critical_db' ? '4,800 ms' : scenario === 'healthy_normal' ? '98 ms' : '1,200 ms'}
            </span>
            <span className={`text-xs font-semibold flex items-center ${scenario === 'critical_db' ? 'text-red-400' : 'text-emerald-400'}`}>
              {scenario === 'critical_db' ? '26.6x spike' : 'Normal'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${scenario === 'critical_db' ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: scenario === 'critical_db' ? '95%' : '20%' }}
            />
          </div>
        </div>

        {/* KPI 3: DB Connections */}
        <div className="card p-4 flex flex-col justify-between card-pop border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-emerald-400" /> DB Connections
            </span>
            <span className="text-[10px] font-mono text-slate-500">Max Limit: 100</span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">
              {scenario === 'critical_db' ? '100 / 100' : scenario === 'healthy_normal' ? '35 / 100' : '42 / 100'}
            </span>
            <span className={`text-xs font-semibold flex items-center ${scenario === 'critical_db' ? 'text-red-400' : 'text-emerald-400'}`}>
              {scenario === 'critical_db' ? 'Exhausted' : '65 Free'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${scenario === 'critical_db' ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: scenario === 'critical_db' ? '100%' : '35%' }}
            />
          </div>
        </div>

        {/* KPI 4: Active Anomalies */}
        <div className="card p-4 flex flex-col justify-between card-pop border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Error Events
            </span>
            <span className="text-[10px] font-mono text-slate-500">Cluster Total</span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">
              {scenario === 'critical_db' ? '11 Anomalies' : scenario === 'healthy_normal' ? '0 Anomalies' : '4 Anomalies'}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {scenario === 'critical_db' ? 'HikariCP timeout' : 'Clean stream'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            {latestLog ? `Latest: ${latestLog.message.substring(0, 30)}...` : 'Real-time telemetry stream synchronized'}
          </div>
        </div>
      </div>

      {/* ── Correlation Chart & Incident Timeline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Recharts Telemetry Area Chart (8 Cols) */}
        <div className="lg:col-span-8 card p-5 card-pop border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Live Telemetry Correlation (Error Rate vs Latency)</h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Error Rate (%)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Latency (ms)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="t" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090D1C', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  labelStyle={{ color: '#94A3B8' }}
                />
                {scenario === 'critical_db' && (
                  <ReferenceLine x="10:20" stroke="#3B82F6" strokeDasharray="3 3" label={{ value: 'Deploy v2.4', fill: '#3B82F6', fontSize: 10 }} />
                )}
                <Area type="monotone" dataKey="err" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#errGrad)" name="Error Rate %" />
                <Area type="monotone" dataKey="lat" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#latGrad)" name="Latency ms" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">Correlation Window: 10:00 - 10:30 UTC</span>
            <span className="text-emerald-400 font-mono">Statistical Correlation Coefficient: r = 0.984</span>
          </div>
        </div>

        {/* Right: Incident Timeline (4 Cols) */}
        <div className="lg:col-span-4 card p-5 card-pop border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Incident Timeline</h3>
              </div>
              <span className="badge badge-brand text-[10px]">INC-001</span>
            </div>

            <div className="space-y-4">
              {[
                { time: '10:20:00', title: 'Payment Service v2.4 deployed', desc: 'Deploy pipeline marked success', color: '#3B82F6', done: true },
                { time: '10:21:03', title: 'DB errors begin in logs', desc: 'HikariCP pool timeout on 11 workers', color: '#F59E0B', done: true },
                { time: '10:22:00', title: 'Error rate reaches 42.7%', desc: 'DB connections maxed at 100/100', color: '#EF4444', done: true },
                { time: '10:23:00', title: 'P0 Incident Declared', desc: 'AI correlation initiated root diagnosis', color: '#22C55E', done: true }
              ].map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 relative">
                  {idx < 3 && (
                    <div className="absolute left-2.5 top-6 bottom-0 w-0.5 bg-slate-800" />
                  )}
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-950 flex-shrink-0 z-10"
                    style={{ backgroundColor: step.color, boxShadow: `0 0 8px ${step.color}` }}
                  >
                    ✓
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">{step.time}</span>
                      <span className="text-[10px] text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-200">{step.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Total MTTR Elapsed:</span>
            <span className="text-xs font-mono font-bold text-emerald-400">03m 15s</span>
          </div>
        </div>

      </div>

      {/* ── Bottom Section: AI Root Cause & Ranked Solutions Preview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        
        {/* AI Root Cause Card (6 Cols) */}
        <div className="lg:col-span-6 card p-5 card-pop border border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">AI Incident Root Cause Analysis</h3>
            </div>
            <span className="badge badge-success text-xs font-mono">{analysis?.ai_investigation?.confidence_score || '90'}% Confidence</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/25">
            <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider mb-1">
              Correlated Root Cause
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {analysis?.ai_investigation?.root_cause || 'AI is actively analyzing the telemetry stream. Awaiting determination...'}
            </p>
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Evidence Chain Checklist
            </div>
            <div className="space-y-1.5">
              {(analysis?.ai_investigation?.evidence || ['Insufficient telemetry data to form evidence chain']).map((ev: string, i: number) => (
                <div key={i} className="text-xs font-mono text-slate-300 flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{ev}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/app/analysis"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <span>Explore deep correlation signals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>


        {/* Ranked Recommendations Preview (6 Cols) */}
        <div className="lg:col-span-6 card p-5 card-pop border border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Ranked Recommendations</h3>
            </div>
            <Link
              to="/app/recommendations"
              className="text-xs text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              View Full Evaluation <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {(analysis?.recommendation?.recommendations?.slice(0, 3) || []).map((rec: any, idx: number) => (
              <div
                key={rec.solution_id || idx}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs font-bold ${
                    idx === 0 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                  }`}>
                    0{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{rec.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-snug mt-0.5 line-clamp-2">{rec.reason}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {Math.round(rec.confidence || 0)}% Conf.
                  </span>
                </div>
              </div>
            ))}
            {!analysis?.recommendation?.recommendations && (
              <div className="text-xs text-slate-400 italic p-2">No recommendations available.</div>
            )}
          </div>

          {analysis?.remediation?.status && (
            <div className="pt-2 flex flex-col gap-1.5 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Remediation Status:</span>
                <span className="badge badge-warning text-[9px]">SIMULATION ONLY</span>
              </div>
              <div className="text-[11px] font-mono text-amber-400 break-all">
                {analysis.remediation.action_taken} ({analysis.remediation.status})
              </div>
              {analysis?.recovery_verification && (
                <div className="text-[10px] text-emerald-400 mt-1 flex justify-between">
                  <span>Recovery: {analysis.recovery_verification.verification_status}</span>
                  <span>Health: {Math.round(analysis.recovery_verification.pre_remediation_metrics?.health_score || 0)} → {Math.round(analysis.recovery_verification.post_remediation_metrics?.health_score || 0)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

        </>
      )}
    </div>
  );
};
