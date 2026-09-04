/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { LogEntry } from '../types';
import { Badge } from '../components/common/Badge';
import {
  Search, Filter, RefreshCw, ChevronDown, Download,
  AlertTriangle, Radio, Wifi, Clock, ArrowRight
} from 'lucide-react';

export const Logs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [anomaliesOnly, setAnomaliesOnly] = useState<boolean>(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);

  const fetchTelemetry = async () => {
    try {
      if (anomaliesOnly) {
        const anoms = await api.getAnomalies();
        setLogs(anoms);
      } else {
        const data = await api.getLogs(100);
        setLogs(data);
      }
    } catch (err) {
      console.error("Telemetry fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchTelemetry();
  }, [anomaliesOnly]);

  // Live polling effect
  useEffect(() => {
    if (!isLiveStreaming) return;
    const interval = setInterval(async () => {
      try {
        const latest = await api.getLatestLog();
        setLogs(prev => {
          if (prev.some(l => l.id === latest.id)) return prev;
          return [latest, ...prev.slice(0, 99)];
        });
      } catch (e) {
        // silent background poll error
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.traceId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity =
      severityFilter === 'ALL' || log.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6 animate-pop-up pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Radio className="w-6 h-6 text-emerald-400" />
            Live Telemetry & Event Stream
          </h1>
          <p className="text-slate-400 mt-1 text-xs">
            Ingesting from FastAPI telemetry generator (/logs & /anomalies)
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Live Streaming Toggle */}
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isLiveStreaming
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.2)]'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLiveStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
            <span>{isLiveStreaming ? 'Live Polling Active' : 'Live Polling Paused'}</span>
          </button>

          {/* Filter Anomalies Toggle */}
          <button
            onClick={() => setAnomaliesOnly(!anomaliesOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              anomaliesOnly
                ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{anomaliesOnly ? 'Showing Anomalies Only' : 'Filter Anomalies (/anomalies)'}</span>
          </button>

          <button
            onClick={() => { setLoading(true); fetchTelemetry(); }}
            className="btn btn-ghost text-xs px-3 py-1.5 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="bg-[#090D1A] border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-230px)] shadow-xl">
        
        {/* Filters Header */}
        <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/60 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Filter by message, service (e.g. payment-service), or trace ID..." 
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono">Severity:</span>
            {(['ALL', 'CRITICAL', 'ERROR', 'WARN', 'INFO'] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                  severityFilter === sev
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin mr-2 text-emerald-400" />
              Ingesting telemetry from endpoint...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs">
              No telemetry events matched the current filters.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-slate-500 text-[10px] uppercase font-mono tracking-wider border-b border-slate-800/80 sticky top-0 bg-[#090D1A] z-10">
                  <th className="py-2 px-3 w-[140px]">Timestamp</th>
                  <th className="py-2 px-3 w-[100px]">Severity</th>
                  <th className="py-2 px-3 w-[160px]">Service</th>
                  <th className="py-2 px-3 w-[130px]">Trace ID</th>
                  <th className="py-2 px-3">Message</th>
                  <th className="py-2 px-3 w-[100px] text-right">Latency</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {filteredLogs.map((log) => {
                  const isErr = log.severity === 'ERROR' || log.severity === 'CRITICAL';
                  return (
                    <tr
                      key={log.id}
                      className={`border-b border-slate-900/60 transition-colors hover:bg-slate-800/40 ${
                        isErr ? 'bg-red-950/15 text-red-200' : 'text-slate-300'
                      }`}
                    >
                      <td className="py-2 px-3 text-slate-400 whitespace-nowrap text-[11px]">{log.timestamp}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.severity === 'CRITICAL'
                            ? 'bg-red-500 text-white'
                            : log.severity === 'ERROR'
                            ? 'bg-red-900/60 text-red-300 border border-red-800/50'
                            : log.severity === 'WARN'
                            ? 'bg-amber-900/60 text-amber-300 border border-amber-800/50'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-200 font-semibold">{log.service}</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">{log.traceId}</td>
                      <td className="py-2 px-3 text-slate-200 text-xs">{log.message}</td>
                      <td className="py-2 px-3 text-right text-emerald-400">{log.latency || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 px-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Showing {filteredLogs.length} events</span>
          <span>FastAPI Telemetry Stream: Active</span>
        </div>

      </div>
    </div>
  );
};
