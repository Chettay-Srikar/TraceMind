import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RelevantProvider } from '../types';
import {
  Search, ExternalLink, ShieldCheck, Cpu, Activity,
  Database, CheckCircle2, Sparkles, Layers, Info
} from 'lucide-react';

export const Providers: React.FC = () => {
  const [providers, setProviders] = useState<RelevantProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        const data = await api.getProviders();
        setProviders(data);
      } catch (err) {
        console.error("Failed to load providers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProviders();
  }, []);

  return (
    <div className="space-y-6 animate-pop-up pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-mono text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EXTERNAL SOLUTION INTELLIGENCE & PROVIDER MAPPING</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Layers className="w-7 h-7 text-emerald-400" />
            Technology Platform Discovery
          </h1>
          <p className="text-xs mt-1 text-slate-400 max-w-2xl leading-relaxed">
            Incident-class-specific platform ranking and capability evaluation for database connection exhaustion and deployment regressions.
          </p>
        </div>

        <div className="card px-3.5 py-2 flex items-center gap-2.5 text-xs bg-slate-900 border border-slate-800">
          <span className="dot-live" />
          <span className="text-slate-400">Context Class:</span>
          <span className="font-mono text-white font-bold">PostgreSQL Connection Saturation</span>
        </div>
      </div>

      {/* ── Defensible Positioning Callout Banner ── */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-blue-500/30 flex items-start gap-3.5 text-xs text-slate-300">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block mb-0.5">Defensible Evaluation Principle:</strong>
          The system avoids making unverified claims like <em>"Vendor X will fix this incident."</em> Instead, it evaluates and presents:
          <span className="text-emerald-400 font-medium"> "Vendor provides capabilities relevant to investigating and managing this class of incident."</span>
          This ensures technical credibility for SRE teams and architecture boards.
        </div>
      </div>

      {/* ── Ranked Platform Cards ── */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 card">
            Researching and mapping relevant technology platforms...
          </div>
        ) : (
          providers.map((prov) => (
            <div
              key={prov.id}
              className="card p-5 border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all card-pop space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm text-slate-950"
                    style={{ backgroundColor: prov.logoColor, boxShadow: `0 0 15px ${prov.logoColor}60` }}
                  >
                    0{prov.rank}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{prov.name}</h3>
                      <span className="text-xs text-slate-400 font-mono">({prov.category})</span>
                    </div>
                    <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                      Target Capability: {prov.relevantCapability}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right mr-2">
                    <div className="text-xs font-mono font-bold text-white">{prov.confidenceScore}% Fit</div>
                    <div className="text-[10px] text-slate-500 font-mono">Relevance Score</div>
                  </div>
                  <span className="badge badge-brand text-[10px]">{prov.integrationStatus}</span>
                </div>
              </div>

              {/* Defensible Statement Quote */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1">
                  Incident-Specific Evaluation:
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans italic">
                  "{prov.defensibleStatement}"
                </p>
              </div>

              {/* Key Incident Relevant Features */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Correlated Technical Capabilities
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {prov.keyFeatures.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
