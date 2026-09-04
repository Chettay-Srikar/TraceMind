import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

interface WithEmptyStateProps {
  children: React.ReactNode;
}

export const WithEmptyState: React.FC<WithEmptyStateProps> = ({ children }) => {
  const [hasData, setHasData] = useState<boolean | null>(null);

  useEffect(() => {
    const checkData = async () => {
      try {
        const [health, analysis] = await Promise.all([
          api.getHealth(),
          api.getAnalysis()
        ]);
        setHasData(health.total_logs > 0 && analysis !== null);
      } catch {
        setHasData(false);
      }
    };
    checkData();
  }, []);

  if (hasData === null) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <Layers className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No incident data yet</h2>
        <p className="text-slate-400 max-w-md mb-8">
          Upload telemetry and run analysis in the Command Center to generate incident intelligence.
        </p>
        <Link to="/app" className="btn btn-primary px-6 py-2.5">
          Go to Command Center
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};
