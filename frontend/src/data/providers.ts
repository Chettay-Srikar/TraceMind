import { RelevantProvider } from "../types";

export const mockProviders: RelevantProvider[] = [
  {
    id: "prov-dynatrace",
    rank: 1,
    name: "Dynatrace",
    category: "AI Root-Cause Analysis & Observability",
    confidenceScore: 96,
    relevantCapability: "Davis AI deterministic causal analysis and automatic service dependency mapping",
    defensibleStatement: "Dynatrace provides capabilities relevant to automatically attributing database connection pool exhaustion directly to recent deployment code-level commits.",
    integrationStatus: "Recommended",
    logoColor: "#00A4E4",
    keyFeatures: [
      "Davis AI causal topology engine",
      "Automatic code-level JDBC connection leak detection",
      "Deployment event correlation with instant regression tagging",
      "PurePath distributed tracing with database lock telemetry"
    ]
  },
  {
    id: "prov-pagerduty",
    rank: 2,
    name: "PagerDuty",
    category: "Incident Response & Workflow Orchestration",
    confidenceScore: 92,
    relevantCapability: "Automated incident paging, stakeholder synchronization, and rollback workflow automation",
    defensibleStatement: "PagerDuty provides capabilities relevant to escalating critical P0 payment degradation and orchestrating approved rollback actions across SRE teams.",
    integrationStatus: "Recommended",
    logoColor: "#25C151",
    keyFeatures: [
      "Intelligent event-driven alerting with noise reduction",
      "Runbook automation integration for pre-approved rollbacks",
      "Cross-team stakeholder communication channels",
      "Comprehensive MTTR and post-incident analytics"
    ]
  },
  {
    id: "prov-datadog",
    rank: 3,
    name: "Datadog",
    category: "Unified Observability & Database Monitoring",
    confidenceScore: 89,
    relevantCapability: "Correlated APM metrics, PostgreSQL connection pool monitors, and continuous profiler",
    defensibleStatement: "Datadog provides capabilities relevant to correlating the 42.7% error rate spike with PostgreSQL host connection pool saturation in real time.",
    integrationStatus: "Supported",
    logoColor: "#632CA6",
    keyFeatures: [
      "Database Monitoring (DBM) with query explain plans",
      "Composite alert thresholds for error rate & latency anomalies",
      "Deployment tracking dashboards with automated metric diffing",
      "Live continuous thread profiling to pinpoint leaky routines"
    ]
  },
  {
    id: "prov-newrelic",
    rank: 4,
    name: "New Relic",
    category: "Full-Stack Observability & Tracing",
    confidenceScore: 84,
    relevantCapability: "End-to-end distributed tracing, slow query inspection, and change tracking",
    defensibleStatement: "New Relic provides capabilities relevant to measuring downstream customer latency impact (4800ms) and identifying stuck database transaction threads.",
    integrationStatus: "Supported",
    logoColor: "#1CE783",
    keyFeatures: [
      "NerdGraph telemetry correlation across microservices",
      "Deep PostgreSQL query acquisition latency metrics",
      "Change tracking annotations on production telemetry charts",
      "Automated anomaly detection on P95 and P99 service latency"
    ]
  }
];
