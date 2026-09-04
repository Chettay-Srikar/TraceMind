/* eslint-disable */
export interface Incident {
  id: string;
  title: string;
  severity: "critical" | "warning" | "degraded";
  service: string;
  status: "Investigating" | "Mitigating" | "Monitoring" | "Resolved";
  errorRate: number;
  latency: number;
  confidence: number;
  startedAt: string;
  duration: string;
  owner?: string;
  detected?: string;
  affectedServices?: string[];
  customerImpact?: "High" | "Medium" | "Low";
}

export interface Metric {
  name: string;
  value: string;
  trend: "up" | "down" | "flat";
  trendValue: string;
  status: "healthy" | "warning" | "critical";
  history: number[];
}

export interface ServiceNode {
  id: string;
  name: string;
  status: "healthy" | "warning" | "critical" | "degraded";
  errorRate: number;
  latency: number;
  dependencies?: string[];
  availability?: string;
  lastDeployment?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  severity: "ERROR" | "WARN" | "INFO" | "DEBUG" | "CRITICAL";
  service: string;
  traceId: string;
  message: string;
  latency?: string;
  source: string;
}

export interface Deployment {
  id: string;
  version: string;
  service: string;
  environment: string;
  deployedAt: string;
  risk: "HIGH" | "MEDIUM" | "LOW";
  previousHealth: number;
  currentHealth: number;
  status: "Investigating" | "Stable" | "Rolled Back";
}

// ── Backend API Endpoints Types (/health, /logs, /anomalies, /analysis) ──

export interface ApiRootResponse {
  message: string;
}

export interface SystemHealthResponse {
  api_status: "online" | "degraded" | "offline";
  mongodb_status: "connected" | "disconnected" | "simulated";
  total_logs: number;
  health_score: number; // 0 - 100
  severity: "HEALTHY" | "DEGRADED" | "WARNING" | "CRITICAL";
  active_anomalies_count?: number;
  timestamp?: string;
}

export interface StatisticalMetrics {
  error_rate_percent: number;
  p95_latency_ms: number;
  db_connections: number;
  max_db_connections: number;
  cpu_usage_percent?: number;
  memory_usage_percent?: number;
  rps?: number;
}

export interface EvidenceItem {
  id: string;
  timestamp: string;
  category: "deployment" | "metric" | "log" | "cascade";
  title: string;
  description: string;
  verified: boolean;
  delta?: string;
}

export interface ExternalResearchItem {
  source: string;
  sourceType: "Official Docs" | "Cloud Provider" | "Engineering Post" | "SRE Playbook";
  title: string;
  url?: string;
  snippet: string;
  relevance: "Direct Match" | "High" | "Supplementary";
}

export interface RankedRecommendation {
  id: string;
  rank: number;
  title: string;
  description: string;
  category: "Immediate Remediation" | "Investigation & Root Fix" | "Capacity Mitigation" | "Architectural Defense";
  effectiveness: "High" | "Medium" | "Low";
  risk: "Low" | "Medium" | "High";
  reversible: boolean;
  blastRadius: "Isolated" | "Service" | "Platform";
  estimatedRecovery: string;
  evidenceBasis: string[];
  tradeoffs: string;
  whyThisRank: string;
  externalSources: ExternalResearchItem[];
}

export interface RelevantProvider {
  id: string;
  rank: number;
  name: string;
  category: string;
  relevantCapability: string;
  defensibleStatement: string;
  confidenceScore: number;
  integrationStatus: "Recommended" | "Supported" | "Native";
  logoColor: string;
  keyFeatures: string[];
}

export interface TraceMindAnalysisResponse {
  health_score: number;
  severity: "CRITICAL" | "WARNING" | "DEGRADED" | "HEALTHY";
  anomaly_score: number;
  affected_service: string;
  service_version: string;
  incident_type: string;
  root_cause: string;
  confidence: number;
  recommended_action: string;
  evidence: string[] | EvidenceItem[];
  statistical_metrics: StatisticalMetrics;
  recommendations?: RankedRecommendation[];
  relevant_providers?: RelevantProvider[];
  research_sources?: ExternalResearchItem[];
  // New backend pipeline blocks
  incident?: any;
  ai_investigation?: any;
  solution_intelligence?: any;
  recommendation?: any;
  remediation?: any;
  recovery_verification?: any;
  ai_provider?: string;
  ai_status?: string;
}

// Backward compatibility alias
export type Recommendation = RankedRecommendation;
export type Provider = RelevantProvider;
