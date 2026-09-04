/* eslint-disable */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Cpu, Zap, ChevronRight } from 'lucide-react';
import { ShaderBackground } from '../components/common/ShaderBackground';

const features = [
  {
    num: '01', icon: Shield,
    title: 'Detect with context',
    desc: 'Unify logs, metrics, deployments, and service health into one operational signal. No manual correlation.',
    accent: '#22C55E', tag: 'Ingestion',
  },
  {
    num: '02', icon: Cpu,
    title: 'AI Root Cause Analysis',
    desc: 'Trace the causal chain from first anomaly to root cause with explainable, confidence-scored evidence.',
    accent: '#3B82F6', tag: 'Intelligence',
  },
  {
    num: '03', icon: Zap,
    title: 'Respond faster',
    desc: 'Ranked, risk-weighted actions let your team move from alert to resolution in minutes, not hours.',
    accent: '#F59E0B', tag: 'Remediation',
  },
];

const stats = [
  { value: '148',    label: 'Services monitored' },
  { value: '94%',    label: 'AI confidence avg.' },
  { value: '< 2 min',label: 'Avg. time to detect' },
  { value: '6',      label: 'Global regions' },
];

export const LandingPage: React.FC = () => (
  <div
    className="min-h-screen relative"
    style={{ color: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif' }}
  >
    {/* ── WebGL Shader — fixed behind entire page ── */}
    <div className="fixed inset-0 z-0 pointer-events-none">
      <ShaderBackground />
    </div>

    {/* ── Dark overlay tint for readability (full page) ── */}
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: 'rgba(2,6,23,0.55)' }}
    />

    {/* ── Nav ── */}
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-8"
      style={{ background: 'rgba(2,6,23,0.7)', borderBottom: '1px solid rgba(30,41,59,0.8)', backdropFilter: 'blur(16px)' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)' }}>
          <span className="text-[10px] font-black text-[#020617]">TM</span>
        </div>
        <span className="text-sm font-bold text-white tracking-tight">TraceMind</span>
        <span
          className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
          style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.25)' }}
        >
          BETA
        </span>
      </div>

      <div className="hidden md:flex items-center gap-8 text-xs font-medium" style={{ color: '#94A3B8' }}>
        {['Platform', 'Intelligence', 'Integrations', 'Pricing'].map(l => (
          <a key={l} href="#" className="transition-colors hover:text-white">{l}</a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <a href="#" className="text-xs font-medium transition-colors" style={{ color: '#94A3B8' }}>Sign in</a>
        <Link to="/app" className="btn btn-primary text-xs">
          Open Dashboard <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </nav>

    {/* ────────────────────────────────────────────
        All sections: position relative z-10 so they
        sit above the fixed shader layer.
    ──────────────────────────────────────────── */}

    {/* ── Hero ── */}
    <section className="relative z-10 flex flex-col items-center text-center px-6 pt-36 pb-24 min-h-[88vh] justify-center">
      <div className="animate-fade-up max-w-4xl">
        {/* Pill */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-semibold"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E' }}
        >
          <span className="dot-live" />
          TraceMind 2.4 · Powered by AI
        </div>

        <h1 className="font-black tracking-tight leading-[1.05] mb-6" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
          <span style={{ color: '#F8FAFC' }}>See the signal.</span><br />
          <span className="text-gradient-brand">Resolve the incident.</span>
        </h1>

        <p className="text-base max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: '#94A3B8' }}>
          AI-powered incident intelligence that correlates logs, metrics, deployments, and service health
          into a single, actionable operational picture.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/app" className="btn btn-primary">
            Open Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <button className="btn btn-ghost">Watch demo</button>
        </div>
      </div>

      {/* Stats strip */}
      <div
        className="relative z-10 mt-20 grid grid-cols-2 md:grid-cols-4 gap-px rounded-xl overflow-hidden w-full max-w-3xl"
        style={{ border: '1px solid rgba(30,41,59,0.6)', background: 'rgba(30,41,59,0.4)' }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            className="px-6 py-5 text-center"
            style={{ background: 'rgba(14,18,35,0.65)', backdropFilter: 'blur(8px)' }}
          >
            <div className="text-2xl font-black tracking-tight text-gradient-brand">{s.value}</div>
            <div className="text-[11px] mt-1" style={{ color: '#64748B' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>

    {/* ── Features ── */}
    <section
      className="relative z-10 py-24 px-6"
      style={{ borderTop: '1px solid rgba(30,41,59,0.5)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'rgba(2,6,23,0.45)', backdropFilter: 'blur(0px)' }}
      />
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-label text-green-500 mb-4">ONE OPERATIONAL LAYER</div>
          <h2 className="text-h1 font-bold text-white mb-4">From first signal to clear action.</h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: '#94A3B8' }}>
            TraceMind gives SRE and DevOps teams the clarity to move through high-pressure incidents with precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.num}
              className="relative overflow-hidden rounded-xl p-7 flex flex-col group transition-all duration-300"
              style={{
                background: 'rgba(14,18,35,0.7)',
                border: '1px solid rgba(30,41,59,0.8)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${f.accent}50`; e.currentTarget.style.background = 'rgba(14,18,35,0.85)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,41,59,0.8)'; e.currentTarget.style.background = 'rgba(14,18,35,0.7)'; }}
            >
              <div className="absolute top-4 right-4 font-mono text-xs" style={{ color: 'rgba(30,41,59,0.8)' }}>{f.num}</div>

              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${f.accent}15`, border: `1px solid ${f.accent}30` }}
              >
                <f.icon className="w-5 h-5" style={{ color: f.accent }} />
              </div>

              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm mb-3 w-fit"
                style={{ background: `${f.accent}15`, color: f.accent }}
              >
                {f.tag}
              </span>

              <h3 className="text-h3 font-bold text-white mb-2">{f.title}</h3>
              <p className="text-xs leading-relaxed flex-1" style={{ color: '#94A3B8' }}>{f.desc}</p>

              <div
                className="flex items-center gap-1 mt-5 text-xs font-semibold transition-all duration-200 group-hover:translate-x-1"
                style={{ color: f.accent }}
              >
                Learn more <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Method Diagram ── */}
    <section
      className="relative z-10 py-24 px-6"
      style={{ borderTop: '1px solid rgba(30,41,59,0.5)' }}
    >
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-20">
        <div className="flex-1">
          <div className="text-label text-green-500 mb-5">THE TRACEMIND METHOD</div>
          <h2 className="text-h1 font-bold mb-6">
            <span style={{ color: '#F8FAFC' }}>Signals become</span><br />
            <span style={{ color: '#64748B' }}>understanding.</span>
          </h2>
          <p className="text-sm leading-relaxed mb-8 max-w-md" style={{ color: '#94A3B8' }}>
            When systems change faster than teams can inspect them, TraceMind builds the operational picture automatically.
          </p>
          <Link to="/app" className="btn btn-ghost group">
            Explore Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Diagram card */}
        <div
          className="flex-1 w-full rounded-xl overflow-hidden relative"
          style={{ height: 340, background: 'rgba(6,11,24,0.75)', border: '1px solid rgba(30,41,59,0.7)', backdropFilter: 'blur(12px)' }}
        >
          <div
            className="absolute inset-0"
            style={{ backgroundImage: 'linear-gradient(rgba(30,41,59,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(30,41,59,0.4) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
          />
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            <path d="M 135 110 L 300 185" stroke="#22C55E" strokeWidth="1.5" strokeDasharray="5 3" fill="none" opacity="0.5" />
            <path d="M 300 185 L 210 290" stroke="#22C55E" strokeWidth="1.5" fill="none" opacity="0.4" />
            <path d="M 135 110 L 210 290" stroke="#1E293B" strokeWidth="1" fill="none" />
          </svg>

          {[
            { top: 75,  left: 55,  accent: '#22C55E', num: '01', title: 'Telemetry',   sub: 'Logs · Metrics · Health' },
            { top: 160, right: 55, accent: '#3B82F6', num: '02', title: 'Correlation', sub: 'Signals become clusters' },
            { bottom: 55, left: 140, accent: '#F59E0B', num: '03', title: 'Resolution', sub: 'Ranked next actions' },
          ].map((n, i) => (
            <div
              key={i}
              className="absolute z-10 p-4 rounded-xl w-44 transition-all duration-200"
              style={{
                ...(n.top !== undefined    ? { top: n.top }       : { bottom: (n as any).bottom }),
                ...(n.left !== undefined   ? { left: n.left }      : { right:  (n as any).right  }),
                background: 'rgba(14,18,35,0.85)',
                border: `1px solid ${n.accent}30`,
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = n.accent)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = `${n.accent}30`)}
            >
              <div className="text-[10px] font-mono mb-1" style={{ color: n.accent }}>{n.num}</div>
              <div className="text-sm font-bold text-white mb-0.5">{n.title}</div>
              <div className="text-[11px]" style={{ color: '#64748B' }}>{n.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── CTA ── */}
    <section
      className="relative z-10 py-24 px-6 text-center"
      style={{ borderTop: '1px solid rgba(30,41,59,0.5)' }}
    >
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="text-label text-green-500 mb-6">READY WHEN YOU ARE</div>
        <h2
          className="font-black tracking-tight leading-[1.05] mb-8"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#F8FAFC' }}
        >
          Make the next incident<br />
          <span style={{ color: '#64748B' }}>your clearest one yet.</span>
        </h2>
        <Link to="/app" className="btn btn-primary text-base px-8 py-3.5">
          Open TraceMind <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>

    {/* ── Footer ── */}
    <footer
      className="relative z-10 py-6 text-center text-xs"
      style={{ borderTop: '1px solid rgba(30,41,59,0.5)', color: '#334155' }}
    >
      © {new Date().getFullYear()} TraceMind · AI Incident Intelligence Platform · Built for operations excellence.
    </footer>
  </div>
);
