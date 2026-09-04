import os
import re

def update_command_center():
    with open("frontend/src/pages/CommandCenter.tsx", "r", encoding="utf-8") as f:
        content = f.read()

    # Add imports
    import_addition = """import { Activity, ShieldAlert, Zap, Layers, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { LogImportCenter } from '../components/import/LogImportCenter';"""
    content = content.replace("import { Activity, ShieldAlert, Zap, Layers, RefreshCw } from 'lucide-react';\nimport { api } from '../services/api';", import_addition)

    # Change the loading logic
    logic_addition = """  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const h = await api.getHealth();
        setHealth(h);
        
        // If total_logs is 0, we don't need to load the rest yet
        if (h.total_logs === 0) {
          setLoading(false);
          return;
        }

        const [a, l] = await Promise.all([
          api.getAnalysis(),
          api.getLogs(5)
        ]);
        
        setAnalysis(a);
        setLogs(l);
      } catch (err) {
        console.error('Failed to load command center data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]);"""
    
    # We replace the old useEffect with logic_addition
    old_use_effect = """  useEffect(() => {
    const fetchData = async () => {
      try {
        const [h, a, l] = await Promise.all([
          api.getHealth(),
          api.getAnalysis(),
          api.getLogs(5)
        ]);
        
        setHealth(h);
        setAnalysis(a);
        setLogs(l);
      } catch (err) {
        console.error('Failed to load command center data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);"""
    
    content = content.replace(old_use_effect, logic_addition)

    # Add condition for LogImportCenter
    render_condition = """  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  // If no logs, show the Log Import Center
  if (health?.total_logs === 0) {
    return (
      <LogImportCenter 
        onSuccess={() => setRefreshKey(prev => prev + 1)} 
      />
    );
  }

  if (!analysis) return null;"""
    
    old_render = """  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  if (!analysis) return null;"""

    content = content.replace(old_render, render_condition)

    with open("frontend/src/pages/CommandCenter.tsx", "w", encoding="utf-8") as f:
        f.write(content)

update_command_center()
