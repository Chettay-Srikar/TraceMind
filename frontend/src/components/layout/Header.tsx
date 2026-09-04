import React from 'react';
import { Bell, Search, ChevronDown, Clock } from 'lucide-react';

export const Header: React.FC = () => (
  <header className="h-14 flex items-center justify-between px-6 sticky top-0 z-30"
    style={{ background: '#060B18', borderBottom: '1px solid #1E293B' }}>

    {/* Left */}
    <div className="flex items-center gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#334155' }} />
        <input
          type="text"
          placeholder="Search incidents, services..."
          className="bg-[#0E1223] border border-[#1E293B] rounded-lg pl-9 pr-4 py-2 text-xs w-64 outline-none transition-colors placeholder:text-[#334155]"
          style={{ color: '#94A3B8' }}
          onFocus={e => { e.currentTarget.style.borderColor = '#22C55E'; e.currentTarget.style.color = '#F8FAFC'; }}
          onBlur={e => { e.currentTarget.style.borderColor = '#1E293B'; e.currentTarget.style.color = '#94A3B8'; }}
        />
      </div>

      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium select-none"
        style={{ background: '#0E1223', border: '1px solid #1E293B', color: '#94A3B8' }}>
        <Clock className="w-3 h-3" />
        <span>Last 30 min</span>
        <ChevronDown className="w-3 h-3 ml-0.5" />
      </div>
    </div>

    {/* Right */}
    <div className="flex items-center gap-3">
      {/* Live badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
        style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}>
        <span className="dot-live" />
        Live
      </div>

      <div className="divider-v h-5" />

      {/* Incident counter */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
        <span className="dot-critical" />
        3 Active
      </div>

      <div className="divider-v h-5" />

      {/* Bell */}
      <button className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[#0E1223]"
        style={{ color: '#64748B' }}>
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
      </button>

      {/* Avatar */}
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
        style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#020617' }}>
        U
      </div>
    </div>
  </header>
);
