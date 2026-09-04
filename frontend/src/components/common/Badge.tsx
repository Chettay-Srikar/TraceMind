import React from 'react';

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'critical' | 'warning' | 'healthy' | 'degraded' | 'info';
  className?: string;
}> = ({ children, variant = 'info', className = '' }) => {
  const variants = {
    critical: 'bg-red-500/10 text-red-500 border-red-500/20',
    warning: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    degraded: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    healthy: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
