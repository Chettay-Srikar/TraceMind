 
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Incident } from '../types';
import { Badge } from '../components/common/Badge';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { 
  ArrowLeft, Clock, AlertTriangle, ShieldAlert, Cpu, Activity, 
   Server, CheckCircle2, Share2,   Lightbulb
} from 'lucide-react';

export const IncidentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncident = async () => {
      if (id) {
        setLoading(true);
        const data = await api.getIncident(id);
        setIncident(data || null);
        setLoading(false);
      }
    };
    fetchIncident();
  }, [id]);

  if (loading) {
    return <div className="py-20 text-center text-slate-500 animate-pulse">Loading incident intelligence...</div>;
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-slate-600 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Incident not found</h2>
        <p className="text-slate-400 mb-6">The incident you're looking for doesn't exist or you don't have access.</p>
        <Link to="/incidents" className="text-indigo-400 hover:text-indigo-300">
          &larr; Back to Incidents
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Navigation */}
      <div>
        <Link to="/incidents" className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Incidents
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg font-mono text-slate-400">{incident.id}</span>
              <Badge variant={incident.severity} className="text-sm px-3 py-1">{incident.severity}</Badge>
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-sm">
                <StatusIndicator status="warning" pulse />
                <span className="text-slate-300 font-medium">{incident.status}</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{incident.title}</h1>
          </div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-md text-sm text-white transition-colors">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md text-sm font-medium text-white transition-colors">
              <CheckCircle2 className="w-4 h-4" />
              Resolve Incident
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Key Information */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Investigation Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Started</div>
                <div className="text-sm text-white">{new Date(incident.startedAt).toLocaleTimeString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Activity className="w-3 h-3"/> Duration</div>
                <div className="text-sm text-white">{incident.duration}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Server className="w-3 h-3"/> Affected Service</div>
                <div className="text-sm text-white">{incident.service}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Owner</div>
                <div className="text-sm text-white">{incident.owner}</div>
              </div>
            </div>
          </div>

          {/* AI Root Cause Analysis */}
          <div className="bg-slate-900 border border-purple-500/30 rounded-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4">
              <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-semibold">
                <Cpu className="w-3 h-3" />
                NEXUS AI
              </div>
            </div>
            
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                AI Incident Analysis
              </h2>
              <p className="text-slate-400 text-sm">Automated correlation and root cause detection</p>
              
              <div className="mt-6 bg-slate-950 border border-slate-800 rounded-lg p-5">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Likely Root Cause</div>
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold text-red-400">Database Connection Pool Exhaustion</div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">{incident.confidence}%</div>
                    <div className="text-xs text-slate-400">Confidence Score</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-900/50">
              <h3 className="text-sm font-semibold text-white mb-4">Supporting Evidence</h3>
              <ul className="space-y-3">
                {[
                  "Deployment v4.8.2 occurred 4 minutes before degradation",
                  "DB connection utilization increased from 61% → 100%",
                  "Connection acquisition failures increased 18×",
                  "Payment service latency increased 320%",
                  "Error pattern matches previous connection exhaustion events"
                ].map((evidence, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                    <div className="mt-0.5 min-w-[20px] text-emerald-500">✓</div>
                    {evidence}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Root Cause Graph Placeholder */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Causal Graph</h2>
              <button className="text-xs text-indigo-400 hover:text-indigo-300">Expand View</button>
            </div>
            
            <div className="h-64 bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center font-mono text-sm space-y-2 relative overflow-hidden">
              {/* Decorative background grid */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
              
              <div className="z-10 bg-slate-800 border border-slate-700 px-4 py-2 rounded shadow-lg text-slate-200">Deployment v4.8.2</div>
              <div className="z-10 h-6 w-px bg-slate-600"></div>
              <div className="z-10 bg-slate-800 border border-slate-700 px-4 py-2 rounded shadow-lg text-slate-200">Connection Usage Increase</div>
              <div className="z-10 h-6 w-px bg-slate-600"></div>
              <div className="z-10 bg-red-900/40 border border-red-500/50 px-4 py-2 rounded shadow-lg text-red-200 font-bold shadow-[0_0_15px_rgba(239,68,68,0.2)]">Database Pool Saturation</div>
              <div className="z-10 h-6 w-px bg-slate-600"></div>
              <div className="z-10 flex gap-4">
                <div className="bg-orange-900/30 border border-orange-500/40 px-4 py-2 rounded shadow-lg text-orange-200 text-xs">Request Failures</div>
                <div className="bg-orange-900/30 border border-orange-500/40 px-4 py-2 rounded shadow-lg text-orange-200 text-xs">Latency Increase</div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Right Column - Recommended Actions & Timeline */}
        <div className="space-y-6">
          
          <div className="bg-slate-900 border border-indigo-500/30 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              Recommended Actions
            </h2>
            
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg relative overflow-hidden group">
                <div className="absolute left-0 top-0 h-full w-1 bg-indigo-500"></div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-indigo-400">RANK 01</span>
                  <Badge variant="healthy" className="!text-[10px]">96% Confidence</Badge>
                </div>
                <h3 className="text-white font-medium mb-3">Rollback Payment Service v4.8.2</h3>
                <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                  <div>Risk: <span className="text-emerald-400">LOW</span></div>
                  <div>Impact: <span className="text-red-400">HIGH</span></div>
                </div>
                <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm text-white font-medium transition-colors">
                  Review & Execute
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg relative">
                <div className="absolute left-0 top-0 h-full w-1 bg-slate-700"></div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-slate-500">RANK 02</span>
                  <Badge variant="warning" className="!text-[10px]">87% Confidence</Badge>
                </div>
                <h3 className="text-slate-300 font-medium mb-2">Increase DB Connection Pool</h3>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div>Risk: <span className="text-orange-400">MEDIUM</span></div>
                </div>
              </div>
            </div>
            
            <Link to="/recommendations" className="block text-center text-sm text-indigo-400 hover:text-indigo-300 mt-4">
              View all 4 recommendations &rarr;
            </Link>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Incident Timeline</h2>
            
            <div className="relative border-l border-slate-800 ml-3 space-y-6">
              {[
                { time: "14:24:11", desc: "AI root cause confidence reached 94.7%", type: "ai" },
                { time: "14:22:04", desc: "Incident declared", type: "alert" },
                { time: "14:21:18", desc: "Incident correlation triggered", type: "system" },
                { time: "14:21:02", desc: "Error rate exceeded threshold", type: "metric" },
                { time: "14:20:13", desc: "Connection pool reached 80%", type: "metric" },
                { time: "14:19:41", desc: "Database connection usage increased", type: "metric" },
                { time: "14:17:08", desc: "Deployment v4.8.2 completed", type: "deploy" },
              ].map((event, i) => (
                <div key={i} className="relative pl-6">
                  <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                    event.type === 'alert' ? 'bg-red-500' :
                    event.type === 'ai' ? 'bg-purple-500' :
                    event.type === 'deploy' ? 'bg-blue-500' :
                    event.type === 'metric' ? 'bg-orange-500' : 'bg-slate-500'
                  }`}></div>
                  <div className="text-xs text-slate-500 font-mono mb-0.5">{event.time}</div>
                  <div className="text-sm text-slate-300">{event.desc}</div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
