import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Deployment } from '../types';
import { GitPullRequest, Search, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, Clock } from 'lucide-react';

export const Deployments: React.FC = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeployments = async () => {
      setLoading(true);
      const data = await api.getDeployments();
      setDeployments(data);
      setLoading(false);
    };
    fetchDeployments();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <GitPullRequest className="w-6 h-6 text-blue-500" />
            Deployment Intelligence
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Track change impact and deployment-related regressions</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[300px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by version, service, or environment..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-500"
            />
          </div>
        </div>

        {/* Deployments Table */}
        <div className="flex-1 overflow-auto bg-slate-950 p-4">
          {loading ? (
            <div className="py-20 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading deployments...
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="pb-3 px-4 font-medium">Version / Service</th>
                  <th className="pb-3 px-4 font-medium">Environment</th>
                  <th className="pb-3 px-4 font-medium">Deployed</th>
                  <th className="pb-3 px-4 font-medium">Change Risk</th>
                  <th className="pb-3 px-4 font-medium">Pre-Deploy Health</th>
                  <th className="pb-3 px-4 font-medium">Current Health</th>
                  <th className="pb-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {deployments.map((deployment) => {
                  const healthDiff = deployment.currentHealth - deployment.previousHealth;
                  const isDegraded = healthDiff < -5;
                  
                  return (
                    <tr key={deployment.id} className={`border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors ${isDegraded ? 'bg-red-500/5' : ''}`}>
                      <td className="py-4 px-4">
                        <div className="font-mono text-indigo-400 font-medium mb-1">{deployment.version}</div>
                        <div className="text-slate-300 text-sm">{deployment.service}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs">{deployment.environment}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {deployment.deployedAt}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className={`text-xs font-bold ${
                          deployment.risk === 'HIGH' ? 'text-red-500' :
                          deployment.risk === 'MEDIUM' ? 'text-orange-500' : 'text-emerald-500'
                        }`}>
                          {deployment.risk}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-300">
                        {deployment.previousHealth}%
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isDegraded ? 'text-red-400' : 'text-slate-300'}`}>
                            {deployment.currentHealth}%
                          </span>
                          {isDegraded && (
                            <span className="text-xs text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                              {healthDiff}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          {deployment.status === 'Investigating' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          {deployment.status === 'Stable' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          {deployment.status === 'Rolled Back' && <AlertCircle className="w-4 h-4 text-orange-500" />}
                          <span className={`text-sm ${
                            deployment.status === 'Investigating' ? 'text-red-400' :
                            deployment.status === 'Stable' ? 'text-emerald-400' : 'text-orange-400'
                          }`}>{deployment.status}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
