import React from 'react';

export const StatusIndicator: React.FC<{
  status: 'critical' | 'warning' | 'healthy' | 'degraded' | 'info' | 'offline';
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ status, pulse = false, size = 'md', className = '' }) => {
  const colors = {
    critical: 'bg-red-500',
    warning: 'bg-orange-500',
    degraded: 'bg-amber-500',
    healthy: 'bg-emerald-500',
    info: 'bg-blue-500',
    offline: 'bg-slate-600',
  };

  const sizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className={`rounded-full ${colors[status]} ${sizes[size]}`}></div>
      {pulse && (
        <div className={`absolute rounded-full opacity-75 animate-ping ${colors[status]} ${sizes[size]}`}></div>
      )}
    </div>
  );
};
