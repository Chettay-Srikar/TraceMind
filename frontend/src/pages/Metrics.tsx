import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Metric } from '../types';
import { BarChart2, Filter, Settings2, Download, AlertTriangle, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';

export const Metrics: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      const data = await api.getMetrics();
      setMetrics(data);
      setLoading(false);
    };
    fetchMetrics();
  }, []);

  const getChartData = (history: number[]) => {
    return history.map((val, idx) => ({
      time: `${idx * 5}m`,
      value: val
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-blue-500" />
            Telemetry Metrics
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Real-time performance and health metrics across all services</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-300">
            <Clock className="w-4 h-4" />
            <span>Last 1 hour</span>
          </div>
          <button className="p-2 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-md text-slate-300 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
          <button className="p-2 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-md text-slate-300 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Loading metrics...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {metrics.map((metric, idx) => {
            const isUp = metric.trend === 'up';
            const isCritical = metric.status === 'critical';
            const isWarning = metric.status === 'warning';
            const color = isCritical ? '#ef4444' : isWarning ? '#f97316' : '#10b981';
            const data = getChartData(metric.history);

            return (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-5 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white font-medium text-lg flex items-center gap-2">
                      {metric.name}
                      {isCritical && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="text-2xl font-bold text-slate-200">{metric.value}</div>
                      <div className={`flex items-center text-xs font-medium ${
                        isUp ? (isCritical ? 'text-red-400' : 'text-emerald-400') 
                             : (isCritical ? 'text-emerald-400' : 'text-slate-400')
                      }`}>
                        {isUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                        {metric.trendValue}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <StatusIndicator status={metric.status} />
                    <button className="text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Settings2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="h-40 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`color-${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={color} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="time" stroke="#475569" tick={{fill: '#64748b', fontSize: 10}} tickLine={false} axisLine={false} />
                      <YAxis stroke="#475569" tick={{fill: '#64748b', fontSize: 10}} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                        itemStyle={{ color: color }}
                      />
                      <Area type="monotone" dataKey="value" stroke={color} fillOpacity={1} fill={`url(#color-${idx})`} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
