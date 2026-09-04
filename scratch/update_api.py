import os
import re

def update_api():
    with open("frontend/src/services/api.ts", "r") as f:
        content = f.read()
        
    # Add supabase import
    import_addition = """} from '../types';
import { supabase } from '../lib/supabaseClient';"""
    content = content.replace("} from '../types';", import_addition)
    
    # Add getAuthHeaders helper
    headers_helper = """
// Helper to check live backend status
export const checkBackendStatus = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${API_BASE_URL}/`, { signal: controller.signal });
    clearTimeout(timeoutId);
    isBackendLive = res.ok;
    return isBackendLive;
  } catch {
    isBackendLive = false;
    return false;
  }
};

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
};
"""
    content = content.replace("""
// Helper to check live backend status
export const checkBackendStatus = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${API_BASE_URL}/`, { signal: controller.signal });
    clearTimeout(timeoutId);
    isBackendLive = res.ok;
    return isBackendLive;
  } catch {
    isBackendLive = false;
    return false;
  }
};""", headers_helper)

    # Replace all fetch calls to inject getAuthHeaders()
    # 1. getRoot
    content = content.replace(
        "const res = await fetch(`${API_BASE_URL}/`, { cache: 'no-cache' });",
        "const res = await fetch(`${API_BASE_URL}/`, { cache: 'no-cache', headers: await getAuthHeaders() });"
    )
    
    # 2. getHealth
    content = content.replace(
        "const res = await fetch(`${API_BASE_URL}/health`, { cache: 'no-cache' });",
        "const res = await fetch(`${API_BASE_URL}/health`, { cache: 'no-cache', headers: await getAuthHeaders() });"
    )
    
    # 3. getLogs
    content = content.replace(
        "const res = await fetch(`${API_BASE_URL}/logs?limit=${limit}`, { cache: 'no-cache' });",
        "const res = await fetch(`${API_BASE_URL}/logs?limit=${limit}`, { cache: 'no-cache', headers: await getAuthHeaders() });"
    )
    
    # 4. getLatestLog
    content = content.replace(
        "const res = await fetch(`${API_BASE_URL}/logs/latest`, { cache: 'no-cache' });",
        "const res = await fetch(`${API_BASE_URL}/logs/latest`, { cache: 'no-cache', headers: await getAuthHeaders() });"
    )
    
    # 5. getAnomalies
    content = content.replace(
        "const res = await fetch(`${API_BASE_URL}/anomalies`, { cache: 'no-cache' });",
        "const res = await fetch(`${API_BASE_URL}/anomalies`, { cache: 'no-cache', headers: await getAuthHeaders() });"
    )
    
    # 6. getAnalysis
    content = content.replace(
        """const res = await fetch(`${API_BASE_URL}/analysis`, { 
          cache: 'no-cache',
          signal: controller.signal
        });""",
        """const res = await fetch(`${API_BASE_URL}/analysis`, { 
          cache: 'no-cache',
          headers: await getAuthHeaders(),
          signal: controller.signal
        });"""
    )
    
    # 7. Add uploadTelemetry method
    upload_method = """  getProviders: async (): Promise<RelevantProvider[]> => {
    return mockProviders;
  },

  uploadTelemetry: async (file: File): Promise<{ status: string; imported_count: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const headers = await getAuthHeaders();
    // Do not set Content-Type for FormData, the browser handles the boundary
    const res = await fetch(`${API_BASE_URL}/logs/import`, {
      method: 'POST',
      headers,
      body: formData
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Upload failed: ${res.status}`);
    }
    
    // Clear analysis cache since new logs were added
    cachedAnalysisPromise = null;
    return await res.json();
  }
};"""
    content = content.replace("""  getProviders: async (): Promise<RelevantProvider[]> => {
    return mockProviders;
  }
};""", upload_method)

    with open("frontend/src/services/api.ts", "w") as f:
        f.write(content)

update_api()
