/* eslint-disable */
import {
  Incident,
  LogEntry,
  Metric,
  ServiceNode,
  Deployment,
  RankedRecommendation,
  RelevantProvider,
  SystemHealthResponse,
  TraceMindAnalysisResponse,
  ApiRootResponse
} from '../types';
import { mockIncidents } from '../data/incidents';
import { mockLogs } from '../data/logs';
import { mockMetrics } from '../data/metrics';
import { mockServices } from '../data/services';
import { mockDeployments } from '../data/deployments';
import { mockRecommendations } from '../data/recommendations';
import { mockProviders } from '../data/providers';

// Configurable API base URL, defaults to local FastAPI backend
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// In-memory flag to track live backend reachability
let isBackendLive = false;

// Cache for the expensive /analysis endpoint
let cachedAnalysisPromise: Promise<TraceMindAnalysisResponse> | null = null;
let lastFetchTime = 0;

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

export const getBackendLiveState = () => isBackendLive;

// Default simulated analysis response
const defaultSimulatedAnalysis: TraceMindAnalysisResponse = {
  health_score: 34,
  severity: "CRITICAL",
  anomaly_score: 94.7,
  affected_service: "payment-service",
  service_version: "v2.4",
  incident_type: "Database Connection Pool Exhaustion",
  root_cause: "Payment Service v2.4 deployment at 10:20:00 is strongly correlated with database connection pool exhaustion (100/100 active handles) and an immediate 42.7% error rate spike.",
  confidence: 94,
  recommended_action: "Rollback payment-service v2.4 → v2.3 to release exhausted database connections immediately.",
  evidence: [
    "Payment Service v2.4 deployed at 10:20:00",
    "Database errors began 63 seconds later at 10:21:03",
    "Database connections surged from 35/100 to maximum 100/100",
    "Error rate increased from baseline 1.2% to 42.7%",
    "P95 response latency increased from 180ms to 4,800ms"
  ],
  statistical_metrics: {
    error_rate_percent: 42.7,
    p95_latency_ms: 4800,
    db_connections: 100,
    max_db_connections: 100,
    cpu_usage_percent: 71,
    memory_usage_percent: 68,
    rps: 1420
  },
  recommendations: mockRecommendations,
  relevant_providers: mockProviders
};

export const api = {
  /**
   * Endpoint 1: GET /
   * Confirms API is running.
   */
  getRoot: async (): Promise<ApiRootResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      isBackendLive = true;
      return await res.json();
    } catch {
      isBackendLive = false;
      return { message: "TraceMind API (Simulated Observability Store)" };
    }
  },

  /**
   * Endpoint 2: GET /health
   * Returns overall system status including API health, MongoDB connection status,
   * total log count, and health/anomaly summary.
   */
  getHealth: async (): Promise<SystemHealthResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      isBackendLive = true;
      const data = await res.json();
      return {
        api_status: data.api_status || "online",
        mongodb_status: data.mongodb_status || "connected",
        total_logs: data.total_logs ?? 1420,
        health_score: data.health_score ?? 34,
        severity: data.severity || "CRITICAL",
        active_anomalies_count: data.active_anomalies_count ?? 11,
        timestamp: data.timestamp || new Date().toISOString()
      };
    } catch {
      isBackendLive = false;
      return {
        api_status: "degraded",
        mongodb_status: "simulated",
        total_logs: mockLogs.length,
        health_score: 34,
        severity: "CRITICAL",
        active_anomalies_count: 5,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Endpoint 3: GET /logs
   * Retrieves most recent telemetry logs from the database, sorted newest first.
   */
  getLogs: async (limit: number = 50): Promise<LogEntry[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/logs?limit=${limit}`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      isBackendLive = true;
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((item: any, idx: number) => ({
          id: item.id || item._id || `log-${idx}`,
          timestamp: item.timestamp || new Date().toISOString(),
          severity: (item.level || item.severity || "INFO").toUpperCase(),
          service: item.service || "unknown-service",
          traceId: item.trace_id || item.traceId || `tr_${Math.random().toString(36).substring(7)}`,
          message: item.message || JSON.stringify(item),
          latency: item.latency_ms ? `${item.latency_ms}ms` : item.latency,
          source: item.source || item.service || "runtime"
        }));
      }
      return mockLogs;
    } catch {
      isBackendLive = false;
      return mockLogs.slice(0, limit);
    }
  },

  /**
   * Endpoint 4: GET /logs/latest
   * Returns only the single newest log document.
   */
  getLatestLog: async (): Promise<LogEntry> => {
    try {
      const res = await fetch(`${API_BASE_URL}/logs/latest`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      isBackendLive = true;
      const item = await res.json();
      return {
        id: item.id || item._id || 'log-latest',
        timestamp: item.timestamp || new Date().toISOString(),
        severity: (item.level || item.severity || "INFO").toUpperCase(),
        service: item.service || "payment-service",
        traceId: item.trace_id || item.traceId || "tr_latest",
        message: item.message || "Latest telemetry event",
        latency: item.latency_ms ? `${item.latency_ms}ms` : item.latency,
        source: item.source || item.service || "runtime"
      };
    } catch {
      isBackendLive = false;
      return mockLogs[0];
    }
  },

  /**
   * Endpoint 5: GET /anomalies
   * Filters and returns only logs that have a level of WARNING, ERROR, or CRITICAL.
   */
  getAnomalies: async (): Promise<LogEntry[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/anomalies`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      isBackendLive = true;
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((item: any, idx: number) => ({
          id: item.id || item._id || `anom-${idx}`,
          timestamp: item.timestamp || new Date().toISOString(),
          severity: (item.level || item.severity || "ERROR").toUpperCase(),
          service: item.service || "payment-service",
          traceId: item.trace_id || item.traceId || "tr_anom",
          message: item.message || "Anomalous event",
          latency: item.latency_ms ? `${item.latency_ms}ms` : item.latency,
          source: item.source || item.service || "runtime"
        }));
      }
      return mockLogs.filter(l => l.severity === "ERROR" || l.severity === "WARN" || l.severity === "CRITICAL");
    } catch {
      isBackendLive = false;
      return mockLogs.filter(l => l.severity === "ERROR" || l.severity === "WARN" || l.severity === "CRITICAL");
    }
  },

  /**
   * Endpoint 6: GET /analysis
   * Triggers the analysis engine on the logs. Evaluates incident deterministically and uses AI integration.
   */
  getAnalysis: async (): Promise<TraceMindAnalysisResponse> => {
    const now = Date.now();
    if (cachedAnalysisPromise && (now - lastFetchTime < 15000)) {
        return cachedAnalysisPromise;
    }

    cachedAnalysisPromise = (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      try {
        const res = await fetch(`${API_BASE_URL}/analysis`, { 
          cache: 'no-cache',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
            risk: "Medium", // Default mapping
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
        cachedAnalysisPromise = null; // Do NOT cache failed/aborted requests
        return defaultSimulatedAnalysis;
      }
    })();
    
    return cachedAnalysisPromise;
  },

  // Supporting legacy/supplementary getters
  getIncidents: async (): Promise<Incident[]> => {
    return mockIncidents;
  },

  getIncident: async (id: string): Promise<Incident | undefined> => {
    return mockIncidents.find(inc => inc.id === id);
  },

  getMetrics: async (): Promise<Metric[]> => {
    return mockMetrics;
  },

  getServices: async (): Promise<ServiceNode[]> => {
    return mockServices;
  },

  getDeployments: async (): Promise<Deployment[]> => {
    return mockDeployments;
  },

  getRecommendations: async (): Promise<RankedRecommendation[]> => {
    try {
      const analysis = await api.getAnalysis();
      return analysis.recommendations || mockRecommendations;
    } catch {
      return mockRecommendations;
    }
  },

  getProviders: async (): Promise<RelevantProvider[]> => {
    return mockProviders;
  }
};
