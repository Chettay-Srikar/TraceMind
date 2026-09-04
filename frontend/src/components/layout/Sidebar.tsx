/* eslint-disable */
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BrainCircuit, Lightbulb,
  ShieldAlert, Activity, BarChart3, GitCommit, Layers
} from 'lucide-react';

const nav = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard', to: '/app', icon: LayoutDashboard, end: true },
    ],
  },
  {
    group: 'AI Intelligence',
    items: [
      { label: 'Incident Intelligence', to: '/app/analysis', icon: BrainCircuit },
      { label: 'Recommendations', to: '/app/recommendations', icon: Lightbulb },
      { label: 'Platform Discovery', to: '/app/providers', icon: Layers },
    ],
  },
  {
    group: 'Operations',
    items: [
      { label: 'Active Incidents', to: '/app/incidents', icon: ShieldAlert },
    ],
  },
  {
    group: 'Observability',
    items: [
      { label: 'Live Telemetry', to: '/app/logs', icon: Activity },
      { label: 'Metrics', to: '/app/metrics', icon: BarChart3 },
    ],
  },
  {
    group: 'Changes',
    items: [
      { label: 'Deployments', to: '/app/deployments', icon: GitCommit },
    ],
  },
];

export const Sidebar: React.FC = () => (
  <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col z-40"
    style={{ background: '#080D1A', borderRight: '1px solid #1E293B' }}>

    {/* Logo */}
    <div className="flex items-center gap-3 px-5 h-14" style={{ borderBottom: '1px solid #1E293B' }}>
      <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)' }}>
        <span className="text-[10px] font-black text-white tracking-tight">TM</span>
      </div>
      <div>
        <div className="text-sm font-bold text-white tracking-tight leading-none">TraceMind</div>
        <div className="text-[9px] font-medium mt-0.5" style={{ color: '#22C55E' }}>AI INCIDENT INTEL</div>
      </div>
    </div>

    {/* Navigation */}
    <nav className="flex-1 overflow-y-auto py-4 px-3">
      {nav.map((group) => (
        <div key={group.group} className="mb-5">
          <div className="section-label mb-2">{group.group}</div>
          {group.items.map((item) => {
            const { label, to, icon: Icon } = item;
            const end = 'end' in item ? (item as any).end : undefined;
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `nav-item mb-0.5 ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>

    {/* User */}
    <div className="p-3" style={{ borderTop: '1px solid #1E293B' }}>
      <div className="sidebar-user-card flex items-center gap-3 p-2.5 rounded-lg cursor-pointer">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#020617] flex-shrink-0"
          style={{ background: '#22C55E' }}>
          U
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-white truncate">User</div>
          <div className="text-[10px] truncate" style={{ color: '#64748B' }}>user@company.com</div>
        </div>
      </div>
    </div>
  </aside>
);
