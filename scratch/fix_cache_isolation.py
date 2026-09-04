import os

def update_api_cache_clear():
    with open("frontend/src/services/api.ts", "r", encoding="utf-8") as f:
        content = f.read()

    # Add clearAnalysisCache function to the api object
    clear_func = """
  clearAnalysisCache: () => {
    cachedAnalysisPromise = null;
    lastFetchTime = 0;
  },
"""
    # Insert it at the top of the api object
    target = "export const api = {"
    content = content.replace(target, target + "\n" + clear_func)

    with open("frontend/src/services/api.ts", "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated api.ts")

def update_auth_context():
    with open("frontend/src/contexts/AuthContext.tsx", "r", encoding="utf-8") as f:
        content = f.read()
        
    # Add api import
    import_target = "import { supabase } from '../lib/supabaseClient';"
    content = content.replace(import_target, import_target + "\nimport { api } from '../services/api';")

    # Add cache clear on SIGNED_OUT
    listener_target = """    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });"""
    
    new_listener = """    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (event === 'SIGNED_OUT') {
        api.clearAnalysisCache();
      }
    });"""
    
    content = content.replace(listener_target, new_listener)
    
    with open("frontend/src/contexts/AuthContext.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated AuthContext.tsx")

update_api_cache_clear()
update_auth_context()
