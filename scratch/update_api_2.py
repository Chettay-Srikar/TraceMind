import os

def update_api():
    with open("frontend/src/services/api.ts", "r", encoding="utf-8") as f:
        content = f.read()

    run_analysis_code = """
  runAnalysis: async (): Promise<TraceMindAnalysisResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds

    cachedAnalysisPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/analysis/run`, {
          method: 'POST',
          headers: await getAuthHeaders(),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          cachedAnalysisPromise = null;
          throw new Error(errorData.detail || `Analysis run failed: ${res.status}`);
        }
        
        isBackendLive = true;
        const data = await res.json();
        
        let mappedRecommendations = mockRecommendations;
        if (data.recommendation && data.recommendation.recommendations) {
          mappedRecommendations = data.recommendation.recommendations.map((r: any, idx: number) => ({
            id: r.solution_id || `sol_${idx}`,
            rank: r.rank || idx + 1,
            title: r.title || "Unknown Title",
            description: r.reason || "No description provided.",
            category: "Investigation & Root Fix",
            effectiveness: r.confidence > 80 ? "High" : (r.confidence > 50 ? "Medium" : "Low"),
            risk: "Medium", 
            reversible: true,
            blastRadius: "Service",
            estimatedRecovery: "Unknown",
            evidenceBasis: r.strengths || [],
            tradeoffs: Array.isArray(r.tradeoffs) ? r.tradeoffs.join(", ") : (r.tradeoffs || ""),
            whyThisRank: r.reason || "",
            externalSources: []
          }));
        }
        
        lastFetchTime = Date.now();
        return {
          ...defaultSimulatedAnalysis,
          ...data,
          recommendations: mappedRecommendations,
          relevant_providers: mockProviders
        };
      } catch (err) {
        clearTimeout(timeoutId);
        isBackendLive = false;
        cachedAnalysisPromise = null;
        throw err;
      }
    })();
    
    return cachedAnalysisPromise;
  },
"""
    
    # We will insert runAnalysis right before getIncidents
    target = "  // Supporting legacy/supplementary getters"
    if target in content:
        content = content.replace(target, run_analysis_code + "\n" + target)
        with open("frontend/src/services/api.ts", "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated api.ts")
    else:
        print("Could not find insertion point")

update_api()
