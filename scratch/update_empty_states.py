import os
import re

def add_empty_state_to_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    empty_state = """  if (analysis?.metrics?.total_log_count === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <Layers className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No incident data yet</h2>
        <p className="text-slate-400 max-w-md mb-8">
          Upload your application telemetry in the Command Center to generate incident intelligence.
        </p>
        <Link to="/app" className="btn btn-primary px-6 py-2.5">
          Go to Command Center
        </Link>
      </div>
    );
  }

  return ("""

    content = content.replace("  return (", empty_state, 1)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

add_empty_state_to_file("frontend/src/pages/AIAnalysis.tsx")
add_empty_state_to_file("frontend/src/pages/Recommendations.tsx")
add_empty_state_to_file("frontend/src/pages/Incidents.tsx")
add_empty_state_to_file("frontend/src/pages/Metrics.tsx")
