/* eslint-disable */
import React, { useState, useEffect } from 'react';
import {
  Cpu, Database, CheckCircle2, AlertTriangle, ShieldCheck,
  Zap, ArrowRight, Clock, HelpCircle, ExternalLink,
  BookOpen, Layers, BarChart2, ChevronRight, X, Sparkles, Filter
} from 'lucide-react';
import { api } from '../services/api';
import { RankedRecommendation, RelevantProvider, TraceMindAnalysisResponse } from '../types';

export const Recommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RankedRecommendation[]>([]);
  const [providers, setProviders] = useState<RelevantProvider[]>([]);
  const [analysis, setAnalysis] = useState<TraceMindAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Immediate' | 'Investigation' | 'Capacity' | 'Architectural'>('All');
  const [selectedRec, setSelectedRec] = useState<RankedRecommendation | null>(null);
  const [showWhyModal, setShowWhyModal] = useState<boolean>(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [recsData, provData, analysisData] = await Promise.all([
          api.getRecommendations(),
          api.getProviders(),
          api.getAnalysis()
        ]);
        setRecommendations(recsData);
        setProviders(provData);
        setAnalysis(analysisData);
        if (recsData.length > 0) {
          setSelectedRec(recsData[0]);
        }
      } catch (err) {
        console.error("Failed to load recommendations data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredRecs = recommendations.filter(r => {
    if (filter === 'All') return true;
    if (filter === 'Immediate') return r.category.includes('Immediate');
    if (filter === 'Investigation') return r.category.includes('Investigation');
    if (filter === 'Capacity') return r.category.includes('Capacity');
    if (filter === 'Architectural') return r.category.includes('Architectural');
    return true;
  });

  const getEffectivenessBadge = (eff: 'High' | 'Medium' | 'Low') => {
    switch (eff) {
      case 'High':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">HIGH EFFECTIVENESS</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">MEDIUM EFFECTIVENESS</span>;
      case 'Low':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">LOW EFFECTIVENESS</span>;
    }
  };

  const getRiskBadge = (risk: 'Low' | 'Medium' | 'High') => {
    switch (risk) {
      case 'Low':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">LOW RISK</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">MEDIUM RISK</span>;
      case 'High':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-500/15 text-red-400 border border-red-500/30">HIGH RISK</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-pop-up">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-mono text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI INCIDENT REMEDIATION & RANKING ENGINE</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            Remediation Recommendations
          </h1>
          <p className="text-xs mt-1 text-slate-400 max-w-2xl">
            Synthesized remediation strategies extracted from external engineering docs, cloud best practices, and correlated telemetry evidence.
          </p>
        </div>

        {/* Incident Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="card px-3.5 py-2 flex items-center gap-2.5 text-xs bg-slate-900/90 border border-emerald-500/30 shadow-lg">
            <span className="dot-critical" />
            <span className="text-slate-400">Active Incident:</span>
            <span className="font-mono text-white font-bold">INC-001</span>
            <span className="text-slate-500">|</span>
            <span className="font-mono text-emerald-400">payment-service v2.4</span>
          </div>

          <button
            onClick={() => {
              if (recommendations.length > 0) {
                setSelectedRec(recommendations[0]);
                setShowWhyModal(true);
              }
            }}
            className="btn btn-primary text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:scale-105 transition-transform"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why #1 Recommendation?</span>
          </button>
        </div>
      </div>

      {/* ── Intelligence Ribbon ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="card p-4 flex flex-col justify-between card-pop border border-emerald-500/20 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" /> AI Confidence
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#22c55e]" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">
                {analysis?.confidence || 94}%
              </span>
              <span className="text-[11px] font-semibold text-emerald-400">High Certainty</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full" style={{ width: '94%' }} />
            </div>
          </div>
          <div className="text-[11px] text-slate-400">Correlated across 3 data sources</div>
        </div>

        {/* Metric 2 */}
        <div className="card p-4 flex flex-col justify-between card-pop border border-emerald-500/20 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-emerald-400" /> Top Action MTTR
            </span>
            <span className="badge badge-brand text-[10px] py-0 px-1.5">v2.4 → v2.3</span>
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">1 - 2 min</span>
            <div className="text-[11px] text-slate-300 mt-1">Reversible container image rollback</div>
          </div>
          <div className="text-[11px] text-slate-400">Zero data schema conflict</div>
        </div>

        {/* Metric 3 */}
        <div className="card p-4 flex flex-col justify-between card-pop border border-emerald-500/20 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Root Cause Suspect
            </span>
            <span className="badge badge-warning text-[10px] py-0 px-1.5">P0 Critical</span>
          </div>
          <div className="my-2">
            <div className="text-sm font-bold font-mono text-white truncate">DB Pool Exhaustion</div>
            <div className="text-[11px] text-slate-300 mt-0.5">100/100 active connections</div>
          </div>
          <div className="text-[11px] text-slate-400">Began 10:21:03 post-deploy</div>
        </div>

        {/* Metric 4 */}
        <div className="card p-4 flex flex-col justify-between card-pop border border-emerald-500/20 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-emerald-400" /> Ranking Factors
            </span>
            <span className="text-[10px] font-mono text-slate-400">5 Weighted Dimensions</span>
          </div>
          <div className="my-2">
            <div className="text-sm font-semibold text-white">Relevance + Risk + Impact</div>
            <div className="text-[11px] text-slate-300 mt-0.5">+ Reversibility & Evidence</div>
          </div>
          <div className="text-[11px] text-slate-400">Transparent decision criteria</div>
        </div>
      </div>

      {/* ── Main 2-Column Layout: Recommendations List + Deep Detail Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Column: Ranked List (7 Cols) ── */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card p-5 card-pop border border-slate-800 bg-slate-900/70">
            
            {/* List Header & Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white leading-tight">Evidence-Based Solution Ranking</h2>
                  <span className="text-[11px] text-slate-400">Ordered by expected effectiveness, reversibility, and blast radius</span>
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs overflow-x-auto">
                {(['All', 'Immediate', 'Investigation', 'Capacity', 'Architectural'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${
                      filter === tab
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* List Cards */}
            <div className="space-y-3.5">
              {filteredRecs.map((rec) => {
                const isSelected = selectedRec?.id === rec.id;
                const isTopPick = rec.rank === 1;

                return (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedRec(rec)}
                    className={`p-4 rounded-xl transition-all cursor-pointer relative overflow-hidden border ${
                      isTopPick
                        ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950 hover:border-emerald-400'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    } ${isSelected ? 'ring-2 ring-emerald-400/60 shadow-lg' : ''}`}
                  >
                    {/* Top pick badge indicator */}
                    {isTopPick && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="badge badge-brand text-[10px] tracking-wider font-mono font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> #1 RECOMMENDED ACTION
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          Optimal MTTR · Lowest Risk
                        </span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5 ${
                            isTopPick
                              ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(34,197,94,0.4)]'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          0{rec.rank}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white hover:text-emerald-300 transition-colors leading-snug">
                            {rec.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[11px] text-slate-400 font-mono">
                              Category: <span className="text-slate-200">{rec.category}</span>
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              Est. Recovery: <span className="text-emerald-400">{rec.estimatedRecovery}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {getEffectivenessBadge(rec.effectiveness)}
                        {getRiskBadge(rec.risk)}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-3 pl-9">
                      {rec.description}
                    </p>

                    {/* Tradeoff / Caution callout */}
                    <div className="pl-9 mb-3">
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] flex items-start gap-2 text-slate-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-200">Tradeoff Analysis: </strong>
                          <span className="text-slate-400">{rec.tradeoffs}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Actionable Insights */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 pl-9 flex-wrap gap-2">
                      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                        <span>Reversible: <strong className={rec.reversible ? 'text-emerald-400' : 'text-amber-400'}>{rec.reversible ? 'YES' : 'NO'}</strong></span>
                        <span>•</span>
                        <span>Blast Radius: <strong className="text-slate-200">{rec.blastRadius}</strong></span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRec(rec);
                          setShowWhyModal(true);
                        }}
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20"
                      >
                        <span>View "Why This Rank" Evidence</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right Column: Selected Action Deep Dive & Research Sources (5 Cols) ── */}
        <div className="lg:col-span-5 space-y-4">
          
          {selectedRec && (
            <div className="card p-5 card-pop border border-slate-800 bg-slate-900/70 space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">
                    0{selectedRec.rank}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Evaluation & Evidence</h3>
                    <span className="text-[10px] text-slate-400 font-mono">Detailed AI Ranking Justification</span>
                  </div>
                </div>
                {getEffectivenessBadge(selectedRec.effectiveness)}
              </div>

              {/* Title & Category */}
              <div>
                <h2 className="text-sm font-bold text-white mb-1">{selectedRec.title}</h2>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedRec.description}</p>
              </div>

              {/* Why This Rank Highlight Box */}
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Why Ranked #{selectedRec.rank}?
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {selectedRec.whyThisRank}
                </p>
              </div>

              {/* Correlated Evidence Checklist */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Supporting Telemetry Evidence</span>
                  <span className="text-[10px] font-mono text-emerald-400">{selectedRec.evidenceBasis.length} points verified</span>
                </div>
                <div className="space-y-2">
                  {selectedRec.evidenceBasis.map((ev, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300 leading-snug">{ev}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* External Technical Research Sources */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  External Technical Documentation & Research
                </div>
                <div className="space-y-2.5">
                  {selectedRec.externalSources.map((src, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-white flex items-center gap-1">
                          {src.title}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {src.sourceType}
                        </span>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono mb-1">{src.source}</div>
                      <p className="text-[11px] text-slate-400 leading-relaxed italic">
                        "{src.snippet}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ── Relevant Technology Providers Box ── */}
          <div className="card p-5 card-pop border border-slate-800 bg-slate-900/70 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/25">
                  <Database className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Relevant Solution Platforms</h3>
                  <span className="text-[10px] text-slate-400">Class-Specific Platform Capabilities</span>
                </div>
              </div>
              <span className="badge badge-brand text-[10px]">{providers.length} Mapped</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              These platforms provide specialized capabilities relevant to investigating, monitoring, and managing database connection pool incidents:
            </p>

            <div className="space-y-3">
              {providers.map((prov) => (
                <div
                  key={prov.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: prov.logoColor, boxShadow: `0 0 8px ${prov.logoColor}` }}
                      />
                      <span className="text-xs font-bold text-white">{prov.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">· {prov.category}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {prov.confidenceScore}% Fit
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 mb-2 leading-relaxed italic">
                    "{prov.defensibleStatement}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1.5 border-t border-slate-900">
                    <span className="truncate max-w-[240px] text-slate-400">{prov.relevantCapability}</span>
                    <span className="text-emerald-400 flex items-center gap-0.5 flex-shrink-0">
                      Evaluated <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* ── "Why This Rank?" Interactive Modal ── */}
      {showWhyModal && selectedRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-pop-up">
          <div className="card p-6 max-w-2xl w-full border border-emerald-500/40 bg-[#090E1F] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-mono font-bold text-base shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                  0{selectedRec.rank}
                </div>
                <div>
                  <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    Transparent Ranking Evaluation
                  </div>
                  <h2 className="text-base font-bold text-white leading-snug">
                    {selectedRec.title}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setShowWhyModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Why Statement */}
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                Why is this ranked #{selectedRec.rank}?
              </div>
              <p className="text-xs text-slate-100 leading-relaxed font-sans">
                {selectedRec.whyThisRank}
              </p>
            </div>

            {/* Correlated Evidence Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Correlated Telemetry Facts
              </h4>
              <div className="space-y-2">
                {selectedRec.evidenceBasis.map((ev, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">{ev}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk & Reversibility Analysis */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">Effectiveness</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">{selectedRec.effectiveness}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">Risk Profile</div>
                <div className="text-xs font-bold text-blue-400 mt-0.5">{selectedRec.risk} Risk</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">Reversibility</div>
                <div className="text-xs font-bold text-white mt-0.5">{selectedRec.reversible ? '100% Reversible' : 'Non-reversible'}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">Blast Radius</div>
                <div className="text-xs font-bold text-white mt-0.5">{selectedRec.blastRadius}</div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="text-[11px] text-slate-400">
                Based on Incident Correlation r = 0.984
              </div>
              <button
                onClick={() => setShowWhyModal(false)}
                className="btn btn-ghost text-xs px-4 py-1.5"
              >
                Close Breakdown
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
