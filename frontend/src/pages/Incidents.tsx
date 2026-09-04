import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Incident } from '../types';
import { Badge } from '../components/common/Badge';
import { AlertOctagon, Search, Filter, Plus, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Incidents: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    const fetchIncidents = async () => {
      setLoading(true);
      const data = await api.getIncidents();
      setIncidents(data);
      setLoading(false);
    };
    fetchIncidents();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <AlertOctagon className="w-6 h-6 text-indigo-500" />
            Active Incidents
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Manage and investigate ongoing infrastructure issues</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md text-sm font-medium text-white transition-colors">
            <Plus className="w-4 h-4" />
            Declare Incident
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
          <div className="relative flex-1 min-w-[300px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by ID, title, or service..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-slate-500"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-2 bg-slate-950 border border-slate-800 rounded-md text-slate-400 hover:text-white transition-colors">
              <Filter className="w-4 h-4" />
            </button>
            <div className="flex bg-slate-950 border border-slate-800 rounded-md p-1">
              <button 
                onClick={() => setView('list')}
                className={`p-1 rounded ${view === 'list' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-300'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setView('grid')}
                className={`p-1 rounded ${view === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-300'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500">Loading incidents...</div>
        ) : view === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="pb-3 font-medium px-4">Incident</th>
                  <th className="pb-3 font-medium px-4">Severity</th>
                  <th className="pb-3 font-medium px-4">Status</th>
                  <th className="pb-3 font-medium px-4">Service</th>
                  <th className="pb-3 font-medium px-4">Duration</th>
                  <th className="pb-3 font-medium px-4">AI Confidence</th>
                  <th className="pb-3 font-medium px-4"></th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {incidents.map((incident) => (
                  <tr key={incident.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                    <td className="py-4 px-4">
                      <div className="font-medium text-white mb-1">{incident.title}</div>
                      <div className="text-slate-500 text-xs font-mono">{incident.id}</div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={incident.severity}>{incident.severity}</Badge>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-slate-300 bg-slate-800 px-2 py-1 rounded text-xs">{incident.status}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-300">{incident.service}</td>
                    <td className="py-4 px-4 text-slate-400">{incident.duration}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500" 
                            style={{ width: `${incident.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-slate-400">{incident.confidence}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link 
                        to={`/incidents/${incident.id}`}
                        className="inline-flex items-center justify-center p-2 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Grid view implementation can go here, similar to the cards on the command center */}
            {incidents.map(incident => (
              <div key={incident.id} className="bg-slate-950 border border-slate-800 rounded-lg p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-slate-400">{incident.id}</span>
                    <Badge variant={incident.severity}>{incident.severity}</Badge>
                  </div>
                </div>
                <h3 className="text-white font-medium mb-3">{incident.title}</h3>
                <div className="text-sm text-slate-400 mb-4">{incident.service}</div>
                <Link to={`/incidents/${incident.id}`} className="text-sm text-indigo-400 hover:text-indigo-300">
                  View Details &rarr;
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
